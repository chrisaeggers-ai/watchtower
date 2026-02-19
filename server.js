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

// 📊 WEEKLY ANALYTICS: Store detailed incident data for Monday reports
const weeklyAnalytics = {
  incidents: [],          // All incidents with full metadata
  unrecognizedPhrases: [], // Messages that didn't trigger SOPs
  checkIns: [],           // Proactive check-in data
  handoffs: [],           // Shift handoff records
  startDate: new Date(),   // Week start
  lastWeekBaseline: {      // Previous week's data for comparison
    cameraCount: 0,
    gateCount: 0,
    firePanelCount: 0,
    fenceCount: 0,
    accessCount: 0
  }
};

// 📋 SHIFT HANDOFF SYSTEM: Track handoffs and verify accuracy
const activeHandoffs = new Map(); // Guards currently in handoff process
const lastHandoff = new Map(); // Most recent handoff per guard (for discrepancy detection)
const handoffAccuracy = new Map(); // Per-guard handoff performance tracking

// 💰 ROI CALCULATOR: Track cost savings from WatchTower operations
const roiTracking = {
  monthlyData: [],
  currentMonth: {
    startDate: new Date(),
    earlyDetections: [],
    preventedEscalations: [],
    handoffCatches: [],
    totalSavings: 0
  }
};

// ⏰ TIME-BASED ISSUE PATTERN TRACKING: Predictive operational intelligence
const issuePatterns = {
  byHour: {}, // { "14": { cameraIssues: 3, gateIssues: 1 } }
  byDay: {}, // { "Monday": { cameraIssues: 12, gateIssues: 5 } }
  byShift: { // Shift types
    day: { start: 6, end: 14, issues: [] },
    swing: { start: 14, end: 22, issues: [] },
    night: { start: 22, end: 6, issues: [] }
  },
  byEquipment: {}, // { "Camera #3": [timestamps] }
  allIssues: [] // Full history with metadata
};

// Log time-based issue for pattern analysis
function logIssuePattern(issueType, equipment = null, metadata = {}) {
  const now = new Date();
  const hour = now.getHours();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Determine shift
  let shift = 'day';
  if (hour >= 22 || hour < 6) shift = 'night';
  else if (hour >= 14 && hour < 22) shift = 'swing';
  
  // Store full issue data
  const issueData = {
    timestamp: now,
    issueType,
    equipment,
    hour,
    day,
    shift,
    ...metadata
  };
  
  issuePatterns.allIssues.push(issueData);
  
  // Track by hour
  if (!issuePatterns.byHour[hour]) {
    issuePatterns.byHour[hour] = {};
  }
  if (!issuePatterns.byHour[hour][issueType]) {
    issuePatterns.byHour[hour][issueType] = 0;
  }
  issuePatterns.byHour[hour][issueType]++;
  
  // Track by day
  if (!issuePatterns.byDay[day]) {
    issuePatterns.byDay[day] = {};
  }
  if (!issuePatterns.byDay[day][issueType]) {
    issuePatterns.byDay[day][issueType] = 0;
  }
  issuePatterns.byDay[day][issueType]++;
  
  // Track by shift
  issuePatterns.byShift[shift].issues.push(issueData);
  
  // Track by equipment
  if (equipment) {
    if (!issuePatterns.byEquipment[equipment]) {
      issuePatterns.byEquipment[equipment] = [];
    }
    issuePatterns.byEquipment[equipment].push(now);
  }
  
  console.log(`⏰ Pattern logged: ${issueType} at ${hour}:00 on ${day} (${shift} shift)`);
}

// 📋 DAILY HANDOFF BUFFER: Store handoffs for 6am consolidated report
const dailyHandoffBuffer = {
  date: new Date().toDateString(),
  handoffs: [] // Stores all handoffs for the day
};

// Reset buffer at 6am
function resetDailyHandoffBuffer() {
  dailyHandoffBuffer.date = new Date().toDateString();
  dailyHandoffBuffer.handoffs = [];
}

// 🚨 LAZY DETECTOR: Track guard behavior patterns
const lazyBehavior = new Map(); // Per-guard lazy indicators

function initLazyTracking(guardPhone) {
  if (!lazyBehavior.has(guardPhone)) {
    lazyBehavior.set(guardPhone, {
      handoffSkips: 0,
      totalHandoffs: 0,
      rushes: 0, // SOP steps completed too fast
      totalSteps: 0,
      oneWordResponses: 0,
      totalResponses: 0,
      reportSkips: 0,
      totalReports: 0,
      lastWarning: null
    });
  }
  return lazyBehavior.get(guardPhone);
}

// Track lazy behavior indicators
function trackLazyBehavior(guardPhone, type, metadata = {}) {
  const behavior = initLazyTracking(guardPhone);
  
  switch(type) {
    case 'handoff_skip':
      behavior.handoffSkips++;
      behavior.totalHandoffs++;
      break;
      
    case 'handoff_complete':
      behavior.totalHandoffs++;
      break;
      
    case 'sop_rush':
      // SOP step completed in <30 seconds (suspiciously fast)
      behavior.rushes++;
      behavior.totalSteps++;
      console.log(`⚠️ Guard ...${guardPhone.slice(-4)} rushed through step (${metadata.seconds}s)`);
      break;
      
    case 'sop_step':
      behavior.totalSteps++;
      break;
      
    case 'one_word':
      behavior.oneWordResponses++;
      behavior.totalResponses++;
      break;
      
    case 'response':
      behavior.totalResponses++;
      break;
      
    case 'report_skip':
      behavior.reportSkips++;
      behavior.totalReports++;
      break;
      
    case 'report_complete':
      behavior.totalReports++;
      break;
  }
  
  // Check if guard is showing lazy patterns
  checkLazyPatterns(guardPhone);
}

// Check if guard shows concerning lazy patterns
function checkLazyPatterns(guardPhone) {
  const behavior = lazyBehavior.get(guardPhone);
  if (!behavior) return;
  
  const guardLast4 = guardPhone.slice(-4);
  const issues = [];
  
  // Check handoff skip rate (>30% is concerning)
  if (behavior.totalHandoffs >= 5) {
    const skipRate = (behavior.handoffSkips / behavior.totalHandoffs) * 100;
    if (skipRate > 30) {
      issues.push(`Skips handoffs ${skipRate.toFixed(0)}% of time (${behavior.handoffSkips}/${behavior.totalHandoffs})`);
    }
  }
  
  // Check rush rate (>40% is concerning)
  if (behavior.totalSteps >= 10) {
    const rushRate = (behavior.rushes / behavior.totalSteps) * 100;
    if (rushRate > 40) {
      issues.push(`Rushes through procedures ${rushRate.toFixed(0)}% of time (${behavior.rushes}/${behavior.totalSteps} steps)`);
    }
  }
  
  // Check one-word response rate (>60% is concerning)
  if (behavior.totalResponses >= 10) {
    const oneWordRate = (behavior.oneWordResponses / behavior.totalResponses) * 100;
    if (oneWordRate > 60) {
      issues.push(`Minimal effort responses ${oneWordRate.toFixed(0)}% of time (${behavior.oneWordResponses}/${behavior.totalResponses})`);
    }
  }
  
  // If concerning patterns detected and no recent warning, send alert
  if (issues.length >= 2) {
    const now = Date.now();
    const lastWarning = behavior.lastWarning || 0;
    const hoursSinceWarning = (now - lastWarning) / (1000 * 60 * 60);
    
    // Only alert once per 24 hours
    if (hoursSinceWarning > 24) {
      sendLazyBehaviorAlert(guardPhone, issues);
      behavior.lastWarning = now;
    }
  }
}

// Send alert about lazy behavior patterns
async function sendLazyBehaviorAlert(guardPhone, issues) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return;
  
  const guardLast4 = guardPhone.slice(-4);
  
  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: CONFIG.OWNER_EMAIL,
      subject: `⚠️ Lazy Behavior Pattern - Guard ...${guardLast4}`,
      html: `
        <h2>⚠️ Lazy Behavior Pattern Detected</h2>
        <p><strong>Guard:</strong> ...${guardLast4}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <h3>Concerning Patterns:</h3>
        <ul>
          ${issues.map(issue => `<li>${issue}</li>`).join('')}
        </ul>
        <hr>
        <p><strong>Recommendation:</strong> Coaching or increased supervision needed.</p>
      `
    });
    console.log(`📧 Lazy behavior alert sent for guard ...${guardLast4}`);
  } catch (error) {
    console.error('Error sending lazy behavior alert:', error);
  }
}

// 👁️ SPOT CHECK SYSTEM: Random verification checks
const spotChecks = new Map(); // Active spot checks per guard
const spotCheckHistory = []; // History of all spot checks

// Generate random spot check
function scheduleRandomSpotChecks() {
  setInterval(() => {
    // Random chance (10%) to trigger spot check during active hours
    if (Math.random() < 0.10) {
      // Get active guards (those who've texted recently)
      const now = Date.now();
      const activeGuards = Array.from(guardLastContact.entries())
        .filter(([phone, lastContact]) => {
          const hoursSince = (now - lastContact) / (1000 * 60 * 60);
          return hoursSince < 12; // Active in last 12 hours
        })
        .map(([phone]) => phone);
      
      // Pick random guard
      if (activeGuards.length > 0) {
        const randomGuard = activeGuards[Math.floor(Math.random() * activeGuards.length)];
        sendSpotCheck(randomGuard);
      }
    }
  }, 30 * 60 * 1000); // Check every 30 minutes
}

// Send spot check to guard
async function sendSpotCheck(guardPhone) {
  const spotCheckTypes = [
    { text: "📸 Spot check: Send me a photo of the north parking lot right now.", type: "photo" },
    { text: "📸 Spot check: Send me a photo of the main entrance right now.", type: "photo" },
    { text: "📸 Spot check: Send me a photo of the south gate right now.", type: "photo" },
    { text: "✅ Spot check: Reply with your current location (e.g., 'guard shack', 'patrolling').", type: "text" },
    { text: "✅ Spot check: How many vehicles in the parking lot right now?", type: "text" }
  ];
  
  const randomCheck = spotCheckTypes[Math.floor(Math.random() * spotCheckTypes.length)];
  
  const spotCheck = {
    guardPhone,
    timestamp: new Date(),
    checkType: randomCheck.type,
    text: randomCheck.text,
    responded: false,
    responseTime: null,
    passed: null
  };
  
  spotChecks.set(guardPhone, spotCheck);
  spotCheckHistory.push(spotCheck);
  
  await sendSMS(guardPhone, randomCheck.text);
  console.log(`👁️ Spot check sent to guard ...${guardPhone.slice(-4)}: ${randomCheck.type}`);
  
  // Set 5-minute timeout
  setTimeout(() => {
    checkSpotCheckTimeout(guardPhone, spotCheck);
  }, 5 * 60 * 1000);
}

// Check if guard failed to respond to spot check
async function checkSpotCheckTimeout(guardPhone, spotCheck) {
  const activeCheck = spotChecks.get(guardPhone);
  
  // If still the same check and not responded
  if (activeCheck && activeCheck.timestamp === spotCheck.timestamp && !activeCheck.responded) {
    console.log(`⚠️ Guard ...${guardPhone.slice(-4)} failed spot check (no response in 5 min)`);
    
    // Send warning
    await sendSMS(guardPhone, "⚠️ No response to spot check. Are you awake? Please respond immediately.");
    
    // Mark as failed
    spotCheck.passed = false;
    spotCheck.responseTime = 300; // 5 min timeout
    
    // Set another 5-minute timeout for escalation
    setTimeout(() => {
      escalateSpotCheckFailure(guardPhone, spotCheck);
    }, 5 * 60 * 1000);
  }
}

// Escalate if still no response after warning
async function escalateSpotCheckFailure(guardPhone, spotCheck) {
  const activeCheck = spotChecks.get(guardPhone);
  
  // If still hasn't responded after warning
  if (activeCheck && activeCheck.timestamp === spotCheck.timestamp && !activeCheck.responded) {
    console.log(`🚨 Guard ...${guardPhone.slice(-4)} STILL not responding to spot check - ESCALATING`);
    
    // Send alert to owner
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        await emailTransporter.sendMail({
          from: process.env.EMAIL_USER,
          to: CONFIG.OWNER_EMAIL,
          subject: `🚨 URGENT: Guard Not Responding to Spot Checks`,
          html: `
            <h2>🚨 URGENT: Guard Not Responding</h2>
            <p><strong>Guard:</strong> ${guardPhone}</p>
            <p><strong>Spot Check Sent:</strong> ${spotCheck.timestamp.toLocaleString()}</p>
            <p><strong>Check Type:</strong> ${spotCheck.checkType}</p>
            <p><strong>Status:</strong> No response after 10 minutes + warning</p>
            <hr>
            <p><strong>Action Required:</strong> Call guard immediately to verify they're okay.</p>
          `
        });
      } catch (error) {
        console.error('Error sending spot check escalation:', error);
      }
    }
    
    // Remove from active checks
    spotChecks.delete(guardPhone);
  }
}

// Handle spot check response
function handleSpotCheckResponse(guardPhone, message) {
  const spotCheck = spotChecks.get(guardPhone);
  if (!spotCheck) return false; // No active spot check
  
  // Mark as responded
  const responseTime = Math.round((Date.now() - spotCheck.timestamp.getTime()) / 1000);
  spotCheck.responded = true;
  spotCheck.responseTime = responseTime;
  spotCheck.passed = true;
  
  console.log(`✅ Guard ...${guardPhone.slice(-4)} responded to spot check in ${responseTime}s`);
  
  // Remove from active checks
  spotChecks.delete(guardPhone);
  
  return true; // Was a spot check response
}



// ⚡ RESPONSE SPEED ANALYTICS: Track guard alertness and engagement
const responseSpeedTracking = {
  guards: new Map(), // Per-guard response time data
  allResponses: []    // All response events for pattern analysis
};

// 📋 GUARD REPORT SYSTEM: Conversational professional report submission
const activeReports = new Map(); // Guards currently creating reports
const submittedReports = []; // All submitted reports for analytics

// Report types and their detail-gathering questions
const REPORT_TYPES = {
  equipment: {
    name: 'Equipment/Uniform Request',
    questions: [
      { field: 'item', question: "What equipment or uniform item do you need?" },
      { field: 'size', question: "What size? (Reply 'N/A' if not applicable)", optional: true },
      { field: 'reason', question: "Why do you need this? (e.g., damaged, lost, new hire)" },
      { field: 'urgency', question: "How urgent? Reply:\n1. ASAP (urgent)\n2. This week\n3. When convenient" }
    ]
  },
  facility: {
    name: 'Facility Issue (Non-Urgent)',
    questions: [
      { field: 'location', question: "Where is the issue? (e.g., parking lot, north entrance, bathroom)" },
      { field: 'problem', question: "What's the problem?" },
      { field: 'impact', question: "How does this affect operations? Reply:\n1. Major impact\n2. Minor inconvenience\n3. Cosmetic only" }
    ]
  },
  incident: {
    name: 'Incident Report (Non-Emergency)',
    questions: [
      { field: 'what', question: "What happened?" },
      { field: 'when', question: "When did this occur? (e.g., 'just now', '2 hours ago', 'this morning')" },
      { field: 'where', question: "Where did this occur?" },
      { field: 'involved', question: "Anyone involved or witnessed? (Reply 'None' if not applicable)", optional: true }
    ]
  },
  supply: {
    name: 'Supply Request',
    questions: [
      { field: 'supplies', question: "What supplies do you need?" },
      { field: 'quantity', question: "How many/much?" },
      { field: 'urgency', question: "How urgent? Reply:\n1. Critical (out of stock)\n2. Running low\n3. Planning ahead" }
    ]
  },
  feedback: {
    name: 'General Feedback/Suggestion',
    questions: [
      { field: 'category', question: "What's this about? (e.g., tenant complaint, visitor question, safety suggestion)" },
      { field: 'details', question: "Please provide details:" }
    ]
  }
};

