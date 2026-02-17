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
  FRUITVALE_ACCESS_CONTROL_INFO,
  FRUITVALE_GATE_ISSUES,
  FRUITVALE_GENERAL_HELP
} = require('./knowledge-base');
const { COMPANY_KNOWLEDGE } = require('./company-knowledge');

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

// Track when we last sent an abandonment alert for each guard
const abandonmentAlertsSent = new Map();

// DAILY DIGEST: Store completed/escalated tasks for 6am summary email
const dailyTasks = {
  resolved: [],
  escalated: [],
  abandoned: []
};

// DAILY DIGEST: Send summary email at 6am Pacific every day
function scheduleDailyDigest() {
  setInterval(() => {
    const now = new Date();
    const pacificTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const hour = pacificTime.getHours();
    const minute = pacificTime.getMinutes();
    
    // Send at 6:00 AM Pacific (check every minute)
    if (hour === 6 && minute === 0) {
      sendDailyDigestEmail();
    }
  }, 60 * 1000); // Check every minute
}

// DAILY DIGEST: Send the summary email
async function sendDailyDigestEmail() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured - skipping daily digest');
    return;
  }
  
  const totalTasks = dailyTasks.resolved.length + dailyTasks.escalated.length + dailyTasks.abandoned.length;
  
  // Don't send if no activity
  if (totalTasks === 0) {
    console.log('📧 No tasks yesterday - skipping daily digest');
    dailyTasks.resolved = [];
    dailyTasks.escalated = [];
    dailyTasks.abandoned = [];
    return;
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  const subject = `WatchTower Daily Summary - ${dateStr}`;
  
  let htmlContent = `
    <h2>📊 WatchTower Daily Summary</h2>
    <p><strong>Activity from:</strong> ${dateStr}</p>
    <hr>
  `;
  
  // RESOLVED TASKS
  if (dailyTasks.resolved.length > 0) {
    htmlContent += `
      <h3>✅ RESOLVED TASKS (${dailyTasks.resolved.length})</h3>
      <ul>
    `;
    dailyTasks.resolved.forEach(task => {
      const guardLast4 = task.guardPhone.slice(-4);
      const stepCount = task.steps.length;
      htmlContent += `
        <li><strong>${task.issue}</strong> - Guard ending in ${guardLast4} - ${task.time} - ${stepCount} steps completed</li>
      `;
    });
    htmlContent += `</ul><br>`;
  }
  
  // ESCALATED TASKS
  if (dailyTasks.escalated.length > 0) {
    htmlContent += `
      <h3>⚠️ ESCALATED TASKS (${dailyTasks.escalated.length})</h3>
      <ul>
    `;
    dailyTasks.escalated.forEach(task => {
      const guardLast4 = task.guardPhone.slice(-4);
      htmlContent += `
        <li><strong>${task.issue}</strong> - Guard ending in ${guardLast4} - ${task.time} - ${task.reason}</li>
      `;
    });
    htmlContent += `</ul><br>`;
  }
  
  // ABANDONED TASKS
  if (dailyTasks.abandoned.length > 0) {
    htmlContent += `
      <h3>⏰ ABANDONED TASKS (${dailyTasks.abandoned.length})</h3>
      <ul>
    `;
    dailyTasks.abandoned.forEach(task => {
      const guardLast4 = task.guardPhone.slice(-4);
      htmlContent += `
        <li><strong>${task.issue}</strong> - Guard ending in ${guardLast4} - ${task.time} - Guard went silent at step ${task.step}</li>
      `;
    });
    htmlContent += `</ul><br>`;
  }
  
  htmlContent += `
    <hr>
    <p><strong>TOTAL:</strong> ${totalTasks} incidents handled yesterday</p>
  `;
  
  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: CONFIG.OWNER_EMAIL,
      subject: subject,
      html: htmlContent
    });
    console.log(`📧 Daily digest sent: ${totalTasks} tasks from ${dateStr}`);
    
    // Clear the arrays for today
    dailyTasks.resolved = [];
    dailyTasks.escalated = [];
    dailyTasks.abandoned = [];
  } catch (error) {
    console.error('Error sending daily digest:', error);
  }
}

// Start the daily digest scheduler
scheduleDailyDigest();

