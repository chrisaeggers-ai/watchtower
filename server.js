require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const Anthropic = require('@anthropic-ai/sdk');
const nodemailer = require('nodemailer');
const { 
  FRUITVALE_NVR_SOP,
  FRUITVALE_FIRE_PANEL_SOP,
  FRUITVALE_ELECTRIC_FENCE_SOP,
  FRUITVALE_ACCESS_CONTROL_INFO
} = require('./knowledge-base');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/images', express.static('images'));

// Initialize services
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Email setup
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// In-memory conversation state
const conversationState = new Map();

// Configuration
const CONFIG = {
  TWILIO_PHONE: process.env.TWILIO_PHONE_NUMBER,
  SUPERVISOR_PHONE: process.env.SUPERVISOR_PHONE || '+1234567890',
  OWNER_EMAIL: process.env.OWNER_EMAIL,
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:3000',
  MAX_RETRIES: 2
};

// All available SOPs
const ALL_SOPS = [
  FRUITVALE_NVR_SOP,
  FRUITVALE_FIRE_PANEL_SOP,
  FRUITVALE_ELECTRIC_FENCE_SOP,
  FRUITVALE_ACCESS_CONTROL_INFO
];

// Detect which SOP is needed
function detectSOP(message) {
  const lowerMessage = message.toLowerCase();
  
  for (const sop of ALL_SOPS) {
    const matches = sop.triggerPhrases.some(phrase => 
      lowerMessage.includes(phrase.toLowerCase())
    );
    
    if (matches) {
      return { sop, issue: sop.title };
    }
  }
  
  return null;
}

// Check for confirmation
function isConfirmation(message) {
  const confirmPhrases = ['done', 'yes', 'yeah', 'yep', 'ok', 'okay', 'ready', 'good', 'got it', 'finished', 'complete', 'there', 'im there', "i'm there", 'inside', 'all set', 'set'];
  const lowerMessage = message.toLowerCase().trim();
  return confirmPhrases.some(phrase => lowerMessage.includes(phrase));
}

// Check if confused
function isConfused(message) {
  const confusedPhrases = ['idk', "i don't know", 'confused', 'what', 'huh', 'dont understand', "don't understand", 'help', 'stuck', 'lost', 'unclear'];
  const lowerMessage = message.toLowerCase().trim();
  return confusedPhrases.some(phrase => lowerMessage.includes(phrase));
}

// Send SMS/MMS
async function sendSMS(to, message, imageUrl = null) {
  try {
    const messageData = {
      body: message,
      from: CONFIG.TWILIO_PHONE,
      to: to
    };
    
    if (imageUrl) {
      messageData.mediaUrl = [imageUrl];
    }
    
    await twilioClient.messages.create(messageData);
    console.log(`${imageUrl ? 'MMS' : 'SMS'} sent to ${to}: ${message.substring(0, 50)}...`);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Send email report
async function sendEmailReport(guardPhone, issue, resolved, steps) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured - skipping report');
    return;
  }
  
  const status = resolved ? 'RESOLVED ✅' : 'ESCALATED ⚠️';
  const subject = `WatchTower Report: ${issue} - ${status}`;
  
  const htmlContent = `
    <h2>WatchTower Incident Report</h2>
    <p><strong>Status:</strong> ${status}</p>
    <p><strong>Guard Phone:</strong> ${guardPhone}</p>
    <p><strong>Issue:</strong> ${issue}</p>
    <p><strong>Date/Time:</strong> ${new Date().toLocaleString()}</p>
    <hr>
    <h3>Steps Completed:</h3>
    <ul>
      ${steps.map(step => `<li>Step ${step.stepNumber}: ${step.instruction}</li>`).join('')}
    </ul>
    ${!resolved ? '<p><strong>⚠️ Issue was escalated to supervisor.</strong></p>' : ''}
  `;

  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: CONFIG.OWNER_EMAIL,
      subject: subject,
      html: htmlContent
    });
    console.log(`Email report sent for ${issue}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Escalate to supervisor
async function escalateToSupervisor(guardPhone, issue, currentStep) {
  const escalationMessage = `🚨 Guard at ${guardPhone} needs help with: ${issue}\n\nThey're stuck at Step ${currentStep}. Please contact them ASAP.`;
  
  await sendSMS(CONFIG.SUPERVISOR_PHONE, escalationMessage);
  await sendSMS(guardPhone, "I'm connecting you with your supervisor who will help you directly. They'll reach out shortly.");
  
  const state = conversationState.get(guardPhone);
  await sendEmailReport(guardPhone, issue, false, state.completedSteps || []);
  
  console.log(`Escalated issue for ${guardPhone}`);
}