// Report trigger phrases
const REPORT_TRIGGERS = [
  // Explicit report phrases
  "i need to submit a report", "submit a report", "send a report",
  "i want to report", "need to report", "report:",
  "i have a report", "create a report", "make a report",
  "file a report", "submit report", "send report",
  
  // Equipment/supply requests
  "i need", "we need", "request for", "can i get",
  "need new", "need a", "need more",
  
  // Facility/incident issues
  "is out", "are out", "went out", "is broken", "are broken",
  "is down", "are down", "not working", "doesn't work", "dont work",
  "is stuck", "won't close", "wont close", "won't open", "wont open",
  "is leaking", "water leak", "found", "there's a", "theres a"
];

// Check if message is a report trigger
function isReportTrigger(message) {
  const lower = message.toLowerCase().trim();
  
  // Explicit report triggers
  if (REPORT_TRIGGERS.some(trigger => lower.includes(trigger))) {
    return true;
  }
  
  // Equipment/supply request patterns
  if (lower.match(/need (new|a|another|more|replacement)/i)) {
    return true;
  }
  
  // Facility issue patterns (light out, door broken, etc.)
  if (lower.match(/(light|door|window|lock|gate|fence|camera|water|power|bathroom|toilet|sink|hvac|ac|heat|elevator)\s+(is|are)?\s*(out|broken|down|stuck|leaking|not working)/i)) {
    return true;
  }
  
  // Incident patterns (found something, there's a problem)
  if (lower.match(/(found|discovered|noticed|saw)\s+(a|an|some)?\s*(broken|damaged|issue|problem)/i)) {
    return true;
  }
  
  return false;
}

// Initialize response tracking for a guard
function initializeGuardResponseTracking(guardPhone) {
  if (!responseSpeedTracking.guards.has(guardPhone)) {
    responseSpeedTracking.guards.set(guardPhone, {
      proactiveCheckResponses: [],
      sopStepResponses: [],
      initialIncidentResponses: [],
      averages: {
        proactiveCheck: 0,
        sopStep: 0,
        initialIncident: 0,
        overall: 0
      },
      alertnessScore: 100, // 0-100 score
      byTimeOfDay: {
        morning: [],   // 6am-12pm
        afternoon: [], // 12pm-6pm
        evening: [],   // 6pm-12am
        night: []      // 12am-6am
      }
    });
  }
}