// Check for abandoned conversations every 2 minutes
setInterval(() => {
  const now = Date.now();
  const EIGHT_MINUTES = 8 * 60 * 1000; // 8 minutes in milliseconds
  
  conversationState.forEach((state, guardPhone) => {
    if (!state.active || !state.lastActivity) return;
    
    const timeSinceActivity = now - state.lastActivity;
    const alreadyAlerted = abandonmentAlertsSent.get(guardPhone);
    
    // If inactive for 8+ minutes and we haven't alerted yet
    if (timeSinceActivity >= EIGHT_MINUTES && !alreadyAlerted) {
      console.log(`⚠️ Guard ${guardPhone} went silent for 8+ minutes at Step ${state.currentStep}`);
      
      // Send alert email
      sendAbandonmentAlert(guardPhone, state.issue, state.currentStep, state.completedSteps);
      
      // Mark as alerted so we don't spam
      abandonmentAlertsSent.set(guardPhone, true);
    }
  });
}, 2 * 60 * 1000); // Check every 2 minutes

// Configuration
const CONFIG = {
  TWILIO_PHONE: process.env.TWILIO_PHONE_NUMBER,
  WHATSAPP_MODE: process.env.WHATSAPP_MODE === 'true',
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
  FRUITVALE_ACCESS_CONTROL_INFO,
  FRUITVALE_GATE_ISSUES,
  FRUITVALE_GENERAL_HELP
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

// Check if asking for supervisor/escalation
function isEscalationRequest(message) {
  const escalationPhrases = [
    'supervisor', 'manager', 'boss', 'escalate', 
    'need help', 'call someone', 'get someone',
    'i need someone', 'someone help', 'can someone help'
  ];
  const lowerMessage = message.toLowerCase().trim();
  return escalationPhrases.some(phrase => lowerMessage.includes(phrase));
}

// Send SMS/MMS (or WhatsApp)
async function sendSMS(to, message, imageUrl = null) {
  try {
    const toNumber = CONFIG.WHATSAPP_MODE ? `whatsapp:${to}` : to;
    const fromNumber = CONFIG.WHATSAPP_MODE ? `whatsapp:${CONFIG.TWILIO_PHONE}` : CONFIG.TWILIO_PHONE;
    
    const messageData = {
      body: message,
      from: fromNumber,
      to: toNumber
    };
    
    if (imageUrl) {
      messageData.mediaUrl = [imageUrl];
    }
    
    await twilioClient.messages.create(messageData);
    console.log(`${imageUrl ? 'MMS' : CONFIG.WHATSAPP_MODE ? 'WhatsApp' : 'SMS'} sent to ${to}: ${message.substring(0, 50)}...`);
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
async function escalateToSupervisor(guardPhone, issue, currentStep, additionalContext = '') {
  const contextInfo = additionalContext ? `\n\nContext: ${additionalContext}` : '';
  const escalationMessage = `🚨 Guard at ${guardPhone} needs help with: ${issue}\n\nThey're stuck at Step ${currentStep}.${contextInfo}\n\nPlease contact them ASAP.`;
  
  await sendSMS(CONFIG.SUPERVISOR_PHONE, escalationMessage);
  await sendSMS(guardPhone, "Connecting you with your supervisor. They'll reach out shortly.");
  
  const state = conversationState.get(guardPhone);
  await sendEmailReport(guardPhone, issue, false, state.completedSteps || []);
  
  console.log(`Escalated issue for ${guardPhone}: ${issue}`);
}

// Send abandonment alert (guard went silent mid-procedure) - IMMEDIATE EMAIL
async function sendAbandonmentAlert(guardPhone, issue, currentStep, completedSteps) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured - skipping abandonment alert');
    return;
  }
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  
  // Store for daily digest
  dailyTasks.abandoned.push({
    guardPhone,
    issue,
    step: currentStep,
    time: timeStr,
    timestamp: now
  });
  
  // Send IMMEDIATE email (guard going dark is urgent!)
  const subject = `⚠️ WatchTower Alert: Guard Went Silent - ${issue}`;
  
  const htmlContent = `
    <h2>⚠️ WatchTower Abandonment Alert</h2>
    <p><strong>Status:</strong> Guard went silent mid-procedure (8+ minutes no response)</p>
    <p><strong>Guard Phone:</strong> ${guardPhone}</p>
    <p><strong>Issue:</strong> ${issue}</p>
    <p><strong>Last Active Step:</strong> ${currentStep}</p>
    <p><strong>Time:</strong> ${now.toLocaleString()}</p>
    <hr>
    <h3>Steps Completed Before Going Silent:</h3>
    <ul>
      ${completedSteps.map(step => `<li>Step ${step.stepNumber}: ${step.instruction}</li>`).join('')}
    </ul>
    <p><strong>⚠️ Action Needed:</strong> Guard may be stuck, distracted, or need assistance. Consider reaching out to check on them.</p>
  `;

  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: CONFIG.OWNER_EMAIL,
      subject: subject,
      html: htmlContent
    });
    console.log(`📧 IMMEDIATE abandonment alert sent for ${guardPhone} at Step ${currentStep}`);
  } catch (error) {
    console.error('Error sending abandonment alert:', error);
  }
}

