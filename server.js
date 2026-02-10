require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const Anthropic = require('@anthropic-ai/sdk');
const nodemailer = require('nodemailer');
const { FRUITVALE_NVR_SOP } = require('./knowledge-base');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve images statically for MMS
app.use('/images', express.static('images'));

// Serve images directory as static files
app.use('/images', express.static(__dirname + '/images'));

// Initialize Anthropic Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Initialize Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// In-memory conversation state (use Redis/database in production)
const conversationState = new Map();

// Configuration
const CONFIG = {
  TWILIO_PHONE: process.env.TWILIO_PHONE_NUMBER,
  SUPERVISOR_PHONE: process.env.SUPERVISOR_PHONE || '+1234567890', // Chris's number - update later
  OWNER_EMAIL: process.env.OWNER_EMAIL,
  MAX_RETRIES: 2, // How many times to retry before escalating
  SERVER_URL: process.env.SERVER_URL || 'http://your-domain.com' // Update with your ngrok or deployed URL
};

// Helper: Detect if message indicates camera/NVR issue
function detectCameraIssue(message) {
  const lowerMessage = message.toLowerCase();
  return FRUITVALE_NVR_SOP.triggerPhrases.some(phrase => 
    lowerMessage.includes(phrase.toLowerCase())
  );
}

// Helper: Check if user is confirming/ready
function isConfirmation(message) {
  const confirmPhrases = [
    'done', 'yes', 'yeah', 'yep', 'ok', 'okay', 'ready', 
    'good', 'got it', 'finished', 'complete', 'there', 
    'im there', "i'm there", 'inside'
  ];
  const lowerMessage = message.toLowerCase().trim();
  return confirmPhrases.some(phrase => lowerMessage.includes(phrase));
}

// Helper: Check if user is confused
function isConfused(message) {
  const confusedPhrases = [
    'idk', "i don't know", 'confused', 'what', 'huh', 
    'dont understand', "don't understand", 'help', 
    'stuck', 'lost', 'unclear'
  ];
  const lowerMessage = message.toLowerCase().trim();
  return confusedPhrases.some(phrase => lowerMessage.includes(phrase));
}

// Helper: Send SMS/MMS via Twilio
async function sendSMS(to, message, imageUrl = null) {
  try {
    const messageParams = {
      body: message,
      from: CONFIG.TWILIO_PHONE,
      to: to
    };
    
    // Add media URL if image is provided
    if (imageUrl) {
      messageParams.mediaUrl = [imageUrl];
    }
    
    await twilioClient.messages.create(messageParams);
    console.log(`${imageUrl ? 'MMS' : 'SMS'} sent to ${to}: ${message.substring(0, 50)}...`);
  } catch (error) {
    console.error('Error sending SMS/MMS:', error);
  }
}

// Helper: Send email report
async function sendEmailReport(guardPhone, issue, resolved, steps) {
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
    console.log(`Email report sent to ${CONFIG.OWNER_EMAIL}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Helper: Escalate to supervisor
async function escalateToSupervisor(guardPhone, issue, currentStep) {
  const escalationMessage = `🚨 Guard at ${guardPhone} needs help with: ${issue}\n\nThey're stuck at Step ${currentStep}. Please contact them ASAP.`;
  
  // Text supervisor (Chris)
  await sendSMS(CONFIG.SUPERVISOR_PHONE, escalationMessage);
  
  // Text guard
  await sendSMS(
    guardPhone,
    "I'm connecting you with your supervisor Chris who will help you directly. He'll reach out shortly."
  );
  
  // Send email report
  const state = conversationState.get(guardPhone);
  await sendEmailReport(guardPhone, issue, false, state.completedSteps || []);
  
  console.log(`Escalated issue for ${guardPhone} to supervisor`);
}

// Main conversation handler
async function handleConversation(guardPhone, message) {
  let state = conversationState.get(guardPhone) || {
    active: false,
    currentStep: 0,
    issue: null,
    retries: 0,
    completedSteps: [],
    startTime: null
  };

  // New conversation - detect issue
  if (!state.active) {
    if (detectCameraIssue(message)) {
      // Start camera troubleshooting
      state = {
        active: true,
        currentStep: 1,
        issue: 'Camera/NVR System Down',
        retries: 0,
        completedSteps: [],
        startTime: new Date()
      };
      conversationState.set(guardPhone, state);
      
      const firstStep = FRUITVALE_NVR_SOP.steps[0];
      const imageUrl = firstStep.image ? `${CONFIG.SERVER_URL}/images/${firstStep.image}` : null;
      
      // Send response via Twilio with image
      await sendSMS(guardPhone, `I'll help you fix the cameras. ${firstStep.userFriendly}`, imageUrl);
      return null; // We already sent the message
    } else {
      // Use Claude AI for general questions
      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: message
          }],
          system: `You are WatchTower, a helpful SMS assistant for security guards. Keep responses concise and professional for SMS format. If you don't know the answer, say so politely.`
        });
        
        return response.content[0].text;
      } catch (error) {
        console.error('Claude API error:', error);
        return "I'm having trouble right now. Please text your supervisor or call the office.";
      }
    }
  }

  // Active troubleshooting conversation
  if (state.active) {
    // Check if confused
    if (isConfused(message)) {
      state.retries += 1;
      
      if (state.retries >= CONFIG.MAX_RETRIES) {
        await escalateToSupervisor(guardPhone, state.issue, state.currentStep);
        conversationState.delete(guardPhone);
        return null; // Already sent message
      }
      
      conversationState.set(guardPhone, state);
      return `No worries! Let me explain Step ${state.currentStep} differently:\n\n${FRUITVALE_NVR_SOP.steps[state.currentStep - 1].instruction}\n\nStill stuck? Just text "help" and I'll connect you with your supervisor.`;
    }

    // Check for confirmation to move forward
    if (isConfirmation(message)) {
      // Mark current step as complete
      state.completedSteps.push(FRUITVALE_NVR_SOP.steps[state.currentStep - 1]);
      state.retries = 0; // Reset retries
      
      // Move to next step
      state.currentStep += 1;
      
      // Check if all steps complete
      if (state.currentStep > FRUITVALE_NVR_SOP.steps.length) {
        // Success! Send completion email
        await sendEmailReport(guardPhone, state.issue, true, state.completedSteps);
        conversationState.delete(guardPhone);
        
        await sendSMS(guardPhone, "🎉 Perfect! The cameras should be working now on the guard shack TV. Great job following the steps! Let me know if you need anything else.");
        return null;
      }
      
      // Send next step with image
      const nextStep = FRUITVALE_NVR_SOP.steps[state.currentStep - 1];
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
      return `I didn't catch that. Are you done with Step ${state.currentStep}? Just text 'done' or 'yes' when ready, or 'help' if you need assistance.`;
    }
  }
}

// Twilio webhook endpoint
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
    } else {
      res.sendStatus(200);
    }
  } catch (error) {
    console.error('Error handling conversation:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Sorry, I'm having technical difficulties. Please call the office.");
    res.type('text/xml').send(twiml.toString());
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'WatchTower is running!', activeConversations: conversationState.size });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🗼 WatchTower is running on port ${PORT}`);
  console.log(`📱 Twilio webhook: http://your-domain.com/sms`);
});