// Log response speed event
function logResponseSpeed(guardPhone, responseType, responseTimeSeconds, context = {}) {
  initializeGuardResponseTracking(guardPhone);
  
  const guardData = responseSpeedTracking.guards.get(guardPhone);
  const hour = new Date().getHours();
  
  // Determine time of day
  let timeOfDay = 'night';
  if (hour >= 6 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
  else if (hour >= 18 && hour < 24) timeOfDay = 'evening';
  
  const event = {
    timestamp: new Date(),
    responseTimeSeconds,
    timeOfDay,
    hour,
    context
  };
  
  // Add to appropriate category
  if (responseType === 'proactive_check') {
    guardData.proactiveCheckResponses.push(event);
  } else if (responseType === 'sop_step') {
    guardData.sopStepResponses.push(event);
  } else if (responseType === 'initial_incident') {
    guardData.initialIncidentResponses.push(event);
  }
  
  // Add to time-of-day tracking
  guardData.byTimeOfDay[timeOfDay].push(event);
  
  // Add to global tracking
  responseSpeedTracking.allResponses.push({
    guardPhone,
    responseType,
    ...event
  });
  
  // Recalculate averages
  calculateResponseAverages(guardPhone);
  
  responseSpeedTracking.guards.set(guardPhone, guardData);
  
  console.log(`⚡ Response logged: ${guardPhone.slice(-4)} - ${responseType} - ${responseTimeSeconds}s`);
}

// Calculate response time averages
function calculateResponseAverages(guardPhone) {
  const guardData = responseSpeedTracking.guards.get(guardPhone);
  if (!guardData) return;
  
  // Calculate proactive check average
  if (guardData.proactiveCheckResponses.length > 0) {
    const sum = guardData.proactiveCheckResponses.reduce((acc, r) => acc + r.responseTimeSeconds, 0);
    guardData.averages.proactiveCheck = Math.round(sum / guardData.proactiveCheckResponses.length);
  }
  
  // Calculate SOP step average
  if (guardData.sopStepResponses.length > 0) {
    const sum = guardData.sopStepResponses.reduce((acc, r) => acc + r.responseTimeSeconds, 0);
    guardData.averages.sopStep = Math.round(sum / guardData.sopStepResponses.length);
  }
  
  // Calculate initial incident average
  if (guardData.initialIncidentResponses.length > 0) {
    const sum = guardData.initialIncidentResponses.reduce((acc, r) => acc + r.responseTimeSeconds, 0);
    guardData.averages.initialIncident = Math.round(sum / guardData.initialIncidentResponses.length);
  }
  
  // Calculate overall average
  const allResponses = [
    ...guardData.proactiveCheckResponses,
    ...guardData.sopStepResponses,
    ...guardData.initialIncidentResponses
  ];
  
  if (allResponses.length > 0) {
    const sum = allResponses.reduce((acc, r) => acc + r.responseTimeSeconds, 0);
    guardData.averages.overall = Math.round(sum / allResponses.length);
  }
  
  // Calculate alertness score (0-100, lower response time = higher score)
  // Target: <5 min (300s) = 100 points, >10 min (600s) = 0 points
  const targetTime = 300; // 5 minutes
  const maxTime = 600;    // 10 minutes
  
  if (guardData.averages.overall <= targetTime) {
    guardData.alertnessScore = 100;
  } else if (guardData.averages.overall >= maxTime) {
    guardData.alertnessScore = 0;
  } else {
    guardData.alertnessScore = Math.round(100 - ((guardData.averages.overall - targetTime) / (maxTime - targetTime)) * 100);
  }
  
  responseSpeedTracking.guards.set(guardPhone, guardData);
}

// Get time-of-day performance pattern
function getTimeOfDayPattern(guardPhone) {
  const guardData = responseSpeedTracking.guards.get(guardPhone);
  if (!guardData) return null;
  
  const patterns = {};
  
  ['morning', 'afternoon', 'evening', 'night'].forEach(period => {
    const responses = guardData.byTimeOfDay[period];
    if (responses.length > 0) {
      const sum = responses.reduce((acc, r) => acc + r.responseTimeSeconds, 0);
      const avg = Math.round(sum / responses.length);
      patterns[period] = {
        average: avg,
        count: responses.length,
        rating: avg <= 300 ? 'excellent' : avg <= 420 ? 'good' : avg <= 600 ? 'slow' : 'very_slow'
      };
    }
  });
  
  return patterns;
}

// Cost constants (industry averages)
const COST_SAVINGS = {
  emergencyServiceCall: 400,      // Emergency repair call
  guardOvertime: 250,              // Overtime if equipment fails mid-shift
  preventedDowntime: 150,          // Per hour of prevented downtime
  handoffPhoneIssue: 100,          // Prevented missed calls/communication issues
  handoffEquipmentIssue: 350,      // Equipment issue caught at handoff vs during shift
  earlyDetection: 500              // Average savings from catching issue early
};

// Log ROI event
function logROISavings(eventType, details, savingsAmount) {
  const event = {
    date: new Date(),
    type: eventType,
    details,
    savings: savingsAmount
  };
  
  // Add to appropriate category
  if (eventType === 'early_detection') {
    roiTracking.currentMonth.earlyDetections.push(event);
  } else if (eventType === 'prevented_escalation') {
    roiTracking.currentMonth.preventedEscalations.push(event);
  } else if (eventType === 'handoff_catch') {
    roiTracking.currentMonth.handoffCatches.push(event);
  }
  
  roiTracking.currentMonth.totalSavings += savingsAmount;
  
  console.log(`💰 ROI Event: ${eventType} - $${savingsAmount} saved`);
}

// Store handoff for analytics and discrepancy detection
function logHandoff(outgoingGuard, handoffData) {
  const handoffRecord = {
    outgoingGuard,
    timestamp: new Date(),
    phoneLocation: handoffData.phoneLocation,
    phoneVolume: handoffData.phoneVolume,
    phoneCharge: handoffData.phoneCharge,
    cameraStatus: handoffData.cameraStatus,
    gateStatus: handoffData.gateStatus,
    notes: handoffData.notes,
    incomingGuard: null, // Will be set when incoming guard first texts
    discrepancies: []
  };
  
  weeklyAnalytics.handoffs.push(handoffRecord);
  lastHandoff.set(outgoingGuard, handoffRecord);
  
  // Initialize accuracy tracking for this guard if not exists
  if (!handoffAccuracy.has(outgoingGuard)) {
    handoffAccuracy.set(outgoingGuard, {
      total: 0,
      accurate: 0,
      discrepancies: []
    });
  }
  
  // Increment total handoffs
  const accuracy = handoffAccuracy.get(outgoingGuard);
  accuracy.total++;
  handoffAccuracy.set(outgoingGuard, accuracy);
}

// Detect discrepancy: incoming guard reports issue that outgoing said was fine
function detectHandoffDiscrepancy(incomingGuard, system, issueType) {
  const DISCREPANCY_WINDOW = 60 * 60 * 1000; // 60 minutes
  const now = Date.now();
  
  // Find most recent handoff (any outgoing guard)
  const recentHandoff = Array.from(lastHandoff.values())
    .filter(h => !h.incomingGuard) // Not yet claimed by an incoming guard
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  
  if (!recentHandoff) return; // No recent handoff
  
  const timeSinceHandoff = now - recentHandoff.timestamp.getTime();
  
  // Only flag if within 60-minute window
  if (timeSinceHandoff > DISCREPANCY_WINDOW) return;
  
  // Set incoming guard on the handoff record
  recentHandoff.incomingGuard = incomingGuard;
  
  // Check if this system was reported as "all clear" but is now broken
  let discrepancy = null;
  
  if (system === 'camera' && recentHandoff.cameraStatus === 'all clear') {
    discrepancy = {
      system: 'Camera',
      claimedStatus: 'ALL CLEAR',
      actualStatus: 'DOWN',
      minutesAfterHandoff: Math.round(timeSinceHandoff / 60000)
    };
  } else if (system === 'gate' && recentHandoff.gateStatus === 'normal') {
    discrepancy = {
      system: 'Gate',
      claimedStatus: 'NORMAL',
      actualStatus: 'ISSUES',
      minutesAfterHandoff: Math.round(timeSinceHandoff / 60000)
    };
  }
  
  if (discrepancy) {
    recentHandoff.discrepancies.push(discrepancy);
    
    // Update accuracy tracking
    const accuracy = handoffAccuracy.get(recentHandoff.outgoingGuard);
    if (accuracy) {
      accuracy.discrepancies.push({
        date: new Date(),
        ...discrepancy,
        incomingGuard
      });
      handoffAccuracy.set(recentHandoff.outgoingGuard, accuracy);
    }
    
    // Send immediate alert email
    sendHandoffDiscrepancyAlert(recentHandoff.outgoingGuard, incomingGuard, discrepancy);
    
    console.log(`⚠️ HANDOFF DISCREPANCY: ${discrepancy.system} - ${recentHandoff.outgoingGuard} claimed ${discrepancy.claimedStatus}, ${incomingGuard} reports ${discrepancy.actualStatus}`);
  } else {
    // No discrepancy - mark as accurate
    const accuracy = handoffAccuracy.get(recentHandoff.outgoingGuard);
    if (accuracy) {
      accuracy.accurate++;
      handoffAccuracy.set(recentHandoff.outgoingGuard, accuracy);
    }
  }
}

// Store check-in for analytics
function logCheckIn(guardPhone, responded, responseTime = null) {
  weeklyAnalytics.checkIns.push({
    guardPhone,
    timestamp: new Date(),
    responded,
    responseTime // in seconds, null if no response
  });
}

// 🔔 PROACTIVE SITE CHECKS: Track guard contact and perform equipment checks
const guardLastContact = new Map();
const guardNextCheck = new Map(); // When to send next check (randomized)
const lastCheckQuestion = new Map(); // Avoid repeating same question
const pendingChecks = new Map(); // Track unanswered checks
const proactiveCheckStats = {
  sent: 0,
  responses: 0,
  issuesDetected: 0,
  bySystem: {
    camera: { sent: 0, passed: 0, issues: 0 },
    gate: { sent: 0, passed: 0, issues: 0 },
    firePanel: { sent: 0, passed: 0, issues: 0 },
    electricFence: { sent: 0, passed: 0, issues: 0 },
    accessControl: { sent: 0, passed: 0, issues: 0 },
    general: { sent: 0, passed: 0, issues: 0 }
  }
};

// Get random check interval (90 min, 2 hrs, 3 hrs, or 4 hrs)
function getRandomCheckInterval() {
  const intervals = [
    90 * 60 * 1000,   // 90 minutes
    120 * 60 * 1000,  // 2 hours
    180 * 60 * 1000,  // 3 hours
    240 * 60 * 1000   // 4 hours
  ];
  return intervals[Math.floor(Math.random() * intervals.length)];
}

// 30 variations per system - prevents message fatigue! (180 total questions)
const PROACTIVE_CHECKS = {
  camera: [
    "Quick check: Cameras still clear?", "All camera feeds looking good?", "Monitor showing all cameras?",
    "How are the cameras looking?", "Video feeds all good?", "Cameras operating normally?",
    "All views clear on the monitor?", "Camera system good?", "Can you see all the cameras?",
    "NVR showing everything?", "Camera check - all clear?", "Video quality looking good?",
    "All camera angles visible?", "Monitor display normal?", "Cameras still up?",
    "Any camera issues?", "Video system running smooth?", "All cameras online?",
    "Surveillance system good?", "Picture quality good on all cameras?", "All feeds recording?",
    "Camera grid showing everything?", "DW system looking normal?", "Guard view clear?",
    "All camera zones visible?", "Video feeds clear?", "No camera problems?",
    "Cameras working as they should?", "Visual on all cameras?", "Everything showing up on screens?"
  ],
  gate: [
    "Gate operating smoothly?", "Gate opening/closing normally?", "Any gate issues?",
    "Gate working properly?", "How's the gate running?", "Gate system good?",
    "Entry gate functioning normally?", "Gate arm moving smoothly?", "Any problems with the gate?",
    "Gate responding to controls?", "Gate motor sound normal?", "Vehicle gate operating OK?",
    "Gate opening cleanly?", "Any gate delays?", "Gate closing all the way?",
    "Access gate working?", "Gate running smoothly tonight?", "Gate mechanism good?",
    "Any gate sticking?", "Gate control responsive?", "Gate movement normal?",
    "Entry system working?", "Gate barrier operating normally?", "Any gate malfunctions?",
    "Gate cycling properly?", "Vehicle access smooth?", "Gate arm functioning?",
    "Gate operating as it should?", "No gate trouble?", "Gate system running well?"
  ],
  firePanel: [
    "Fire panel quiet?", "Fire alarm panel normal?", "Any beeping from fire panel?",
    "Fire system good?", "Fire panel showing normal?", "Alarm panel quiet?",
    "Fire alarm status normal?", "Any fire alarm alerts?", "Fire panel displaying normal?",
    "Alarm system quiet?", "Fire panel lights normal?", "Any fire panel warnings?",
    "Fire alarm panel clear?", "No fire panel issues?", "Fire system status good?",
    "Panel showing all green?", "Fire alarm in normal mode?", "Any fire panel faults?",
    "Fire detection system good?", "Alarm panel functioning normally?", "Fire panel trouble-free?",
    "Any fire system alerts?", "Fire panel display clear?", "Alarm status normal?",
    "Fire panel reading normal?", "No fire alarm activity?", "Fire safety system good?",
    "Panel in ready state?", "Fire alarm all clear?", "Any panel indicators lit?"
  ],
  electricFence: [
    "Perimeter fence showing normal?", "Electric fence energized?", "Fence system normal?",
    "E-fence running properly?", "Perimeter security system good?", "Electric fence status OK?",
    "Fence energizer working?", "Perimeter alarm quiet?", "E-fence panel showing normal?",
    "Fence voltage normal?", "Perimeter fence active?", "Electric fence functioning?",
    "Fence system armed properly?", "Any fence alerts?", "Perimeter system good?",
    "E-fence controller normal?", "Fence line secure?", "Electric fence status clear?",
    "Perimeter fence energized?", "Any fence system issues?", "Fence panel reading normal?",
    "E-fence operational?", "Security fence active?", "Perimeter fence in armed mode?",
    "Fence system displaying normal?", "Any fence alarms?", "Electric fence monitoring normal?",
    "Fence energizer light on?", "Perimeter fence functioning?", "No fence faults?"
  ],
  accessControl: [
    "Any visitor issues tonight?", "Access control smooth?", "Visitor log up to date?",
    "Any visitor questions?", "Access system running well?", "Visitor management going OK?",
    "Any access issues?", "Visitor check-ins smooth?", "Access control system good?",
    "Any unauthorized access attempts?", "Visitor processing going smoothly?", "Entry log current?",
    "Any visitor complications?", "Access procedures running smoothly?", "Visitor badge system working?",
    "Any entry issues?", "Access verification going well?", "Visitor tracking up to date?",
    "Any access control problems?", "Entry procedures smooth?", "Visitor management system good?",
    "Any unauthorized visitors?", "Access log complete?", "ID verification going smoothly?",
    "Any visitor concerns?", "Entry control functioning?", "Visitor escort procedures smooth?",
    "Any access questions?", "Contractor check-ins going well?", "Delivery access smooth?"
  ],
  general: [
    "Any equipment issues?", "All systems nominal?", "Anything acting weird?",
    "Everything running smoothly?", "All systems good?", "Any site issues?",
    "Everything operating normally?", "All equipment functioning?", "Any problems tonight?",
    "Site status good?", "All systems operational?", "Everything working as it should?",
    "Any equipment concerns?", "All good at the site?", "Systems running normally?",
    "Any malfunctions?", "Everything quiet?", "All systems in order?",
    "Any irregularities?", "Equipment all functioning?", "Everything normal on your end?",
    "All systems running smoothly?", "Any issues to report?", "Site conditions normal?",
    "Everything operational?", "Any system alerts?", "All equipment responsive?",
    "Everything in working order?", "Any unusual activity?", "All systems stable?"
  ]
};

// Weighted system selection (based on typical failure rates)
const SYSTEM_WEIGHTS = {
  camera: 60,          // 60% - cameras fail most often
  gate: 25,            // 25% - gates are second most common
  firePanel: 8,        // 8% - fire panels occasionally
  electricFence: 3,    // 3% - fence rarely fails
  accessControl: 2,    // 2% - access questions
  general: 2           // 2% - catch-all
};

// Select system check using weighted random
function selectWeightedSystem() {
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  for (const [system, weight] of Object.entries(SYSTEM_WEIGHTS)) {
    cumulative += weight;
    if (rand <= cumulative) return system;
  }
  return 'general'; // Fallback
}

// Get random question for system (avoid repeating last question)
function getProactiveCheckQuestion(guardPhone) {
  const system = selectWeightedSystem();
  const questions = PROACTIVE_CHECKS[system];
  const lastQuestion = lastCheckQuestion.get(guardPhone);
  
  // Filter out last used question
  const available = questions.filter(q => q !== lastQuestion);
  const selected = available[Math.floor(Math.random() * available.length)];
  
  lastCheckQuestion.set(guardPhone, selected);
  
  return { system, question: selected };
}

// Send proactive site check
async function sendProactiveCheck(guardPhone) {
  const { system, question } = getProactiveCheckQuestion(guardPhone);
  
  await sendSMS(guardPhone, question);
  
  // Track pending check
  pendingChecks.set(guardPhone, {
    system,
    question,
    sentAt: Date.now()
  });
  
  // Update stats
  proactiveCheckStats.sent++;
  proactiveCheckStats.bySystem[system].sent++;
  
  // Update last contact time
  guardLastContact.set(guardPhone, Date.now());
  
  // Schedule RANDOM next check (90 min to 4 hours)
  const nextInterval = getRandomCheckInterval();
  const nextCheckTime = Date.now() + nextInterval;
  guardNextCheck.set(guardPhone, nextCheckTime);
  
  const intervalMinutes = Math.round(nextInterval / 60000);
  console.log(`🔔 Proactive check sent to ${guardPhone}: ${system} - "${question}" (next check in ${intervalMinutes} min)`);
}

// Handle proactive check response
async function handleProactiveCheckResponse(guardPhone, message) {
  const pending = pendingChecks.get(guardPhone);
  if (!pending) return false; // Not a proactive check response
  
  const responseTime = Math.round((Date.now() - pending.sentAt) / 1000);
  const messageLower = message.toLowerCase();
  
  // Positive responses (all good)
  const positiveKeywords = ['good', 'fine', 'ok', 'yes', 'clear', 'normal', 'all set', 'yep', 'yeah', 'yup', 'affirmative', 'correct', 'smooth', 'working'];
  const isPositive = positiveKeywords.some(keyword => messageLower.includes(keyword));
  
  // Negative responses (issue detected)
  const negativeKeywords = ['no', 'down', 'broken', 'not', 'issue', 'problem', 'stuck', 'offline', 'fuzzy', 'weird', 'acting up', 'malfunctioning'];
  const isNegative = negativeKeywords.some(keyword => messageLower.includes(keyword));
  
  if (isPositive && !isNegative) {
    // All good - log and thank
    proactiveCheckStats.responses++;
    proactiveCheckStats.bySystem[pending.system].passed++;
    logCheckIn(guardPhone, true, responseTime);
    
    // ⚡ RESPONSE SPEED: Log proactive check response time
    logResponseSpeed(guardPhone, 'proactive_check', responseTime, {
      system: pending.system,
      question: pending.question
    });
    
    await sendSMS(guardPhone, "Great! Keep up the good work 👍");
    pendingChecks.delete(guardPhone);
    console.log(`✅ Proactive check passed: ${pending.system}`);
    return true; // Handled - don't process further
  }
  
  if (isNegative) {
    // Issue detected! Trigger proactive SOP
    proactiveCheckStats.responses++;
    proactiveCheckStats.issuesDetected++;
    proactiveCheckStats.bySystem[pending.system].issues++;
    logCheckIn(guardPhone, true, responseTime);
    
    // 💰 ROI: Log early detection savings
    logROISavings(
      'early_detection',
      `Proactive ${pending.system} check caught issue before failure`,
      COST_SAVINGS.earlyDetection
    );
    
    console.log(`⚠️ Proactive check detected issue: ${pending.system} - "${message}"`);
    pendingChecks.delete(guardPhone);
    
    // This will be handled by the main conversation handler which will trigger the appropriate SOP
    return false; // Let normal flow handle it
  }
  
  // Unclear response - ask for clarification
  await sendSMS(guardPhone, "Just to confirm - is everything OK with that system? (Reply YES if good, or describe the issue)");
  return true; // Handled - don't process further
}

// Proactive check scheduler - runs every 30 minutes
setInterval(() => {
  const now = Date.now();
  
  conversationState.forEach((state, guardPhone) => {
    // Skip if guard is in active procedure
    if (state.active) return;
    
    // Skip owners/supervisors - they're not guards!
    if (CONFIG.EXCLUDED_FROM_CHECKS.includes(guardPhone)) return;
    
    // Check if it's time for this guard's next random check
    const nextCheckTime = guardNextCheck.get(guardPhone);
    
    if (nextCheckTime && now >= nextCheckTime && !pendingChecks.has(guardPhone)) {
      sendProactiveCheck(guardPhone);
    }
  });
  
  // Also check guards we've tracked but aren't in active conversation
  guardLastContact.forEach((lastTime, guardPhone) => {
    // Skip if already in conversation or has pending check
    if (conversationState.has(guardPhone) || pendingChecks.has(guardPhone)) return;
    
    // Skip owners/supervisors - they're not guards!
    if (CONFIG.EXCLUDED_FROM_CHECKS.includes(guardPhone)) return;
    
    const nextCheckTime = guardNextCheck.get(guardPhone);
    
    // If we have a scheduled check time and it's passed
    if (nextCheckTime && now >= nextCheckTime) {
      sendProactiveCheck(guardPhone);
    } else if (!nextCheckTime) {
      // First time seeing this guard - schedule their first random check
      const firstInterval = getRandomCheckInterval();
      guardNextCheck.set(guardPhone, now + firstInterval);
      
      const intervalMinutes = Math.round(firstInterval / 60000);
      console.log(`📝 New guard detected: ${guardPhone} - first check scheduled in ${intervalMinutes} min`);
    }
  });
}, 30 * 60 * 1000); // Check every 30 minutes

// Store incident with full metadata for analytics
function logIncident(guardPhone, issue, resolved, steps, resolutionTime, escalated = false, abandoned = false) {
  weeklyAnalytics.incidents.push({
    guardPhone,
    issue,
    resolved,
    escalated,
    abandoned,
    stepCount: steps.length,
    resolutionTime, // in seconds
    timestamp: new Date(),
    confidence: null // Will be populated if we tracked it
  });
}

// Store unrecognized phrase for trigger optimization
function logUnrecognizedPhrase(message) {
  // Avoid duplicates and very short messages
  if (message.length > 5 && !weeklyAnalytics.unrecognizedPhrases.includes(message.toLowerCase())) {
    weeklyAnalytics.unrecognizedPhrases.push(message.toLowerCase());
  }
}

// 📋 SHIFT HANDOFF TRIGGERS: Phrases that indicate guard is signing off
const SIGNOFF_TRIGGERS = [
  "signing off", "sign off", "signed off", "sign out", "signing out", "signed out",
  "end of shift", "shift over", "shift done", "shift ended", "shift complete",
  "leaving", "clocking out", "clock out", "clocked out",
  "heading out", "going home", "off duty", "off work",
  "my shift is done", "my shift is over", "shift's done", "shift's over",
  "logging off", "log off", "logged off",
  "wrapping up", "wrapping out", "done for the day", "done for the night",
  "taking off", "out for the night", "im out", "i'm out",
  "bye", "later", "ttyl", "peace", "peace out", "gotta go",
  "see ya", "see you", "heading home", "leaving now"
];

// Handoff checklist questions
const HANDOFF_QUESTIONS = [
  {
    step: 1,
    question: "📱 Where is the duty phone right now? (Be specific - e.g., 'guard shack desk', 'charging station')",
    field: 'phoneLocation',
    validation: (answer) => answer.length > 3 // At least a few characters
  },
  {
    step: 2,
    question: "🔊 Is the phone volume turned ALL THE WAY UP? (Yes/No)",
    field: 'phoneVolume',
    validation: (answer) => {
      const lower = answer.toLowerCase();
      return lower.includes('yes') || lower.includes('no');
    }
  },
  {
    step: 3,
    question: "🔋 Is the phone charged above 50%? (Yes/No)",
    field: 'phoneCharge',
    validation: (answer) => {
      const lower = answer.toLowerCase();
      return lower.includes('yes') || lower.includes('no');
    }
  },
  {
    step: 4,
    question: "📹 Camera status - all feeds clear and recording? (Reply: 'All clear' or describe any issues)",
    field: 'cameraStatus',
    validation: (answer) => answer.length > 2
  },
  {
    step: 5,
    question: "🚪 Gate operating normally? (Reply: 'Normal' or describe any issues)",
    field: 'gateStatus',
    validation: (answer) => answer.length > 2
  },
  {
    step: 6,
    question: "📝 Anything the incoming guard needs to know? (Incidents, visitors, maintenance, or 'Nothing to report')",
    field: 'notes',
    validation: (answer) => answer.length > 2
  }
];

// Check if message is a sign-off trigger
function isSignOffMessage(message) {
  const lower = message.toLowerCase().trim();
  
  // Check if the ENTIRE message is a sign-off phrase
  if (SIGNOFF_TRIGGERS.includes(lower)) {
    return true;
  }
  
  // For multi-word triggers, use includes (safe for longer phrases)
  const multiWordTriggers = SIGNOFF_TRIGGERS.filter(t => t.includes(' '));
  if (multiWordTriggers.some(trigger => lower.includes(trigger))) {
    return true;
  }
  
  // For single-word triggers, use word boundary matching (prevents "water is out" matching "out")
  const singleWordTriggers = SIGNOFF_TRIGGERS.filter(t => !t.includes(' '));
  const words = lower.split(/\s+/);
  
  return singleWordTriggers.some(trigger => words.includes(trigger));
}

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

// 📊 WEEKLY ANALYTICS: Send comprehensive report every Monday at 9am Pacific
function scheduleWeeklyAnalytics() {
  setInterval(() => {
    const now = new Date();
    const pacificTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const dayOfWeek = pacificTime.getDay(); // 0 = Sunday, 1 = Monday
    const hour = pacificTime.getHours();
    const minute = pacificTime.getMinutes();
    
    // Send every Monday at 9:00 AM Pacific
    if (dayOfWeek === 1 && hour === 9 && minute === 0) {
      sendWeeklyAnalyticsEmail();
    }
  }, 60 * 1000); // Check every minute
}

// 📋 CONSOLIDATED HANDOFF REPORT: Send at 6am PST with all 3 shifts
async function sendConsolidatedHandoffReport() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured - skipping handoff report');
    return;
  }
  
  // Organize handoffs by shift type
  const shifts = {
    Day: { expected: false, handoffs: [] },
    Swing: { expected: false, handoffs: [] },
    Midnight: { expected: false, handoffs: [] }
  };
  
  // Check what shifts should have happened in last 24 hours
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Day shift (6am yesterday) - should have ended around 2pm yesterday
  shifts.Day.expected = true;
  
  // Swing shift (2pm yesterday) - should have ended around 10pm yesterday
  shifts.Swing.expected = true;
  
  // Midnight shift (10pm yesterday) - should have ended around 6am today
  shifts.Midnight.expected = true;
  
  // Organize buffered handoffs by shift
  dailyHandoffBuffer.handoffs.forEach(handoff => {
    if (shifts[handoff.shiftType]) {
      shifts[handoff.shiftType].handoffs.push(handoff);
    }
  });
  
  // Build email
  const dateStr = yesterday.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const subject = `📋 Shift Handoff Report - ${dateStr}`;
  
  let htmlContent = `
    <h2>📋 Shift Handoff Report</h2>
    <p><strong>Period:</strong> ${dateStr} 6:00 AM to ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 6:00 AM</p>
    <hr>
  `;
  
  // Report each shift
  ['Day', 'Swing', 'Midnight'].forEach(shiftName => {
    const shift = shifts[shiftName];
    const completedHandoffs = shift.handoffs.filter(h => h.completed);
    const skippedHandoffs = shift.handoffs.filter(h => h.skipped);
    
    let shiftTime = '';
    if (shiftName === 'Day') shiftTime = '6:00 AM - 2:00 PM';
    if (shiftName === 'Swing') shiftTime = '2:00 PM - 10:00 PM';
    if (shiftName === 'Midnight') shiftTime = '10:00 PM - 6:00 AM';
    
    htmlContent += `<h3>${shiftName} Shift (${shiftTime})</h3>`;
    
    if (completedHandoffs.length > 0) {
      // Handoff completed
      const handoff = completedHandoffs[0];
      const guardLast4 = handoff.guardPhone.slice(-4);
      const time = handoff.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      
      htmlContent += `
        <div style="background: #d4edda; padding: 10px; border-left: 4px solid #28a745; margin-bottom: 15px;">
          <p><strong>✅ HANDOFF COMPLETED</strong></p>
          <p><strong>Guard:</strong> ...${guardLast4}</p>
          <p><strong>Time:</strong> ${time}</p>
      `;
      
      if (handoff.issues && handoff.issues.length > 0) {
        htmlContent += `
          <p><strong>⚠️ Issues Reported:</strong></p>
          <ul>
        `;
        handoff.issues.forEach(issue => {
          htmlContent += `<li>${issue}</li>`;
        });
        htmlContent += `</ul>`;
      } else {
        htmlContent += `<p><strong>✅ No issues reported</strong></p>`;
      }
      
      // Show handoff details
      if (handoff.data) {
        htmlContent += `
          <p><strong>Handoff Details:</strong></p>
          <ul>
            <li>📱 Phone: ${handoff.data.phoneLocation}, ${handoff.data.phoneVolume} volume, ${handoff.data.phoneCharge} charge</li>
            <li>📹 Cameras: ${handoff.data.cameraStatus}</li>
            <li>🚪 Gate: ${handoff.data.gateStatus}</li>
            <li>📝 Notes: ${handoff.data.notes || 'None'}</li>
          </ul>
        `;
      }
      
      htmlContent += `</div>`;
      
    } else if (skippedHandoffs.length > 0) {
      // Handoff skipped
      const handoff = skippedHandoffs[0];
      const guardLast4 = handoff.guardPhone.slice(-4);
      const time = handoff.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      
      htmlContent += `
        <div style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin-bottom: 15px;">
          <p><strong>⚠️ HANDOFF SKIPPED</strong></p>
          <p><strong>Guard:</strong> ...${guardLast4}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Action:</strong> Guard chose to skip handoff checklist</p>
        </div>
      `;
      
    } else {
      // No handoff recorded
      htmlContent += `
        <div style="background: #f8d7da; padding: 10px; border-left: 4px solid #dc3545; margin-bottom: 15px;">
          <p><strong>❌ NO HANDOFF RECORDED</strong></p>
          <p>No handoff was performed for this shift.</p>
          <p><strong>Action:</strong> Follow up with ${shiftName} shift guard</p>
        </div>
      `;
    }
  });
  
  htmlContent += `
    <hr>
    <p><em>This report is automatically generated at 6:00 AM PST daily.</em></p>
  `;
  
  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: CONFIG.OWNER_EMAIL,
      subject: subject,
      html: htmlContent
    });
    console.log(`📧 Consolidated handoff report sent for ${dateStr}`);
    
    // Reset the buffer after sending
    resetDailyHandoffBuffer();
    
  } catch (error) {
    console.error('Error sending consolidated handoff report:', error);
  }
}