// ==========================================
// CAUTIOUS AI INTENT ANALYZER
// ==========================================

// Smart "Cautious" Intent Analyzer with CONFIDENCE SCORING (MIT-level metacognition)
async function analyzeGuardIntent(message, currentStepInfo, issueTitle) {
  const systemPrompt = `
You are a cautious security supervisor overseeing a troubleshooting procedure.

CONTEXT:
- Issue: "${issueTitle}"
- Current Step: ${currentStepInfo.stepNumber} - "${currentStepInfo.instruction}"
- User's Message: "${message}"

YOUR GOAL:
Classify the user's intent into exactly ONE of these categories:

1. SOLVED: User explicitly states the *entire issue* is fixed (e.g., "Cameras are back up," "Alarm stopped," "System working").

2. NEXT: User confirmed they completed the *current step* only (e.g., "Done," "Plugged it in," "I'm there," "Ready").

3. STUCK: User says it didn't work, is confused, or asks a question about the current step.

4. ESCALATE: User is frustrated, angry, or explicitly asking for a human/supervisor.

5. CLARIFY: User's response is vague (e.g., "It worked," "Good," "Okay," "It's on"). Unclear if they mean the *step* worked or the *whole system* is fixed.

6. SKIP: User indicates they are already past the current step (e.g., "I'm already in the room," "I'm looking at the monitor," "Skip to X").

CRITICAL RULES:
- Be Conservative: If user says "It worked" or "Good", return CLARIFY
- Only return SOLVED if they explicitly mention the original problem being fixed
- Return SKIP only if they clearly indicate being past the current step

CONFIDENCE SCORING:
After determining the category, rate your confidence (0-100):
- 90-100: Extremely clear intent (e.g., "done", "cameras are back up")
- 70-89: Pretty confident (clear but could have edge cases)
- 50-69: Unsure (vague message, multiple interpretations)
- 0-49: Very uncertain (ambiguous, contradictory)

Reply in this EXACT format:
CATEGORY CONFIDENCE
Example: NEXT 95
Example: CLARIFY 60
Example: SOLVED 85
`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 20,
      messages: [{ role: 'user', content: message }],
      system: systemPrompt
    });
    
    const responseText = response.content[0].text.trim().toUpperCase();
    const parts = responseText.split(/\s+/);
    const intent = parts[0];
    const confidence = parts[1] ? parseInt(parts[1]) : 75; // Default to 75 if not provided
    
    console.log(`🧠 AI Intent: ${intent} (${confidence}% confident) for: "${message}"`);
    
    return { intent, confidence };

  } catch (error) {
    console.error('AI Analysis Failed:', error);
    return { intent: 'NEXT', confidence: 50 }; // Low confidence fallback
  }
}

// Determine which step guard is at (when they SKIP ahead)
async function determineCurrentLocation(message, allSteps, issueTitle) {
  const stepDescriptions = allSteps.map((s, i) => 
    `Step ${i + 1}: ${s.instruction}`
  ).join('\n');
  
  const systemPrompt = `
The user is troubleshooting: "${issueTitle}"

Here are all the steps in order:
${stepDescriptions}

The user just said: "${message}"

Based on their message, which step number are they currently at or ready to start?

Reply ONLY with the step number (just the number, nothing else).
If unclear, reply with "1".
`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 5,
      messages: [{ role: 'user', content: message }],
      system: systemPrompt
    });
    
    const stepNum = parseInt(response.content[0].text.trim());
    console.log(`🎯 Determined location: Step ${stepNum}`);
    return isNaN(stepNum) ? 1 : stepNum;

  } catch (error) {
    console.error('Location determination failed:', error);
    return 1; // Default to step 1
  }
}

// ==========================================
// MAIN CONVERSATION HANDLER (CAUTIOUS + SKIP)
// ==========================================