// Main conversation handler
async function handleConversation(guardPhone, message) {
  let state = conversationState.get(guardPhone) || {
    active: false,
    currentStep: 0,
    issue: null,
    activeSOP: null,
    retries: 0,
    completedSteps: [],
    startTime: null
  };

  // New conversation
  if (!state.active) {
    const detected = detectSOP(message);
    
    if (detected) {
      state = {
        active: true,
        currentStep: 1,
        issue: detected.issue,
        activeSOP: detected.sop,
        retries: 0,
        completedSteps: [],
        startTime: new Date()
      };
      conversationState.set(guardPhone, state);
      
      const firstStep = detected.sop.steps[0];
      const imageUrl = firstStep.image ? `${CONFIG.SERVER_URL}/images/${firstStep.image}` : null;
      
      await sendSMS(guardPhone, firstStep.userFriendly, imageUrl);
      return null;
    } else {
      // General question - use Claude AI
      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: message }],
          system: 'You are WatchTower, a helpful SMS assistant for security guards at Fruitvale industrial facility. Keep responses concise and professional for SMS format.'
        });
        
        return response.content[0].text;
      } catch (error) {
        console.error('Claude API error:', error);
        return "I'm having trouble right now. Please text your supervisor.";
      }
    }
  }

  // Active troubleshooting
  if (state.active && state.activeSOP) {
    // Check if confused
    if (isConfused(message)) {
      state.retries += 1;
      
      if (state.retries >= CONFIG.MAX_RETRIES) {
        await escalateToSupervisor(guardPhone, state.issue, state.currentStep);
        conversationState.delete(guardPhone);
        return null;
      }
      
      conversationState.set(guardPhone, state);
      return `No worries! Let me explain Step ${state.currentStep} differently:\n\n${state.activeSOP.steps[state.currentStep - 1].instruction}\n\nStill stuck? Just text "help" and I'll connect you with your supervisor.`;
    }

    // Check for confirmation
    if (isConfirmation(message)) {
      state.completedSteps.push(state.activeSOP.steps[state.currentStep - 1]);
      state.retries = 0;
      state.currentStep += 1;
      
      // Check if complete
      if (state.currentStep > state.activeSOP.steps.length) {
        await sendEmailReport(guardPhone, state.issue, true, state.completedSteps);
        conversationState.delete(guardPhone);
        
        await sendSMS(guardPhone, "🎉 Perfect! You're all done. Great job! Let me know if you need anything else.");
        return null;
      }
      
      // Send next step
      const nextStep = state.activeSOP.steps[state.currentStep - 1];
      const imageUrl = nextStep.image ? `${CONFIG.SERVER_URL}/images/${nextStep.image}` : null;
      conversationState.set(guardPhone, state);
      
      await sendSMS(guardPhone, nextStep.userFriendly, imageUrl);
      return null;
    } else {
      // Unclear response
      state.retries += 1;
      
      if (state.retries >= CONFIG.MAX_RETRIES) {
        await escalateToSupervisor(guardPhone, state.issue, state.currentStep);
        conversationState.delete(guardPhone);
        return null;
      }
      
      conversationState.set(guardPhone, state);
      return `I didn't catch that. Are you done with Step ${state.currentStep}? Just text 'done' or 'yes' when ready, or 'help' if stuck.`;
    }
  }
}

// Twilio webhook
app.post('/sms', async (req, res) => {
  const guardPhone = req.body.From;
  const message = req.body.Body;
  
  console.log(`Received from ${guardPhone}: ${message}`);
  
  try {
    const response = await handleConversation(guardPhone, message);
    
    if (response) {
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(response);
      res.type('text/xml').send(twiml.toString());
      console.log(`Response sent: ${response.substring(0, 50)}...`);
    } else {
      res.sendStatus(200);
    }
  } catch (error) {
    console.error('Error:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Sorry, I'm having technical difficulties. Please call the office.");
    res.type('text/xml').send(twiml.toString());
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'WatchTower is running!', 
    activeConversations: conversationState.size,
    availableSOPs: ALL_SOPS.length
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🗼 WatchTower is running on port ${PORT}`);
  console.log(`📱 Webhook URL: ${CONFIG.SERVER_URL}/sms`);
  console.log(`📚 Available SOPs: ${ALL_SOPS.length}`);
  ALL_SOPS.forEach(sop => console.log(`   - ${sop.title}`));
});