// DAILY DIGEST: Send the summary email
async function sendDailyDigestEmail() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured - skipping daily digest');
    return;
  }
  
  // Send consolidated handoff report
  await sendConsolidatedHandoffReport();
  
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

// 📊 WEEKLY ANALYTICS: Generate and send comprehensive weekly report
async function sendWeeklyAnalyticsEmail() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured - skipping weekly analytics');
    return;
  }

  const endDate = new Date();
  const startDate = weeklyAnalytics.startDate;
  const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  
  // Skip if no incidents this week
  if (weeklyAnalytics.incidents.length === 0) {
    console.log('📧 No incidents this week - skipping weekly analytics');
    resetWeeklyAnalytics();
    return;
  }

  // ANALYZE DATA
  const incidents = weeklyAnalytics.incidents;
  
  // Count by type
  const cameraIncidents = incidents.filter(i => i.issue.includes('Camera') || i.issue.includes('NVR'));
  const gateIncidents = incidents.filter(i => i.issue.includes('Gate'));
  const fireIncidents = incidents.filter(i => i.issue.includes('Fire'));
  const fenceIncidents = incidents.filter(i => i.issue.includes('Fence'));
  const accessIncidents = incidents.filter(i => i.issue.includes('Access'));
  
  // Calculate metrics
  const resolvedIncidents = incidents.filter(i => i.resolved);
  const escalatedIncidents = incidents.filter(i => i.escalated);
  const abandonedIncidents = incidents.filter(i => i.abandoned);
  
  const avgResolutionTime = resolvedIncidents.length > 0 
    ? Math.round(resolvedIncidents.reduce((sum, i) => sum + (i.resolutionTime || 0), 0) / resolvedIncidents.length / 60)
    : 0;
  
  const escalationRate = incidents.length > 0 
    ? Math.round((escalatedIncidents.length / incidents.length) * 100)
    : 0;
  
  // Guard performance analysis
  const guardStats = {};
  incidents.forEach(incident => {
    const last4 = incident.guardPhone.slice(-4);
    if (!guardStats[last4]) {
      guardStats[last4] = { 
        count: 0, 
        totalTime: 0, 
        escalations: 0,
        resolutions: 0
      };
    }
    guardStats[last4].count++;
    if (incident.resolutionTime) guardStats[last4].totalTime += incident.resolutionTime;
    if (incident.escalated) guardStats[last4].escalations++;
    if (incident.resolved) guardStats[last4].resolutions++;
  });
  
  // Equipment health alerts
  const equipmentAlerts = [];
  const baseline = weeklyAnalytics.lastWeekBaseline;
  
  if (cameraIncidents.length > baseline.cameraCount * 2) {
    equipmentAlerts.push({
      system: 'Camera/NVR System',
      count: cameraIncidents.length,
      increase: Math.round(((cameraIncidents.length - baseline.cameraCount) / Math.max(baseline.cameraCount, 1)) * 100)
    });
  }
  if (gateIncidents.length > baseline.gateCount * 2) {
    equipmentAlerts.push({
      system: 'Gate System',
      count: gateIncidents.length,
      increase: Math.round(((gateIncidents.length - baseline.gateCount) / Math.max(baseline.gateCount, 1)) * 100)
    });
  }
  if (fireIncidents.length > baseline.firePanelCount * 2) {
    equipmentAlerts.push({
      system: 'Fire Panel',
      count: fireIncidents.length,
      increase: Math.round(((fireIncidents.length - baseline.firePanelCount) / Math.max(baseline.firePanelCount, 1)) * 100)
    });
  }
  
  // Peak time analysis
  const hourCounts = {};
  incidents.forEach(incident => {
    const hour = incident.timestamp.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const peakHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b, 0);
  const peakCount = hourCounts[peakHour];
  const peakPercentage = Math.round((peakCount / incidents.length) * 100);

  // BUILD EMAIL
  const subject = `📊 WatchTower Weekly Analytics - ${dateRange}`;
  
  let htmlContent = `
    <h2>📊 WATCHTOWER WEEKLY REPORT</h2>
    <p><strong>Week:</strong> ${dateRange}</p>
    <hr>
    
    <h3>📋 INCIDENT SUMMARY</h3>
    <ul>
      <li>Camera/NVR: ${cameraIncidents.length} incidents ${getComparisonIcon(cameraIncidents.length, baseline.cameraCount)}</li>
      <li>Gate Issues: ${gateIncidents.length} incidents ${getComparisonIcon(gateIncidents.length, baseline.gateCount)}</li>
      <li>Fire Panel: ${fireIncidents.length} incidents ${getComparisonIcon(fireIncidents.length, baseline.firePanelCount)}</li>
      <li>Electric Fence: ${fenceIncidents.length} incidents ${getComparisonIcon(fenceIncidents.length, baseline.fenceCount)}</li>
      <li>Access Control: ${accessIncidents.length} questions answered ${getComparisonIcon(accessIncidents.length, baseline.accessCount)}</li>
    </ul>
    <p><strong>TOTAL:</strong> ${incidents.length} incidents this week</p>
    <br>
    
    <h3>📈 PERFORMANCE METRICS</h3>
    <ul>
      <li>Avg resolution time: ${avgResolutionTime} min</li>
      <li>Escalation rate: ${escalationRate}% ${escalationRate > 10 ? '⚠️ Above target' : '✅'}</li>
      <li>Abandonment incidents: ${abandonedIncidents.length}</li>
      <li>Successful resolutions: ${resolvedIncidents.length} (${Math.round((resolvedIncidents.length / incidents.length) * 100)}%)</li>
    </ul>
    <br>
  `;
  
  // Equipment health alerts
  if (equipmentAlerts.length > 0) {
    htmlContent += `
      <h3>⚠️ EQUIPMENT HEALTH ALERTS</h3>
      <ul>
    `;
    equipmentAlerts.forEach(alert => {
      htmlContent += `
        <li><strong>${alert.system}:</strong> ${alert.count} incidents this week (↑${alert.increase}% above baseline)<br>
        → <strong>Recommend maintenance check</strong></li>
      `;
    });
    htmlContent += `</ul><br>`;
  } else {
    htmlContent += `
      <h3>✅ EQUIPMENT HEALTH</h3>
      <p>All systems operating within normal parameters</p>
      <br>
    `;
  }
  
  // Guard insights
  htmlContent += `
    <h3>👤 GUARD INSIGHTS</h3>
    <ul>
  `;
  Object.keys(guardStats).forEach(guardLast4 => {
    const stats = guardStats[guardLast4];
    const avgTime = stats.totalTime > 0 ? Math.round(stats.totalTime / stats.resolutions / 60) : 0;
    const successRate = Math.round((stats.resolutions / stats.count) * 100);
    
    let performance = '✅';
    let notes = '';
    if (stats.escalations > 2) {
      performance = '⚠️';
      notes = ' - Consider additional training';
    } else if (avgTime < 5 && successRate > 90) {
      performance = '⭐';
      notes = ' - Star performer';
    }
    
    htmlContent += `
      <li>Guard ending in ${guardLast4}: ${stats.count} incidents, ${avgTime} min avg ${performance}${notes}</li>
    `;
  });
  htmlContent += `</ul><br>`;
  
  // 🔔 Proactive check-ins
  if (weeklyAnalytics.checkIns.length > 0) {
    const totalCheckIns = weeklyAnalytics.checkIns.length;
    const respondedCheckIns = weeklyAnalytics.checkIns.filter(c => c.responded);
    const responseRate = Math.round((respondedCheckIns.length / totalCheckIns) * 100);
    const avgResponseTime = respondedCheckIns.length > 0
      ? Math.round(respondedCheckIns.reduce((sum, c) => sum + (c.responseTime || 0), 0) / respondedCheckIns.length / 60)
      : 0;
    
    const noResponseGuards = weeklyAnalytics.checkIns
      .filter(c => !c.responded)
      .map(c => c.guardPhone.slice(-4))
      .filter((v, i, a) => a.indexOf(v) === i); // unique
    
    htmlContent += `
      <h3>🔔 PROACTIVE CHECK-INS</h3>
      <ul>
        <li>Check-ins sent: ${totalCheckIns}</li>
        <li>Response rate: ${responseRate}% (${respondedCheckIns.length}/${totalCheckIns}) ${responseRate >= 80 ? '✅' : '⚠️'}</li>
        <li>Avg response time: ${avgResponseTime} min</li>
    `;
    
    if (noResponseGuards.length > 0) {
      htmlContent += `<li>No response from: Guard(s) ending in ${noResponseGuards.join(', ')} - follow up recommended</li>`;
    }
    
    htmlContent += `
      </ul>
      <p><em>Guards appreciate the check-ins - shows you care! 💚</em></p>
      <br>
    `;
  }
  
  // Trigger optimization
  if (weeklyAnalytics.unrecognizedPhrases.length > 0) {
    htmlContent += `
      <h3>🔧 TRIGGER OPTIMIZATION SUGGESTIONS</h3>
      <p>Guards used these phrases that didn't trigger SOPs:</p>
      <ul>
    `;
    weeklyAnalytics.unrecognizedPhrases.slice(0, 10).forEach(phrase => {
      htmlContent += `<li>"${phrase}"</li>`;
    });
    htmlContent += `</ul>
      <p><em>Consider adding these to relevant trigger lists</em></p>
      <br>
    `;
  }
  
  // Peak incident times
  htmlContent += `
    <h3>🕐 PEAK INCIDENT TIMES</h3>
    <p><strong>${formatHour(peakHour)}</strong>: ${peakPercentage}% of incidents occurred during this hour</p>
    <p><em>Consider adjusting staffing or preventive maintenance during peak hours</em></p>
    <br>
  `;
  
  // Proactive site checks
  if (proactiveCheckStats.sent > 0) {
    const responseRate = Math.round((proactiveCheckStats.responses / proactiveCheckStats.sent) * 100);
    
    htmlContent += `
      <h3>🔔 PROACTIVE SITE CHECKS</h3>
      <p><strong>System Checks Performed:</strong> ${proactiveCheckStats.sent}</p>
      <ul>
        <li>Camera checks: ${proactiveCheckStats.bySystem.camera.sent} sent, ${proactiveCheckStats.bySystem.camera.passed} passed${proactiveCheckStats.bySystem.camera.issues > 0 ? `, ${proactiveCheckStats.bySystem.camera.issues} issues detected ⚠️` : ''}</li>
        <li>Gate checks: ${proactiveCheckStats.bySystem.gate.sent} sent, ${proactiveCheckStats.bySystem.gate.passed} passed${proactiveCheckStats.bySystem.gate.issues > 0 ? `, ${proactiveCheckStats.bySystem.gate.issues} issues detected ⚠️` : ''}</li>
        <li>Fire panel checks: ${proactiveCheckStats.bySystem.firePanel.sent} sent, ${proactiveCheckStats.bySystem.firePanel.passed} passed${proactiveCheckStats.bySystem.firePanel.issues > 0 ? `, ${proactiveCheckStats.bySystem.firePanel.issues} issues detected ⚠️` : ''}</li>
        <li>Electric fence checks: ${proactiveCheckStats.bySystem.electricFence.sent} sent, ${proactiveCheckStats.bySystem.electricFence.passed} passed${proactiveCheckStats.bySystem.electricFence.issues > 0 ? `, ${proactiveCheckStats.bySystem.electricFence.issues} issues detected ⚠️` : ''}</li>
        <li>Access control checks: ${proactiveCheckStats.bySystem.accessControl.sent} sent, ${proactiveCheckStats.bySystem.accessControl.passed} passed${proactiveCheckStats.bySystem.accessControl.issues > 0 ? `, ${proactiveCheckStats.bySystem.accessControl.issues} issues detected ⚠️` : ''}</li>
      </ul>
      <p><strong>Response Rate:</strong> ${responseRate}% (${proactiveCheckStats.responses}/${proactiveCheckStats.sent})</p>
      ${proactiveCheckStats.issuesDetected > 0 ? `<p><strong>✅ Early Issue Detection:</strong> ${proactiveCheckStats.issuesDetected} issues caught before escalation!</p>` : ''}
      <br>
    `;
  }
  
  // Shift handoff stats
  if (weeklyAnalytics.handoffs.length > 0) {
    const totalHandoffs = weeklyAnalytics.handoffs.length;
    const handoffsWithDiscrepancies = weeklyAnalytics.handoffs.filter(h => h.discrepancies.length > 0).length;
    const accurateHandoffs = totalHandoffs - handoffsWithDiscrepancies;
    const overallAccuracy = Math.round((accurateHandoffs / totalHandoffs) * 100);
    
    // Build per-guard leaderboard
    const guardHandoffStats = {};
    handoffAccuracy.forEach((stats, guardPhone) => {
      if (stats.total > 0) {
        const last4 = guardPhone.slice(-4);
        guardHandoffStats[last4] = {
          total: stats.total,
          accurate: stats.accurate,
          discrepancies: stats.discrepancies.length,
          accuracy: Math.round((stats.accurate / stats.total) * 100)
        };
      }
    });
    
    // Sort by accuracy
    const sortedGuards = Object.entries(guardHandoffStats)
      .sort((a, b) => b[1].accuracy - a[1].accuracy);
    
    htmlContent += `
      <h3>📋 SHIFT HANDOFF PERFORMANCE</h3>
      <p><strong>Total Handoffs:</strong> ${totalHandoffs}</p>
      <p><strong>Overall Accuracy:</strong> ${overallAccuracy}% (${accurateHandoffs}/${totalHandoffs} accurate)</p>
      ${handoffsWithDiscrepancies > 0 ? `<p><strong>⚠️ Discrepancies:</strong> ${handoffsWithDiscrepancies} handoffs had equipment status mismatches</p>` : ''}
      <br>
      
      <h4>Guard Handoff Accuracy Leaderboard:</h4>
      <ul>
    `;
    
    sortedGuards.forEach(([last4, stats], index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
      const flag = stats.accuracy < 80 ? '⚠️' : stats.accuracy === 100 ? '⭐' : '';
      htmlContent += `
        <li>${medal} Guard ...${last4}: ${stats.accuracy}% accuracy (${stats.accurate}/${stats.total}) ${flag}</li>
      `;
    });
    
    htmlContent += `
      </ul>
      ${handoffsWithDiscrepancies > 0 ? `<p><em>Discrepancies occur when incoming guard reports equipment issues within 60 minutes of outgoing guard reporting "all clear"</em></p>` : ''}
      <br>
    `;
  }
  
  // ⚡ RESPONSE SPEED ANALYTICS - THE ALERTNESS SECTION!
  if (responseSpeedTracking.guards.size > 0) {
    const guardSpeedData = [];
    
    responseSpeedTracking.guards.forEach((data, guardPhone) => {
      if (data.proactiveCheckResponses.length > 0 || data.sopStepResponses.length > 0) {
        const last4 = guardPhone.slice(-4);
        guardSpeedData.push({
          last4,
          averages: data.averages,
          alertnessScore: data.alertnessScore,
          totalResponses: data.proactiveCheckResponses.length + data.sopStepResponses.length,
          timeOfDay: getTimeOfDayPattern(guardPhone)
        });
      }
    });
    
    // Sort by alertness score
    guardSpeedData.sort((a, b) => b.alertnessScore - a.alertnessScore);
    
    if (guardSpeedData.length > 0) {
      const teamAvgOverall = Math.round(
        guardSpeedData.reduce((sum, g) => sum + g.averages.overall, 0) / guardSpeedData.length
      );
      const teamAvgAlertnessScore = Math.round(
        guardSpeedData.reduce((sum, g) => sum + g.alertnessScore, 0) / guardSpeedData.length
      );
      
      htmlContent += `
        <h3>⚡ RESPONSE SPEED ANALYTICS</h3>
        <p><strong>Team Average Response Time:</strong> ${Math.floor(teamAvgOverall / 60)}:${(teamAvgOverall % 60).toString().padStart(2, '0')} min</p>
        <p><strong>Team Alertness Score:</strong> ${teamAvgAlertnessScore}/100 ${teamAvgAlertnessScore >= 80 ? '✅' : teamAvgAlertnessScore >= 60 ? '⚠️' : '🚨'}</p>
        <br>
        
        <h4>Guard Response Performance:</h4>
        <ul>
      `;
      
      guardSpeedData.forEach((guard, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        const flag = guard.alertnessScore >= 80 ? '⭐ ALERT' : guard.alertnessScore >= 60 ? '✅ GOOD' : guard.alertnessScore >= 40 ? '⚠️ SLOW' : '🚨 VERY SLOW';
        
        const proactiveAvg = guard.averages.proactiveCheck > 0 ? 
          `${Math.floor(guard.averages.proactiveCheck / 60)}:${(guard.averages.proactiveCheck % 60).toString().padStart(2, '0')}` : 'N/A';
        const sopAvg = guard.averages.sopStep > 0 ? 
          `${Math.floor(guard.averages.sopStep / 60)}:${(guard.averages.sopStep % 60).toString().padStart(2, '0')}` : 'N/A';
        
        htmlContent += `
          <li>${medal} <strong>Guard ...${guard.last4}:</strong> ${flag}
            <ul>
              <li>Alertness Score: ${guard.alertnessScore}/100</li>
              <li>Avg response to proactive checks: ${proactiveAvg} min</li>
              <li>Avg time between SOP steps: ${sopAvg} min</li>
              <li>Total responses: ${guard.totalResponses}</li>
            </ul>
          </li>
        `;
      });
      
      htmlContent += `
        </ul>
        <br>
        
        <h4>🕐 Time-of-Day Patterns:</h4>
      `;
      
      // Analyze team patterns by time of day
      const teamPatterns = { morning: [], afternoon: [], evening: [], night: [] };
      guardSpeedData.forEach(guard => {
        if (guard.timeOfDay) {
          Object.keys(guard.timeOfDay).forEach(period => {
            if (guard.timeOfDay[period] && guard.timeOfDay[period].average) {
              teamPatterns[period].push(guard.timeOfDay[period].average);
            }
          });
        }
      });
      
      htmlContent += `<ul>`;
      
      ['morning', 'afternoon', 'evening', 'night'].forEach(period => {
        const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
        const timeRange = period === 'morning' ? '6am-12pm' : 
                         period === 'afternoon' ? '12pm-6pm' :
                         period === 'evening' ? '6pm-12am' : '12am-6am';
        
        if (teamPatterns[period].length > 0) {
          const avg = Math.round(teamPatterns[period].reduce((a, b) => a + b, 0) / teamPatterns[period].length);
          const rating = avg <= 300 ? '✅ Excellent' : avg <= 420 ? '👍 Good' : avg <= 600 ? '⚠️ Slow' : '🚨 Very Slow';
          htmlContent += `
            <li><strong>${periodLabel} (${timeRange}):</strong> ${Math.floor(avg / 60)}:${(avg % 60).toString().padStart(2, '0')} avg ${rating}</li>
          `;
        }
      });
      
      htmlContent += `
        </ul>
        <p><em>Target response time: &lt;5 minutes = 100 points | &gt;10 minutes = 0 points</em></p>
        <br>
      `;
    }
  }
  
  // 📋 GUARD REPORTS SUBMITTED
  const weekReports = submittedReports.filter(r => {
    const reportDate = new Date(r.timestamp);
    const weekStart = new Date(weeklyAnalytics.startDate);
    return reportDate >= weekStart;
  });
  
  if (weekReports.length > 0) {
    const reportsByType = {
      equipment: weekReports.filter(r => r.type === 'equipment').length,
      facility: weekReports.filter(r => r.type === 'facility').length,
      incident: weekReports.filter(r => r.type === 'incident').length,
      supply: weekReports.filter(r => r.type === 'supply').length,
      feedback: weekReports.filter(r => r.type === 'feedback').length
    };
    
    // Count reports per guard
    const reportsByGuard = {};
    weekReports.forEach(r => {
      const last4 = r.guardPhone.slice(-4);
      reportsByGuard[last4] = (reportsByGuard[last4] || 0) + 1;
    });
    
    // Sort guards by report count
    const sortedReportingGuards = Object.entries(reportsByGuard)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5
    
    // Calculate avg submission time
    const avgSubmissionTime = weekReports.length > 0 ?
      Math.round(weekReports.reduce((sum, r) => sum + r.responseTime, 0) / weekReports.length / 60) : 0;
    
    htmlContent += `
      <h3>📋 GUARD REPORTS SUBMITTED</h3>
      <p><strong>Total Reports:</strong> ${weekReports.length}</p>
      
      <h4>Reports by Type:</h4>
      <ul>
        ${reportsByType.equipment > 0 ? `<li>Equipment/Uniform Requests: ${reportsByType.equipment}</li>` : ''}
        ${reportsByType.facility > 0 ? `<li>Facility Issues: ${reportsByType.facility}</li>` : ''}
        ${reportsByType.incident > 0 ? `<li>Incident Reports: ${reportsByType.incident}</li>` : ''}
        ${reportsByType.supply > 0 ? `<li>Supply Requests: ${reportsByType.supply}</li>` : ''}
        ${reportsByType.feedback > 0 ? `<li>General Feedback: ${reportsByType.feedback}</li>` : ''}
      </ul>
      
      ${sortedReportingGuards.length > 0 ? `
        <h4>Top Reporting Guards:</h4>
        <ul>
          ${sortedReportingGuards.map(([last4, count]) => 
            `<li>Guard ...${last4}: ${count} report${count > 1 ? 's' : ''} ${count >= 3 ? '⭐ (engaged!)' : ''}</li>`
          ).join('')}
        </ul>
      ` : ''}
      
      <p><strong>Avg time to submit report:</strong> ${avgSubmissionTime} min (fast!)</p>
      <p><em>Guards are using the conversational reporting system to quickly submit professional reports</em></p>
      <br>
    `;
  }
  
  // 💰 ROI Summary - THE MONEY SECTION!
  const weekSavings = roiTracking.currentMonth.totalSavings;
  const earlyDetectionCount = roiTracking.currentMonth.earlyDetections.length;
  const preventedEscalationCount = roiTracking.currentMonth.preventedEscalations.length;
  const handoffCatchCount = roiTracking.currentMonth.handoffCatches.length;
  
  if (weekSavings > 0) {
    const watchtowerCost = 100; // Estimated monthly cost
    const roi = Math.round((weekSavings / watchtowerCost) * 100);
    
    htmlContent += `
      <h3>💰 COST SAVINGS & ROI</h3>
      <p><strong style="font-size: 20px; color: #28a745;">This Week's Savings: $${weekSavings.toLocaleString()}</strong></p>
      
      <h4>Breakdown:</h4>
      <ul>
        ${earlyDetectionCount > 0 ? `<li><strong>Early Issue Detection:</strong> ${earlyDetectionCount} issues caught before failure → $${earlyDetectionCount * COST_SAVINGS.earlyDetection} saved</li>` : ''}
        ${preventedEscalationCount > 0 ? `<li><strong>Prevented Emergency Calls:</strong> ${preventedEscalationCount} incidents resolved by guards → $${preventedEscalationCount * COST_SAVINGS.emergencyServiceCall} saved</li>` : ''}
        ${handoffCatchCount > 0 ? `<li><strong>Handoff Catches:</strong> ${handoffCatchCount} issues caught during shift change → $${handoffCatchCount * (COST_SAVINGS.handoffPhoneIssue + COST_SAVINGS.handoffEquipmentIssue) / 2} saved</li>` : ''}
      </ul>
      
      <h4>💎 The Value:</h4>
      <ul>
        <li>WatchTower Investment: ~$${watchtowerCost}/month</li>
        <li>This Week's Return: $${weekSavings}</li>
        <li>Projected Monthly ROI: ${roi}%</li>
      </ul>
      
      <p><strong>✅ Bottom Line:</strong> Every dollar invested in WatchTower returns $${Math.round(weekSavings / watchtowerCost)} in cost savings!</p>
      <br>
    `;
  }
  
  htmlContent += `
    <hr>
    <p><em>Next report: Next Monday at 9:00 AM Pacific</em></p>
  `;

  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: CONFIG.OWNER_EMAIL,
      subject: subject,
      html: htmlContent
    });
    console.log(`📊 Weekly analytics sent: ${incidents.length} incidents analyzed`);
    
    // Update baseline for next week
    weeklyAnalytics.lastWeekBaseline = {
      cameraCount: cameraIncidents.length,
      gateCount: gateIncidents.length,
      firePanelCount: fireIncidents.length,
      fenceCount: fenceIncidents.length,
      accessCount: accessIncidents.length
    };
    
    // Reset for new week
    resetWeeklyAnalytics();
  } catch (error) {
    console.error('Error sending weekly analytics:', error);
  }
}