async function handleConversation(guardPhone, message) {
  let state = conversationState.get(guardPhone) || {
    active: false,
    currentStep: 0,
    issue: null,
    activeSOP: null,
    retries: 0,
    completedSteps: [],
    startTime: null,
    conversationHistory: []
  };

  // Add to conversation history
  state.conversationHistory = state.conversationHistory || [];
  state.conversationHistory.push({ role: 'guard', content: message });

  // Check for escalation request at any time
  if (isEscalationRequest(message) && state.active) {
    await escalateToSupervisor(guardPhone, state.issue, state.currentStep, message);
    conversationState.delete(guardPhone);
    abandonmentAlertsSent.delete(guardPhone); // Clear alert flag
    return null;
  }

  // NEW CONVERSATION - Detect issue
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
        startTime: new Date(),
        lastActivity: Date.now(), // Track last activity for abandonment detection
        conversationHistory: [{ role: 'guard', content: message }]
      };
      conversationState.set(guardPhone, state);
      abandonmentAlertsSent.delete(guardPhone); // Clear any previous alert flag
      
      const firstStep = detected.sop.steps[0];
      const imageUrl = firstStep.image ? `${CONFIG.SERVER_URL}/images/${firstStep.image}` : null;
      
      state.conversationHistory.push({ role: 'watchtower', content: firstStep.userFriendly });
      await sendSMS(guardPhone, firstStep.userFriendly, imageUrl);
      return null;
    } else {
      // General question - use Claude AI with company knowledge
      try {
        const systemPrompt = `You are WatchTower, a helpful SMS assistant for Manzanita Security guards.

${COMPANY_KNOWLEDGE}

RESPONSE RULES:
- Keep responses SHORT (2-3 sentences max)
- Be DIRECTIVE ("Do this" not "You might want to...")
- Use the company knowledge above to give accurate answers
- If you don't know, say "Contact Emma (510-612-4813) or Chris (925-922-1067) about that"
- Sound like a calm supervisor, not a chatbot
- Be professional but friendly`;

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{ role: 'user', content: message }],
          system: systemPrompt
        });
        
        return response.content[0].text;
      } catch (error) {
        console.error('Claude API error:', error);
        return "I'm having trouble right now. Text your supervisor.";
      }
    }
  }

  // ACTIVE TROUBLESHOOTING - Use intelligent interpretation
  if (state.active && state.activeSOP) {
    // Update last activity timestamp (for abandonment detection)
    state.lastActivity = Date.now();
    conversationState.set(guardPhone, state);
    
    const currentStepObj = state.activeSOP.steps[state.currentStep - 1];
    
    // 🧠 ASK AI TO INTERPRET INTENT (with confidence scoring)
    const { intent, confidence } = await analyzeGuardIntent(
      message, 
      currentStepObj, 
      state.issue
    );

    // 🎓 CONFIDENCE CHECK: If AI is unsure, ask for clarification (MIT-level metacognition)
    if (confidence < 70 && intent !== 'CLARIFY' && intent !== 'ESCALATE') {
      console.log(`⚠️ Low confidence (${confidence}%) - asking for clarification`);
      conversationState.set(guardPhone, state);
      await sendSMS(guardPhone, 
        "Just to make sure I understand - are you saying:\n\n" +
        "1. Problem is completely SOLVED\n" +
        "2. This step is DONE, ready for next\n" +
        "3. You're STUCK on this step\n\n" +
        "Reply with the number (1, 2, or 3)"
      );
      return null;
    }

    // CASE 1: SOLVED (Problem fixed early!) ✅
    if (intent === 'SOLVED') {
       state.completedSteps.push(currentStepObj);
       await sendEmailReport(guardPhone, state.issue, true, state.completedSteps);
       conversationState.delete(guardPhone);
       abandonmentAlertsSent.delete(guardPhone); // Clear alert flag
       
       await sendSMS(guardPhone, "Great work! I've marked this as RESOLVED. Have a safe shift. ✅");
       return null;
    }

    // CASE 2: CLARIFY (The Conservative Check) ⚠️
    if (intent === 'CLARIFY') {
        conversationState.set(guardPhone, state);
        await sendSMS(guardPhone, "Just to be sure: did that fix the WHOLE problem, or are you just ready for the next step?\n\n(Text 'Fixed' if done, or 'Next' to continue)");
        return null;
    }

    // CASE 3: SKIP (Jump ahead) ⏭️
    if (intent === 'SKIP') {
        // Determine where they actually are
        const detectedStep = await determineCurrentLocation(
          message, 
          state.activeSOP.steps, 
          state.issue
        );
        
        if (detectedStep > state.currentStep && detectedStep <= state.activeSOP.steps.length) {
          // They're ahead - jump to that step
          console.log(`⏭️ Skipping from Step ${state.currentStep} to Step ${detectedStep}`);
          state.currentStep = detectedStep;
          
          const jumpStep = state.activeSOP.steps[state.currentStep - 1];
          const imageUrl = jumpStep.image ? `${CONFIG.SERVER_URL}/images/${jumpStep.image}` : null;
          
          state.conversationHistory.push({ role: 'watchtower', content: jumpStep.userFriendly });
          conversationState.set(guardPhone, state);
          
          await sendSMS(guardPhone, `Got it! ${jumpStep.userFriendly}`, imageUrl);
          return null;
        }
        // If can't determine location, fall through to NEXT
    }

    // CASE 4: ESCALATE 🚨
    if (intent === 'ESCALATE') {
       await escalateToSupervisor(guardPhone, state.issue, state.currentStep, message);
       conversationState.delete(guardPhone);
       abandonmentAlertsSent.delete(guardPhone); // Clear alert flag
       return null;
    }

    // CASE 5: STUCK 🤔
    if (intent === 'STUCK') {
       state.retries += 1;
       if (state.retries >= CONFIG.MAX_RETRIES) {
         await escalateToSupervisor(guardPhone, state.issue, state.currentStep, "Guard stuck on step");
         conversationState.delete(guardPhone);
         abandonmentAlertsSent.delete(guardPhone); // Clear alert flag
         return null;
       }
       conversationState.set(guardPhone, state);
       await sendSMS(guardPhone, `Let's try again:\n\n${currentStepObj.instruction}\n\n(Still stuck? Text 'supervisor')`);
       return null;
    }

    // CASE 6: NEXT (Default - Step Complete) ➡️
    state.completedSteps.push(currentStepObj);
    state.retries = 0;
    state.currentStep += 1;
    
    // Check if finished all steps
    if (state.currentStep > state.activeSOP.steps.length) {
      await sendEmailReport(guardPhone, state.issue, true, state.completedSteps);
      conversationState.delete(guardPhone);
      abandonmentAlertsSent.delete(guardPhone); // Clear alert flag
      await sendSMS(guardPhone, "🎉 All steps complete. Great job! Marking as resolved.");
      return null;
    }
    
    // Send next step
    const nextStep = state.activeSOP.steps[state.currentStep - 1];
    const imageUrl = nextStep.image ? `${CONFIG.SERVER_URL}/images/${nextStep.image}` : null;
    
    state.conversationHistory.push({ role: 'watchtower', content: nextStep.userFriendly });
    conversationState.set(guardPhone, state);
    
    await sendSMS(guardPhone, nextStep.userFriendly, imageUrl);
    return null;
  }
}

// Twilio webhook (handles both SMS and WhatsApp)
app.post('/sms', async (req, res) => {
  const guardPhone = req.body.From.replace('whatsapp:', '');
  const message = req.body.Body;
  
  console.log(`📱 Received from ${guardPhone}: ${message}`);
  
  try {
    const response = await handleConversation(guardPhone, message);
    
    if (response) {
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(response);
      res.type('text/xml').send(twiml.toString());
      console.log(`📤 Response sent: ${response.substring(0, 50)}...`);
    } else {
      res.sendStatus(200);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Sorry, I'm having technical difficulties. Text your supervisor.");
    res.type('text/xml').send(twiml.toString());
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'WatchTower is running!', 
    version: '2.3-Abandonment',
    activeConversations: conversationState.size,
    availableSOPs: ALL_SOPS.length,
    companyKnowledge: 'Loaded',
    aiMode: 'Cautious + Skip',
    abandonmentDetection: '8 minutes'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🗼 WatchTower v2.3-Abandonment is running on port ${PORT}`);
  console.log(`📱 Webhook URL: ${CONFIG.SERVER_URL}/sms`);
  console.log(`📞 ${CONFIG.WHATSAPP_MODE ? 'WhatsApp' : 'Twilio Phone'}: ${CONFIG.TWILIO_PHONE}`);
  console.log(`🧠 AI Mode: Cautious Intent Analysis (SOLVED/NEXT/STUCK/ESCALATE/CLARIFY/SKIP)`);
  console.log(`⏰ Abandonment Detection: Alerts after 8 minutes of silence`);
  console.log(`📚 Available SOPs: ${ALL_SOPS.length}`);
  console.log(`📖 Company Handbook: Loaded`);
  console.log(`\n--- SOPs Loaded ---`);
  ALL_SOPS.forEach(sop => console.log(`   ✓ ${sop.title}`));
  console.log(`-------------------\n`);
});