// Helper function to reset weekly analytics
function resetWeeklyAnalytics() {
  weeklyAnalytics.incidents = [];
  weeklyAnalytics.unrecognizedPhrases = [];
  weeklyAnalytics.checkIns = [];
  weeklyAnalytics.handoffs = [];
  weeklyAnalytics.startDate = new Date();
  
  // Reset proactive check stats
  proactiveCheckStats.sent = 0;
  proactiveCheckStats.responses = 0;
  proactiveCheckStats.issuesDetected = 0;
  Object.keys(proactiveCheckStats.bySystem).forEach(system => {
    proactiveCheckStats.bySystem[system] = { sent: 0, passed: 0, issues: 0 };
  });
  
  // Reset handoff accuracy tracking (but keep running totals)
  handoffAccuracy.forEach((stats, guardPhone) => {
    handoffAccuracy.set(guardPhone, {
      total: 0,
      accurate: 0,
      discrepancies: []
    });
  });
  
  // 💰 Archive current month's ROI and reset
  if (roiTracking.currentMonth.totalSavings > 0) {
    roiTracking.monthlyData.push({
      month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      ...roiTracking.currentMonth
    });
  }
  
  roiTracking.currentMonth = {
    startDate: new Date(),
    earlyDetections: [],
    preventedEscalations: [],
    handoffCatches: [],
    totalSavings: 0
  };
  
  // ⚡ Reset response speed tracking (keep guards in map but clear weekly data)
  responseSpeedTracking.guards.forEach((data, guardPhone) => {
    responseSpeedTracking.guards.set(guardPhone, {
      proactiveCheckResponses: [],
      sopStepResponses: [],
      initialIncidentResponses: [],
      averages: {
        proactiveCheck: 0,
        sopStep: 0,
        initialIncident: 0,
        overall: 0
      },
      alertnessScore: 100,
      byTimeOfDay: {
        morning: [],
        afternoon: [],
        evening: [],
        night: []
      }
    });
  });
  responseSpeedTracking.allResponses = [];
}

// Helper function for comparison icons
function getComparisonIcon(current, baseline) {
  if (baseline === 0) return '';
  const change = current - baseline;
  if (change > 0) return `(↑${change} from last week)`;
  if (change < 0) return `(↓${Math.abs(change)} from last week)`;
  return '(→ same as last week)';
}

// Helper function to format hour
function formatHour(hour) {
  const h = parseInt(hour);
  if (h === 0) return '12:00 AM - 1:00 AM';
  if (h < 12) return `${h}:00 AM - ${h + 1}:00 AM`;
  if (h === 12) return '12:00 PM - 1:00 PM';
  return `${h - 12}:00 PM - ${h - 11}:00 PM`;
}

// Start the daily digest scheduler
scheduleDailyDigest();

// Start the weekly analytics scheduler
scheduleWeeklyAnalytics();

// Start the random spot check scheduler
scheduleRandomSpotChecks();
console.log('👁️ Random spot check scheduler started');

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
      sendAbandonmentAlert(guardPhone, state.issue, state.currentStep, state.completedSteps, state.startTime);
      
      // Mark as alerted so we don't spam
      abandonmentAlertsSent.set(guardPhone, true);
    }
  });
}, 2 * 60 * 1000); // Check every 2 minutes

// 🔔 PROACTIVE CHECK-INS: Check every 30 minutes for guards who've been silent 4+ hours
setInterval(() => {
  const now = Date.now();
  const FOUR_HOURS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
  
  guardLastContact.forEach((lastContactTime, guardPhone) => {
    const timeSinceContact = now - lastContactTime;
    const state = conversationState.get(guardPhone);
    
    // Skip if:
    // - Less than 4 hours since last contact
    // - Already sent a check-in and waiting for response
    // - Guard is currently in an active procedure
    if (timeSinceContact < FOUR_HOURS) return;
    if (checkInsSent.has(guardPhone)) return;
    if (state && state.active) return; // Don't interrupt active procedures
    
    console.log(`🔔 Proactive check-in: Guard ${guardPhone} silent for ${Math.round(timeSinceContact / 1000 / 60 / 60)} hours`);
    
    // Send friendly check-in
    sendSMS(guardPhone, "Hey! Been quiet tonight. Everything good? Reply OK if all's well. 👍");
    
    // Mark as checked in (with timestamp for response tracking)
    checkInsSent.set(guardPhone, Date.now());
  });
}, 30 * 60 * 1000); // Check every 30 minutes

// Configuration
const CONFIG = {
  TWILIO_PHONE: process.env.TWILIO_PHONE_NUMBER,
  WHATSAPP_MODE: process.env.WHATSAPP_MODE === 'true',
  SUPERVISOR_PHONE: process.env.SUPERVISOR_PHONE || '+1234567890',
  OWNER_EMAIL: process.env.OWNER_EMAIL,
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:3000',
  MAX_RETRIES: 2,
  
  // 🚫 EXCLUDED FROM PROACTIVE CHECKS: Owners/supervisors who text in to test
  // These numbers will NOT receive random site check texts
  EXCLUDED_FROM_CHECKS: [
    '+19259221067', // Chris (owner) - testing number
    process.env.SUPERVISOR_PHONE // Supervisor
  ].filter(Boolean)
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
    
    // Improved logging - show full message
    const msgType = imageUrl ? 'MMS' : CONFIG.WHATSAPP_MODE ? 'WhatsApp' : 'SMS';
    const toDisplay = to.slice(-4);
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📤 ${msgType} sent to ...${toDisplay} (${message.length} chars):`);
    console.log(message);
    if (imageUrl) console.log(`📸 Image: ${imageUrl}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Send email report
async function sendEmailReport(guardPhone, issue, resolved, steps, conversationHistory = []) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured - skipping report');
    return;
  }
  
  const status = resolved ? 'RESOLVED ✅' : 'ESCALATED ⚠️';
  const subject = `WatchTower Report: ${issue} - ${status}`;
  
  // Build conversation transcript HTML
  let transcriptHtml = '';
  if (conversationHistory && conversationHistory.length > 0) {
    transcriptHtml = `
      <hr>
      <h3>📱 Conversation Transcript:</h3>
      <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; font-family: monospace;">
    `;
    
    conversationHistory.forEach(msg => {
      const speaker = msg.role === 'guard' ? '👤 Guard' : '🤖 WatchTower';
      const color = msg.role === 'guard' ? '#333' : '#007bff';
      transcriptHtml += `
        <div style="margin: 10px 0; padding: 8px; background: white; border-radius: 4px;">
          <strong style="color: ${color};">${speaker}:</strong><br>
          <span style="white-space: pre-wrap;">${msg.content}</span>
        </div>
      `;
    });
    
    transcriptHtml += '</div>';
  }
  
  const htmlContent = `
    <h2>WatchTower Incident Report</h2>
    <p><strong>Status:</strong> ${status}</p>
    <p><strong>Guard Phone:</strong> ${guardPhone}</p>
    <p><strong>Issue:</strong> ${issue}</p>
    <p><strong>Date/Time:</strong> ${new Date().toLocaleString()}</p>
    ${transcriptHtml}
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
  
  // Calculate time spent before escalation
  const resolutionTime = state.startTime ? Math.round((Date.now() - state.startTime) / 1000) : 0;
  
  // Log incident for weekly analytics
  logIncident(guardPhone, issue, false, state.completedSteps || [], resolutionTime, true, false);
  
  // Send email with full conversation transcript
  await sendEmailReport(guardPhone, issue, false, state.completedSteps || [], state.conversationHistory || []);
  
  console.log(`Escalated issue for ${guardPhone}: ${issue}`);
}

// Tell guard to CALL supervisor instead of texting
async function tellGuardToCall(guardPhone, reason) {
  const message = `📞 For urgent matters like this, please CALL your supervisor directly:\n\n` +
    `Chris: (925) 222-1067\n` +
    `Emma: (510) 800-7035\n\n` +
    `WatchTower is best for equipment issues and reports. For immediate help, calling is faster!`;
  
  await sendSMS(guardPhone, message);
  
  // Send you a non-urgent notification email
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    try {
      const now = new Date();
      await emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: CONFIG.OWNER_EMAIL,
        subject: `📞 Guard Requested Help - ${now.toLocaleTimeString()}`,
        html: `
          <h2>📞 Guard Requested Supervisor Help</h2>
          <p><strong>Guard:</strong> ${guardPhone}</p>
          <p><strong>Time:</strong> ${now.toLocaleString()}</p>
          <p><strong>Message:</strong> ${reason}</p>
          <hr>
          <p><em>Guard was instructed to call supervisor directly.</em></p>
          <p><em>This is a notification only - no action needed unless guard calls.</em></p>
        `
      });
    } catch (error) {
      console.error('Error sending notification email:', error);
    }
  }
  
  console.log(`📞 Told guard ${guardPhone} to call supervisor: ${reason}`);
}

// Send abandonment alert (guard went silent mid-procedure) - IMMEDIATE EMAIL
async function sendAbandonmentAlert(guardPhone, issue, currentStep, completedSteps, startTime) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured - skipping abandonment alert');
    return;
  }
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  
  // Calculate time before abandonment
  const resolutionTime = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
  
  // Log incident for weekly analytics
  logIncident(guardPhone, issue, false, completedSteps, resolutionTime, false, true);
  
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

// 📋 Send shift handoff completion email
async function sendHandoffCompletionEmail(guardPhone, handoffData, shiftStats) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured - skipping handoff email');
    return;
  }
  
  const now = new Date();
  const guardLast4 = guardPhone.slice(-4);
  
  const subject = `✅ Shift Handoff Completed - ${now.toLocaleDateString()}`;
  
  const htmlContent = `
    <h2>✅ SHIFT HANDOFF COMPLETED</h2>
    <p><strong>Outgoing Guard:</strong> ...${guardLast4}</p>
    <p><strong>Time:</strong> ${now.toLocaleString()}</p>
    <hr>
    
    <h3>📋 HANDOFF CHECKLIST:</h3>
    <ul>
      <li>📱 <strong>Phone Location:</strong> ${handoffData.phoneLocation}</li>
      <li>🔊 <strong>Phone Volume:</strong> ${handoffData.phoneVolume.toUpperCase()}</li>
      <li>🔋 <strong>Phone Charge:</strong> ${handoffData.phoneCharge.toUpperCase()}</li>
      <li>📹 <strong>Cameras:</strong> ${handoffData.cameraStatus.toUpperCase()}</li>
      <li>🚪 <strong>Gate:</strong> ${handoffData.gateStatus.toUpperCase()}</li>
      <li>📝 <strong>Notes:</strong> ${handoffData.notes}</li>
    </ul>
    <hr>
    
    <h3>📊 SHIFT STATS:</h3>
    <ul>
      ${shiftStats.incidents > 0 ? `<li>Incidents handled: ${shiftStats.incidents}</li>` : ''}
      ${shiftStats.avgResolution ? `<li>Avg resolution time: ${shiftStats.avgResolution} min</li>` : ''}
      ${shiftStats.proactiveChecks ? `<li>Proactive checks responded: ${shiftStats.proactiveChecks}</li>` : ''}
      ${shiftStats.duration ? `<li>Shift duration: ${shiftStats.duration} hours</li>` : ''}
    </ul>
    
    <p><em>Incoming guard will receive briefing when they start their shift.</em></p>
  `;

  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: CONFIG.OWNER_EMAIL,
      subject: subject,
      html: htmlContent
    });
    console.log(`📧 Handoff completion email sent for guard ...${guardLast4}`);
  } catch (error) {
    console.error('Error sending handoff completion email:', error);
  }
}

// ⚠️ Send handoff discrepancy alert email
async function sendHandoffDiscrepancyAlert(outgoingGuard, incomingGuard, discrepancy) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured - skipping discrepancy alert');
    return;
  }
  
  const outgoingLast4 = outgoingGuard.slice(-4);
  const incomingLast4 = incomingGuard.slice(-4);
  
  const subject = `⚠️ HANDOFF DISCREPANCY - ${discrepancy.system} System`;
  
  const htmlContent = `
    <h2>⚠️ HANDOFF DISCREPANCY DETECTED</h2>
    <p><strong>System:</strong> ${discrepancy.system}</p>
    <p><strong>Time Between Handoff and Report:</strong> ${discrepancy.minutesAfterHandoff} minutes</p>
    <hr>
    
    <h3>WHAT HAPPENED:</h3>
    <p>🔴 <strong>Outgoing Guard ...${outgoingLast4} reported:</strong> ${discrepancy.claimedStatus}</p>
    <p>🟡 <strong>Incoming Guard ...${incomingLast4} reported:</strong> ${discrepancy.actualStatus}</p>
    <hr>
    
    <h3>POSSIBLE EXPLANATIONS:</h3>
    <ul>
      <li>${discrepancy.system} system failed in the ${discrepancy.minutesAfterHandoff} minutes between handoff and incoming guard (equipment issue)</li>
      <li>Outgoing guard did NOT properly verify ${discrepancy.system.toLowerCase()} status before signing off (training issue)</li>
      <li>Outgoing guard knowingly provided inaccurate handoff information (discipline issue)</li>
    </ul>
    
    <p><strong>⚠️ Recommended Action:</strong> Review with outgoing guard ...${outgoingLast4} to determine cause.</p>
    <p><em>This discrepancy has been added to guard's handoff accuracy record.</em></p>
  `;

  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: CONFIG.OWNER_EMAIL,
      subject: subject,
      html: htmlContent
    });
    console.log(`📧 HANDOFF DISCREPANCY alert sent: ${discrepancy.system}`);
  } catch (error) {
    console.error('Error sending discrepancy alert:', error);
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
    return isNaN(stepNum) ? stepNum : stepNum;

  } catch (error) {
    console.error('Location determination failed:', error);
    return 1; // Default to step 1
  }
}

// ==========================================
// GUARD REPORT SYSTEM
// ==========================================

// Start the report submission process
async function startReportProcess(guardPhone, initialMessage = null) {
  const reportState = {
    step: 'type_selection',
    type: null,
    data: {},
    photoAttached: false,
    startTime: Date.now(),
    initialMessage
  };
  
  activeReports.set(guardPhone, reportState);
  
  await sendSMS(guardPhone,
    "📋 I'll help you submit a professional report!\n\n" +
    "What type of report?\n\n" +
    "1️⃣ Equipment/Uniform Request\n" +
    "2️⃣ Facility Issue (non-urgent)\n" +
    "3️⃣ Incident Report\n" +
    "4️⃣ Supply Request\n" +
    "5️⃣ General Feedback\n\n" +
    "Reply with the number (1-5)"
  );
  
  return null;
}

// Handle report submission flow
async function handleReportResponse(guardPhone, message) {
  const reportState = activeReports.get(guardPhone);
  if (!reportState) return null; // Not in report process
  
  const messageLower = message.toLowerCase().trim();
  
  // Type selection
  if (reportState.step === 'type_selection') {
    const typeMap = {
      '1': 'equipment',
      '2': 'facility',
      '3': 'incident',
      '4': 'supply',
      '5': 'feedback'
    };
    
    const selectedType = typeMap[message.trim()];
    
    if (!selectedType) {
      await sendSMS(guardPhone, "Please reply with a number 1-5");
      return null;
    }
    
    reportState.type = selectedType;
    reportState.step = 'gathering';
    reportState.currentQuestion = 0;
    activeReports.set(guardPhone, reportState);
    
    // Ask first question
    const firstQuestion = REPORT_TYPES[selectedType].questions[0];
    await sendSMS(guardPhone, firstQuestion.question);
    return null;
  }
  
  // Gathering details
  if (reportState.step === 'gathering') {
    const reportType = REPORT_TYPES[reportState.type];
    const currentQuestion = reportType.questions[reportState.currentQuestion];
    
    // Store answer
    reportState.data[currentQuestion.field] = message;
    
    // Move to next question
    reportState.currentQuestion++;
    
    if (reportState.currentQuestion < reportType.questions.length) {
      // Ask next question
      activeReports.set(guardPhone, reportState);
      const nextQuestion = reportType.questions[reportState.currentQuestion];
      await sendSMS(guardPhone, nextQuestion.question);
      return null;
    } else {
      // All questions answered - ask about photo
      reportState.step = 'photo_option';
      activeReports.set(guardPhone, reportState);
      await sendSMS(guardPhone, 
        "Want to attach a photo?\n\n" +
        "Send a photo now, or reply 'Skip' to continue without one."
      );
      return null;
    }
  }
  
  // Photo option
  if (reportState.step === 'photo_option') {
    if (messageLower === 'skip' || messageLower === 'no') {
      // Generate and show report
      await generateAndShowReport(guardPhone, reportState);
      return null;
    } else {
      await sendSMS(guardPhone, "Please send a photo or reply 'Skip'");
      return null;
    }
  }
  
  // Approval step
  if (reportState.step === 'approval') {
    if (messageLower === 'yes' || messageLower === 'send' || messageLower === 'approve') {
      // Send report
      await sendReportEmail(guardPhone, reportState);
      
      // Log for analytics
      submittedReports.push({
        guardPhone,
        type: reportState.type,
        timestamp: new Date(),
        data: reportState.data,
        responseTime: Math.round((Date.now() - reportState.startTime) / 1000)
      });
      
      activeReports.delete(guardPhone);
      await sendSMS(guardPhone, 
        "✅ Report submitted successfully!\n\n" +
        "Management will receive your professional report via email. " +
        "You'll get a confirmation shortly."
      );
      return null;
    } else if (messageLower === 'edit' || messageLower === 'change') {
      reportState.step = 'editing';
      activeReports.set(guardPhone, reportState);
      await sendSMS(guardPhone, 
        "What would you like to change?\n\n" +
        "Type the field name and new value, like:\n" +
        "\"Size: XL\" or \"Urgency: ASAP\"\n\n" +
        "Or reply 'Cancel' to go back."
      );
      return null;
    } else if (messageLower === 'cancel') {
      activeReports.delete(guardPhone);
      await sendSMS(guardPhone, "Report cancelled. Text me anytime to start a new one!");
      return null;
    } else {
      await sendSMS(guardPhone, 
        "Reply:\n" +
        "• 'Yes' to send\n" +
        "• 'Edit' to make changes\n" +
        "• 'Cancel' to cancel"
      );
      return null;
    }
  }
  
  // Editing step
  if (reportState.step === 'editing') {
    if (messageLower === 'cancel') {
      // Go back to approval
      await generateAndShowReport(guardPhone, reportState);
      return null;
    }
    
    // Parse edit (simple approach: "field: value")
    const editMatch = message.match(/([^:]+):\s*(.+)/);
    if (editMatch) {
      const fieldName = editMatch[1].trim().toLowerCase();
      const newValue = editMatch[2].trim();
      
      // Find matching field
      const reportType = REPORT_TYPES[reportState.type];
      const matchingQuestion = reportType.questions.find(q => 
        q.field.toLowerCase() === fieldName || 
        q.question.toLowerCase().includes(fieldName)
      );
      
      if (matchingQuestion) {
        reportState.data[matchingQuestion.field] = newValue;
        activeReports.set(guardPhone, reportState);
        await sendSMS(guardPhone, `✅ Updated ${matchingQuestion.field}!\n\nAny other changes? Or reply 'Done' to see updated report.`);
        return null;
      }
    }
    
    if (messageLower === 'done') {
      await generateAndShowReport(guardPhone, reportState);
      return null;
    }
    
    await sendSMS(guardPhone, "Format: \"Field: New Value\" or reply 'Done' when finished editing");
    return null;
  }
  
  return false;
}

// Generate professional report using Claude AI
async function generateAndShowReport(guardPhone, reportState) {
  const reportType = REPORT_TYPES[reportState.type];
  
  // Build guard's raw data
  let rawData = '';
  Object.entries(reportState.data).forEach(([field, value]) => {
    rawData += `${field}: ${value}\n`;
  });
  
  // Use Claude to rewrite professionally
  const systemPrompt = `You are a professional report writer for security operations.
  
Given guard-submitted information (which may be informal or have typos), rewrite it as a clean, professional report.

Keep the facts accurate but make the language professional and clear.
Format as a structured report with clear sections.
Keep it concise but complete.

Return ONLY the professional report text, no preamble.`;

  const userPrompt = `Report Type: ${reportType.name}
Guard Phone: ${guardPhone}
Date/Time: ${new Date().toLocaleString()}

Raw guard input:
${rawData}

Please rewrite this as a professional ${reportType.name.toLowerCase()}.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: userPrompt
          }
        ],
        system: systemPrompt
      })
    });

    const data = await response.json();
    
    // Check if response is valid
    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('Invalid Claude API response:', JSON.stringify(data));
      throw new Error('Invalid API response format');
    }
    
    const professionalReport = data.content[0].text.trim();
    
    reportState.professionalVersion = professionalReport;
    reportState.step = 'approval';
    activeReports.set(guardPhone, reportState);
    
    // Show formatted report to guard
    const formattedReport = `
━━━━━━━━━━━━━━━━━━━━━
📋 YOUR PROFESSIONAL REPORT
━━━━━━━━━━━━━━━━━━━━━

${professionalReport}

━━━━━━━━━━━━━━━━━━━━━
ORIGINAL NOTES:
${rawData}━━━━━━━━━━━━━━━━━━━━━

Send this to management?

Reply:
• 'Yes' to send
• 'Edit' to make changes
• 'Cancel' to cancel`;

    await sendSMS(guardPhone, formattedReport);
    
  } catch (error) {
    console.error('Error generating professional report:', error);
    console.error('Report data:', JSON.stringify(reportState.data));
    
    // Fallback - create a simple professional report without AI
    const fallbackReport = createFallbackReport(reportType, reportState.data, guardPhone);
    
    reportState.professionalVersion = fallbackReport;
    reportState.step = 'approval';
    activeReports.set(guardPhone, reportState);
    
    // Show formatted report to guard
    const formattedReport = `
━━━━━━━━━━━━━━━━━━━━━
📋 YOUR PROFESSIONAL REPORT
━━━━━━━━━━━━━━━━━━━━━

${fallbackReport}

━━━━━━━━━━━━━━━━━━━━━
ORIGINAL NOTES:
${rawData}━━━━━━━━━━━━━━━━━━━━━

Send this to management?

Reply:
• 'Yes' to send
• 'Edit' to make changes
• 'Cancel' to cancel`;

    await sendSMS(guardPhone, formattedReport);
  }
}

// Fallback report creator (when AI fails)
function createFallbackReport(reportType, data, guardPhone) {
  const now = new Date();
  const guardLast4 = guardPhone.slice(-4);
  
  let report = `${reportType.name.toUpperCase()}\n\n`;
  report += `Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}\n`;
  report += `Submitted by: Guard (Phone ending in ${guardLast4})\n\n`;
  
  Object.entries(data).forEach(([field, value]) => {
    const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
    report += `${fieldName}: ${value}\n`;
  });
  
  return report;
}

// Send report email to management
async function sendReportEmail(guardPhone, reportState) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured - skipping report email');
    return;
  }
  
  const reportType = REPORT_TYPES[reportState.type];
  const guardLast4 = guardPhone.slice(-4);
  const now = new Date();
  
  const subject = `📋 Guard Report: ${reportType.name}`;
  
  let rawDataHtml = '<ul>';
  Object.entries(reportState.data).forEach(([field, value]) => {
    rawDataHtml += `<li><strong>${field}:</strong> ${value}</li>`;
  });
  rawDataHtml += '</ul>';
  
  const htmlContent = `
    <h2>📋 ${reportType.name.toUpperCase()}</h2>
    <p><strong>Submitted:</strong> ${now.toLocaleString()}</p>
    <p><strong>Guard:</strong> Phone ending in ${guardLast4}</p>
    <hr>
    
    <h3>Professional Report:</h3>
    <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #007bff;">
      ${reportState.professionalVersion.replace(/\n/g, '<br>')}
    </div>
    <hr>
    
    <h3>Original Guard Input:</h3>
    ${rawDataHtml}
    
    <hr>
    <p><em>This report was submitted via WatchTower conversational reporting system.</em></p>
    <p><em>Reply to this email to respond directly to the guard.</em></p>
  `;

  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: CONFIG.OWNER_EMAIL,
      subject: subject,
      html: htmlContent
    });
    console.log(`📧 Guard report sent: ${reportType.name}`);
  } catch (error) {
    console.error('Error sending guard report email:', error);
  }
}

// ==========================================
// SHIFT HANDOFF PROCESS
// ==========================================

// Start the shift handoff process
async function startHandoffProcess(guardPhone) {
  const handoffState = {
    step: 0,
    data: {},
    startTime: Date.now()
  };
  
  activeHandoffs.set(guardPhone, handoffState);
  
  await sendSMS(guardPhone, 
    "📋 Before you go - let's do a quick handoff checklist. " +
    "Takes 60 seconds. This helps the incoming guard and keeps everyone accountable.\n\n" +
    "Ready? Reply 'Yes' to start or 'Skip' to skip (not recommended)."
  );
  
  return null;
}

// Handle responses during handoff process
async function handleHandoffResponse(guardPhone, message, handoffState) {
  const messageLower = message.toLowerCase().trim();
  const words = messageLower.split(/\s+/); // Split into words for exact matching
  
  // Check if they want to skip (exact word match only - not substring!)
  if (words.includes('skip') || (words.includes('no') && words.length <= 2)) {
    // Only treat 'no' as skip if it's alone or "no thanks" etc.
    // This prevents "Normal", "Nothing", "Known" from triggering skip
    activeHandoffs.delete(guardPhone);
    
    // Determine shift type
    const hour = new Date().getHours();
    let shiftType = 'Day';
    if (hour >= 22 || hour < 6) shiftType = 'Midnight';
    else if (hour >= 14 && hour < 22) shiftType = 'Swing';
    else if (hour >= 6 && hour < 14) shiftType = 'Day';
    
    // Store skipped handoff in daily buffer
    dailyHandoffBuffer.handoffs.push({
      guardPhone,
      shiftType,
      timestamp: new Date(),
      completed: false,
      skipped: true,
      data: null,
      stats: null,
      issues: ['Handoff skipped by guard']
    });
    
    // 🚨 TRACK LAZY BEHAVIOR: Handoff skip
    trackLazyBehavior(guardPhone, 'handoff_skip');
    
    await sendSMS(guardPhone, "Handoff skipped. Have a good one - but please do handoffs in the future for accountability!");
    console.log(`⚠️ Handoff skipped by guard ...${guardPhone.slice(-4)} (${shiftType} shift)`);
    return null;
  }
  
  // If they haven't started yet, check for 'yes'
  if (handoffState.step === 0) {
    if (messageLower.includes('yes') || messageLower.includes('ok') || messageLower.includes('ready')) {
      handoffState.step = 1;
      activeHandoffs.set(guardPhone, handoffState);
      await sendSMS(guardPhone, HANDOFF_QUESTIONS[0].question);
      return null;
    } else {
      await sendSMS(guardPhone, "Reply 'Yes' to start the handoff or 'Skip' to skip it.");
      return null;
    }
  }
  
  // Process answer to current question
  const currentQuestion = HANDOFF_QUESTIONS[handoffState.step - 1];
  
  if (currentQuestion.validation(message)) {
    // Store the answer
    handoffState.data[currentQuestion.field] = message.toLowerCase().trim();
    
    // 💰 ROI: Log phone issues caught at handoff
    if (currentQuestion.field === 'phoneVolume' && message.toLowerCase().includes('no')) {
      logROISavings(
        'handoff_catch',
        'Phone volume issue caught at handoff - prevented missed calls',
        COST_SAVINGS.handoffPhoneIssue
      );
    }
    
    if (currentQuestion.field === 'phoneCharge' && message.toLowerCase().includes('no')) {
      logROISavings(
        'handoff_catch',
        'Phone charge issue caught at handoff - prevented dead phone',
        COST_SAVINGS.handoffPhoneIssue
      );
    }
    
    // Check for issues that need immediate attention
    if (currentQuestion.field === 'cameraStatus' && !message.toLowerCase().includes('clear') && !message.toLowerCase().includes('good')) {
      // Camera issue detected during handoff!
      
      // 💰 ROI: Log handoff catch (fixed before incoming guard arrives)
      logROISavings(
        'handoff_catch',
        'Camera issue caught at handoff before incoming guard affected',
        COST_SAVINGS.handoffEquipmentIssue
      );
      
      await sendSMS(guardPhone, "Camera issue detected. Let's fix that before you leave. One moment...");
      activeHandoffs.delete(guardPhone);
      
      // Trigger camera SOP
      const cameraSOP = detectSOP("cameras down");
      if (cameraSOP) {
        const firstStep = cameraSOP.sop.steps[0];
        const imageUrl = firstStep.image ? `${CONFIG.SERVER_URL}/images/${firstStep.image}` : null;
        
        conversationState.set(guardPhone, {
          active: true,
          currentStep: 1,
          issue: cameraSOP.issue,
          activeSOP: cameraSOP.sop,
          retries: 0,
          completedSteps: [],
          startTime: new Date(),
          lastActivity: Date.now(),
          conversationHistory: [
            { role: 'guard', content: message },
            { role: 'watchtower', content: firstStep.userFriendly }
          ]
        });
        
        await sendSMS(guardPhone, firstStep.userFriendly, imageUrl);
        console.log(`🔧 Started Camera SOP from handoff for ${guardPhone}`);
      } else {
        console.error('❌ Camera SOP not found!');
        await sendSMS(guardPhone, "Camera SOP not available. Please contact supervisor.");
      }
      
      return null;
    }
    
    if (currentQuestion.field === 'gateStatus' && !message.toLowerCase().includes('normal') && !message.toLowerCase().includes('good')) {
      // Gate issue detected during handoff!
      
      // 💰 ROI: Log handoff catch (fixed before incoming guard arrives)
      logROISavings(
        'handoff_catch',
        'Gate issue caught at handoff before incoming guard affected',
        COST_SAVINGS.handoffEquipmentIssue
      );
      
      await sendSMS(guardPhone, "Gate issue detected. Let's fix that before you leave. One moment...");
      activeHandoffs.delete(guardPhone);
      
      // Trigger gate SOP
      const gateSOP = detectSOP("gate stuck");
      if (gateSOP) {
        const firstStep = gateSOP.sop.steps[0];
        const imageUrl = firstStep.image ? `${CONFIG.SERVER_URL}/images/${firstStep.image}` : null;
        
        conversationState.set(guardPhone, {
          active: true,
          currentStep: 1,
          issue: gateSOP.issue,
          activeSOP: gateSOP.sop,
          retries: 0,
          completedSteps: [],
          startTime: new Date(),
          lastActivity: Date.now(),
          conversationHistory: [
            { role: 'guard', content: message },
            { role: 'watchtower', content: firstStep.userFriendly }
          ]
        });
        
        await sendSMS(guardPhone, firstStep.userFriendly, imageUrl);
        console.log(`🔧 Started Gate SOP from handoff for ${guardPhone}`);
      } else {
        console.error('❌ Gate SOP not found!');
        await sendSMS(guardPhone, "Gate SOP not available. Please contact supervisor.");
      }
      
      return null;
    }
    
    // Move to next question
    handoffState.step++;
    
    if (handoffState.step <= HANDOFF_QUESTIONS.length) {
      // Ask next question
      activeHandoffs.set(guardPhone, handoffState);
      await sendSMS(guardPhone, HANDOFF_QUESTIONS[handoffState.step - 1].question);
      return null;
    } else {
      // Handoff complete!
      await completeHandoff(guardPhone, handoffState.data);
      return null;
    }
  } else {
    // Invalid answer
    await sendSMS(guardPhone, `Please answer: ${currentQuestion.question}`);
    return null;
  }
}

// Complete the handoff process
async function completeHandoff(guardPhone, handoffData) {
  activeHandoffs.delete(guardPhone);
  
  // Calculate shift stats
  const shiftStats = {
    incidents: weeklyAnalytics.incidents.filter(i => i.guardPhone === guardPhone && 
      i.timestamp > new Date(Date.now() - 12 * 60 * 60 * 1000)).length,
    avgResolution: null,
    proactiveChecks: weeklyAnalytics.checkIns.filter(c => c.guardPhone === guardPhone &&
      c.timestamp > new Date(Date.now() - 12 * 60 * 60 * 1000)).length,
    duration: null
  };
  
  // Log handoff
  logHandoff(guardPhone, handoffData);
  
  // Determine shift type based on time
  const hour = new Date().getHours();
  let shiftType = 'Day';
  if (hour >= 22 || hour < 6) shiftType = 'Midnight';
  else if (hour >= 14 && hour < 22) shiftType = 'Swing';
  else if (hour >= 6 && hour < 14) shiftType = 'Day';
  
  // Store in daily buffer for 6am consolidated report
  dailyHandoffBuffer.handoffs.push({
    guardPhone,
    shiftType,
    timestamp: new Date(),
    completed: true,
    data: handoffData,
    stats: shiftStats,
    issues: detectHandoffIssues(handoffData)
  });
  
  // 🚨 TRACK LAZY BEHAVIOR: Handoff complete
  trackLazyBehavior(guardPhone, 'handoff_complete');
  
  // Send confirmation to outgoing guard
  await sendSMS(guardPhone, 
    "✅ Handoff complete! Great shift. " +
    "Incoming guard will be briefed. Stay safe!"
  );
  
  console.log(`📋 Handoff completed for guard ...${guardPhone.slice(-4)} (${shiftType} shift)`);
}

// Detect issues from handoff data
function detectHandoffIssues(handoffData) {
  const issues = [];
  
  if (handoffData.phoneVolume && handoffData.phoneVolume.toLowerCase() !== 'yes') {
    issues.push('Phone volume not all the way up');
  }
  
  if (handoffData.phoneCharge && !handoffData.phoneCharge.includes('50')) {
    issues.push(`Phone charge low: ${handoffData.phoneCharge}`);
  }
  
  if (handoffData.cameraStatus && !handoffData.cameraStatus.toLowerCase().includes('clear')) {
    issues.push(`Camera issue: ${handoffData.cameraStatus}`);
  }
  
  if (handoffData.gateStatus && !handoffData.gateStatus.toLowerCase().includes('normal')) {
    issues.push(`Gate issue: ${handoffData.gateStatus}`);
  }
  
  if (handoffData.notes && handoffData.notes.toLowerCase() !== 'none' && handoffData.notes.toLowerCase() !== 'nothing') {
    issues.push(`Note: ${handoffData.notes}`);
  }
  
  return issues;
}

// Send briefing to incoming guard (call this when new guard first texts in)
async function sendIncomingGuardBriefing(guardPhone) {
  // Find most recent handoff that hasn't been claimed
  const recentHandoff = Array.from(lastHandoff.values())
    .filter(h => !h.incomingGuard)
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  
  if (!recentHandoff) return; // No recent handoff
  
  // Check if handoff is recent (within 2 hours)
  const timeSinceHandoff = Date.now() - recentHandoff.timestamp.getTime();
  if (timeSinceHandoff > 2 * 60 * 60 * 1000) return; // Too old
  
  // Mark this handoff as claimed
  recentHandoff.incomingGuard = guardPhone;
  
  const outgoingLast4 = recentHandoff.outgoingGuard.slice(-4);
  
  const briefing = `📋 SHIFT HANDOFF from Guard ...${outgoingLast4}\n\n` +
    `📱 Duty Phone: ${recentHandoff.phoneLocation}, volume ${recentHandoff.phoneVolume}, ${recentHandoff.phoneCharge} charge\n` +
    `📹 Cameras: ${recentHandoff.cameraStatus.toUpperCase()}\n` +
    `🚪 Gate: ${recentHandoff.gateStatus.toUpperCase()}\n` +
    `📝 Notes: ${recentHandoff.notes}\n\n` +
    `Any questions? Text me anytime.`;
  
  await sendSMS(guardPhone, briefing);
  console.log(`📋 Incoming guard briefing sent to ...${guardPhone.slice(-4)}`);
}

// ==========================================
// MAIN CONVERSATION HANDLER (CAUTIOUS + SKIP)
// ==========================================

// ==========================================
// AI-POWERED NATURAL LANGUAGE UNDERSTANDING
// ==========================================

// Master AI router - detects what the guard is trying to do
async function detectGuardIntent(message) {
  const prompt = `You are analyzing a security guard's text message to determine their intent.

Guard message: "${message}"

Classify into ONE of these categories:

SIGN_OFF - Guard is ending their shift, signing off, or leaving work NOW
Examples: "signing off", "shift over", "im done", "heading out", "bye", "singning off" (typo), "my shift just ended"

EQUIPMENT_ISSUE - Equipment is broken, malfunctioning, or down NOW
Examples: "cameras down", "camerass broken" (typo), "gate stuck", "gate wont open", "cameras not working"

REPORT - Non-urgent report about supplies, facilities, or incidents (not equipment failure)
Examples: "need new uniform", "water is out", "light broken", "found broken window", "out of pens"

NEED_SUPERVISOR - Requesting human help, supervisor contact, or urgent coordination
Examples: "need supervisor", "my relief is late", "need help", "can someone come here"

QUESTION - Asking a question about how to do something
Examples: "how do I sign out?", "what should I do about...", "is there a procedure for..."

ACTIVE_CONVERSATION - Responding to an ongoing conversation (answers like "yes", "no", "done", etc.)
Examples: "yes", "no", "done", "fixed", "all clear", "normal", "ok"

OTHER - None of the above

Reply with ONLY the category name (e.g., "SIGN_OFF").`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 20,
      messages: [{ role: "user", content: prompt }]
    });
    
    const intent = response.content[0].text.trim().toUpperCase();
    console.log(`🤖 AI detected intent: ${intent} for message: "${message}"`);
    return intent;
  } catch (error) {
    console.error('❌ AI intent detection error:', error);
    return 'OTHER'; // Fallback to pattern matching
  }
}

// Detect specific equipment type for equipment issues
async function detectEquipmentIssueAI(message) {
  const prompt = `What equipment is broken or malfunctioning?

Message: "${message}"

Reply with ONE of:
CAMERA - Camera/surveillance equipment
GATE - Gate/entrance/access control
GENERAL - Unclear, multiple things, or other equipment

Examples:
"camerass are dwon" → CAMERA
"cameras not working" → CAMERA
"gate stuck" → GATE
"entrance wont open" → GATE
"everything broken" → GENERAL
"security system down" → GENERAL

Reply with ONLY the equipment type.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 20,
      messages: [{ role: "user", content: prompt }]
    });
    
    const equipment = response.content[0].text.trim().toUpperCase();
    console.log(`🤖 AI detected equipment: ${equipment}`);
    
    // Return appropriate SOP
    if (equipment === 'CAMERA') return detectSOP("cameras down");
    if (equipment === 'GATE') return detectSOP("gate stuck");
    return detectSOP("general assistance");
  } catch (error) {
    console.error('❌ AI equipment detection error:', error);
    return null; // Fallback to pattern matching
  }
}

// ==========================================
// MAIN CONVERSATION HANDLER
// ==========================================

async function handleConversation(guardPhone, message) {
  // 🔔 UPDATE LAST CONTACT: Track when guard last messaged
  guardLastContact.set(guardPhone, Date.now());
  
  // 🔔 RESCHEDULE NEXT CHECK: Set new random interval from now
  const nextInterval = getRandomCheckInterval();
  guardNextCheck.set(guardPhone, Date.now() + nextInterval);
  
  // 🔔 CHECK IF RESPONDING TO PROACTIVE SITE CHECK
  const handledByProactive = await handleProactiveCheckResponse(guardPhone, message);
  if (handledByProactive) {
    return null; // Already handled via SMS, don't send Twilio response
  }
  
  // 👁️ CHECK IF RESPONDING TO SPOT CHECK
  const isSpotCheckResponse = handleSpotCheckResponse(guardPhone, message);
  if (isSpotCheckResponse) {
    await sendSMS(guardPhone, "✅ Confirmed. Thanks!");
    return null; // Handled
  }
  
  // 📋 CHECK IF IN HANDOFF PROCESS
  const handoffState = activeHandoffs.get(guardPhone);
  if (handoffState) {
    await handleHandoffResponse(guardPhone, message, handoffState);
    return null; // Handled via SMS
  }
  
  // 📋 CHECK IF IN REPORT SUBMISSION PROCESS
  const reportState = activeReports.get(guardPhone);
  if (reportState) {
    await handleReportResponse(guardPhone, message);
    return null; // Handled via SMS
  }
  
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

  // 🚨 TRACK LAZY BEHAVIOR: Response word count
  const wordCount = message.trim().split(/\s+/).length;
  if (state.active && state.activeSOP) {
    // Only track during active SOPs
    if (wordCount === 1) {
      trackLazyBehavior(guardPhone, 'one_word');
    } else {
      trackLazyBehavior(guardPhone, 'response');
    }
  }

  // Add to conversation history
  state.conversationHistory = state.conversationHistory || [];
  state.conversationHistory.push({ role: 'guard', content: message });

  // 🤖 AI-POWERED INTENT DETECTION (for NEW conversations only)
  if (!state.active) {
    console.log(`🤖 Using AI to detect intent for: "${message}"`);
    const intent = await detectGuardIntent(message);
    
    // Route based on AI-detected intent
    switch(intent) {
      case 'SIGN_OFF':
        console.log(`✅ AI detected: SIGN_OFF`);
        return await startHandoffProcess(guardPhone);
        
      case 'EQUIPMENT_ISSUE':
        console.log(`✅ AI detected: EQUIPMENT_ISSUE`);
        const detected = await detectEquipmentIssueAI(message);
        
        if (detected) {
          // Check for handoff discrepancy
          const issueType = detected.issue.toLowerCase().includes('camera') ? 'camera' :
                            detected.issue.toLowerCase().includes('gate') ? 'gate' : null;
          if (issueType) {
            detectHandoffDiscrepancy(guardPhone, issueType, detected.issue);
          }
          
          // ⏰ LOG TIME-BASED PATTERN
          logIssuePattern(detected.issue, issueType ? `${issueType} equipment` : 'unknown equipment', {
            guardPhone: guardPhone.slice(-4),
            detectionMethod: 'AI',
            originalMessage: message
          });
          
          state = {
            active: true,
            currentStep: 1,
            issue: detected.issue,
            activeSOP: detected.sop,
            retries: 0,
            completedSteps: [],
            startTime: new Date(),
            lastActivity: Date.now(),
            conversationHistory: [{ role: 'guard', content: message }]
          };
          conversationState.set(guardPhone, state);
          abandonmentAlertsSent.delete(guardPhone);
          
          const firstStep = detected.sop.steps[0];
          const imageUrl = firstStep.image ? `${CONFIG.SERVER_URL}/images/${firstStep.image}` : null;
          
          state.conversationHistory.push({ role: 'watchtower', content: firstStep.userFriendly });
          await sendSMS(guardPhone, firstStep.userFriendly, imageUrl);
          return null;
        }
        // If AI detection failed, fall through to pattern matching
        break;
        
      case 'REPORT':
        console.log(`✅ AI detected: REPORT`);
        return await startReportProcess(guardPhone, message);
        
      case 'NEED_SUPERVISOR':
        console.log(`✅ AI detected: NEED_SUPERVISOR`);
        await tellGuardToCall(guardPhone, message);
        return null;
        
      case 'QUESTION':
        console.log(`✅ AI detected: QUESTION - using handbook`);
        // Use AI handbook knowledge to answer question
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
          
          console.log(`✅ Handbook AI answered question`);
          return response.content[0].text;
        } catch (error) {
          console.error('Claude API error:', error);
          return "I'm having trouble right now. Text your supervisor.";
        }
        
      case 'ACTIVE_CONVERSATION':
        console.log(`⚠️ AI detected: ACTIVE_CONVERSATION but no active state - treating as OTHER`);
        // Fall through to pattern matching
        break;
        
      case 'OTHER':
      default:
        console.log(`⚠️ AI returned: ${intent} - falling back to pattern matching`);
        // Fall through to existing pattern matching as backup
        break;
    }
    
    // 🔄 FALLBACK: Pattern matching (if AI didn't handle it or returned OTHER)
    console.log(`🔄 Trying pattern matching as fallback...`);
    
    // Check pattern-based triggers
    if (isReportTrigger(message)) {
      console.log(`✅ Pattern matching detected: REPORT`);
      return await startReportProcess(guardPhone, message);
    }
    
    if (isSignOffMessage(message)) {
      console.log(`✅ Pattern matching detected: SIGN_OFF`);
      return await startHandoffProcess(guardPhone);
    }
    
    if (isEscalationRequest(message)) {
      console.log(`✅ Pattern matching detected: ESCALATION`);
      await tellGuardToCall(guardPhone, message);
      return null;
    }
    
    // Try SOP detection
    const detectedSOP = detectSOP(message);
    
    if (detectedSOP) {
      console.log(`✅ Pattern matching detected SOP: ${detectedSOP.issue}`);
      // Check for handoff discrepancy (incoming guard reports issue that outgoing said was fine)
      const issueType = detectedSOP.issue.toLowerCase().includes('camera') ? 'camera' :
                        detectedSOP.issue.toLowerCase().includes('gate') ? 'gate' : null;
      if (issueType) {
        detectHandoffDiscrepancy(guardPhone, issueType, detectedSOP.issue);
      }
      
      // ⏰ LOG TIME-BASED PATTERN
      logIssuePattern(detectedSOP.issue, issueType ? `${issueType} equipment` : 'unknown equipment', {
        guardPhone: guardPhone.slice(-4),
        detectionMethod: 'Pattern matching',
        originalMessage: message
      });
      
      state = {
        active: true,
        currentStep: 1,
        issue: detectedSOP.issue,
        activeSOP: detectedSOP.sop,
        retries: 0,
        completedSteps: [],
        startTime: new Date(),
        lastActivity: Date.now(), // Track last activity for abandonment detection
        conversationHistory: [{ role: 'guard', content: message }]
      };
      conversationState.set(guardPhone, state);
      abandonmentAlertsSent.delete(guardPhone); // Clear any previous alert flag
      
      const firstStep = detectedSOP.sop.steps[0];
      const imageUrl = firstStep.image ? `${CONFIG.SERVER_URL}/images/${firstStep.image}` : null;
      
      state.conversationHistory.push({ role: 'watchtower', content: firstStep.userFriendly });
      await sendSMS(guardPhone, firstStep.userFriendly, imageUrl);
      return null;
    } else {
      // 📋 Send incoming guard briefing if this is their first message and there's a recent handoff
      await sendIncomingGuardBriefing(guardPhone);
      
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
    // ⚡ RESPONSE SPEED: Track time since last activity
    if (state.lastActivity) {
      const responseTimeSeconds = Math.round((Date.now() - state.lastActivity) / 1000);
      logResponseSpeed(guardPhone, 'sop_step', responseTimeSeconds, {
        issue: state.issue,
        currentStep: state.currentStep,
        totalSteps: state.activeSOP.steps.length
      });
      
      // 🚨 LAZY DETECTION: Check if rushed through step (< 30 seconds)
      if (responseTimeSeconds < 30) {
        trackLazyBehavior(guardPhone, 'sop_rush', { seconds: responseTimeSeconds });
      } else {
        trackLazyBehavior(guardPhone, 'sop_step');
      }
    }
    
    // Update last activity timestamp (for abandonment detection)
    state.lastActivity = Date.now();
    conversationState.set(guardPhone, state);
    
    // Check for escalation request during active conversation
    if (isEscalationRequest(message)) {
      console.log(`✅ Escalation requested during active SOP`);
      await tellGuardToCall(guardPhone, message);
      conversationState.delete(guardPhone);
      abandonmentAlertsSent.delete(guardPhone);
      return null;
    }
    
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
       
       // Calculate resolution time
       const resolutionTime = state.startTime ? Math.round((Date.now() - state.startTime) / 1000) : 0;
       
       // Log incident for weekly analytics
       logIncident(guardPhone, state.issue, true, state.completedSteps, resolutionTime, false, false);
       
       // 💰 ROI: Log prevented escalation (guard fixed it vs emergency service call)
       logROISavings(
         'prevented_escalation',
         `${state.issue} resolved by guard in ${Math.round(resolutionTime / 60)} min`,
         COST_SAVINGS.emergencyServiceCall
       );
       
       await sendEmailReport(guardPhone, state.issue, true, state.completedSteps, state.conversationHistory || []);
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
      await sendEmailReport(guardPhone, state.issue, true, state.completedSteps, state.conversationHistory || []);
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
  
  // Improved logging - show full incoming message
  const fromDisplay = guardPhone.slice(-4);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📱 RECEIVED from ...${fromDisplay} (${message.length} chars):`);
  console.log(message);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  try {
    const response = await handleConversation(guardPhone, message);
    
    if (response) {
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(response);
      res.type('text/xml').send(twiml.toString());
      // Note: Actual SMS sending is logged by sendSMS function
    } else {
      res.sendStatus(200);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    
    // Only send error response if headers haven't been sent
    if (!res.headersSent) {
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message("Sorry, I'm having technical difficulties. Text your supervisor.");
      res.type('text/xml').send(twiml.toString());
    }
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
