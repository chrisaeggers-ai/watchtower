
// ==========================================
// FRUITVALE CAMERA/NVR TROUBLESHOOTING
// ==========================================
const FRUITVALE_NVR_SOP = {
  title: "Fruitvale NVR/DW Camera System Troubleshooting",
  site: "Fruitvale",
  steps: [
    {
      stepNumber: 1,
      instruction: "Go to the IT room door next to the fire alarm panel.",
      userFriendly: "Head to the IT room - it's the door right next to the fire alarm panel. Text 'done' when you're there.",
      waitForConfirmation: true,
      image: "step1.jpg"
    },
    {
      stepNumber: 2,
      instruction: "Enter code 1078 on the padlock to unlock the door.",
      userFriendly: "Enter 1078 on the padlock. Text 'done' when you're in.",
      waitForConfirmation: true,
      image: "step2.jpg"
    },
    {
      stepNumber: 3,
      instruction: "Disconnect HDMI cable (1) from NVR and connect HDMI cable (2) to bring up NVR display on small monitor in IT room.",
      userFriendly: "Find the 2 HDMI cables. Disconnect cable 1, plug in cable 2. This shows the display on the small monitor. Done?",
      waitForConfirmation: true,
      image: "step3.jpg"
    },
    {
      stepNumber: 4,
      instruction: "Connect the mouse and keyboard cables to the USB ports on the NVR.",
      userFriendly: "Plug the mouse and keyboard into the USB ports on the NVR. Ready?",
      waitForConfirmation: true,
      image: "step4.jpg"
    },
    {
      stepNumber: 5,
      instruction: "Click on 'DW' on the left side of the screen.",
      userFriendly: "Click 'DW' on the left side of the screen. Let me know when you've done that.",
      waitForConfirmation: true,
      image: "step5.jpg"
    },
    {
      stepNumber: 6,
      instruction: "Click on 'OiFunds Fruitvale' to connect to the server.",
      userFriendly: "Click 'OiFunds Fruitvale' to connect. Text me once it connects.",
      waitForConfirmation: false
    },
    {
      stepNumber: 7,
      instruction: "If server doesn't accept 'OiFunds', use manual connection: Click 'Connect to Server', enter User: admin, Password: admin12345, click OK.",
      userFriendly: "If it doesn't connect:\n\n1. Click 'Connect to Server'\n2. Username: admin\n3. Password: admin12345\n4. Click OK\n\nConnected?",
      waitForConfirmation: true,
      image: "step7.jpg"
    },
    {
      stepNumber: 8,
      instruction: "If cameras don't automatically show up, click dropdown arrow next to 'New Layout 1' and select 'Guard View'.",
      userFriendly: "If cameras aren't showing, click the dropdown next to 'New Layout 1' and select 'Guard View'. See them now?",
      waitForConfirmation: true,
      image: "step8.jpg"
    },
    {
      stepNumber: 9,
      instruction: "Alternative: Click side arrow on left to open camera panel, scroll to 'Guard View' and double-click it.",
      userFriendly: "Still nothing? Click the side arrow on the left, scroll to 'Guard View' and double-click it. Cameras up?",
      waitForConfirmation: false
    },
    {
      stepNumber: 10,
      instruction: "IMPORTANT: Disconnect HDMI cable and mouse/keyboard, then reconnect the original HDMI cable to make cameras show on guard shack TV.",
      userFriendly: "Last step: Unplug the HDMI and mouse/keyboard. Reconnect the original HDMI cable so cameras show back up on the TV. IMPORTANT - don't skip this! Done?",
      waitForConfirmation: true,
      image: "step10.jpg"
    }
  ],
  
  triggerPhrases: [
    // BASIC VARIATIONS
    "cameras down",
    "cameras are down",
    "camera down",
    "camera is down",
    "cameras r down",
    "camera r down",
    "cameras are out",
    "camera is out",
    "cameras out",
    "cameras not working",
    "camera not working",
    "cameras aren't working",
    "camera isn't working",
    "cameras aint working",
    "camera aint working",
    "cameras off",
    "camera off",
    "cameras are off",
    "camera is off",
    "cameras offline",
    
    // SCREEN/MONITOR REFERENCES
    "screen is down",
    "screen down",
    "screens down",
    "monitor is down",
    "monitor down",
    "monitors down",
    "screen is black",
    "screen black",
    "screens are black",
    "monitor is black",
    "monitor black",
    "screen is off",
    "screen off",
    "screen won't turn on",
    "monitor won't turn on",
    "screen isn't working",
    "monitor isn't working",
    "display is down",
    "display down",
    "display is off",
    "display off",
    "screen is blank",
    "monitor is blank",
    "blank screen",
    "no display",
    
    // CAN'T SEE VARIATIONS
    "can't see cameras",
    "cant see cameras",
    "can't see the cameras",
    "cant see the cameras",
    "can't see camera",
    "cant see camera",
    "cannot see cameras",
    "can't view cameras",
    "cant view cameras",
    "can't see anything",
    "cant see anything on cameras",
    "can't see feeds",
    "cant see feeds",
    "can't see camera feeds",
    "can't see the feed",
    "no camera view",
    "can't pull up cameras",
    "cant pull up cameras",
    "can't access cameras",
    "cant access cameras",
    
    // VIDEO/FEED REFERENCES
    "no video",
    "no video feed",
    "video is down",
    "video down",
    "video is out",
    "video out",
    "video feed is down",
    "video feed down",
    "lost video",
    "lost camera feed",
    "camera feed is gone",
    "camera feed gone",
    "feed is down",
    "feed down",
    "feeds are down",
    "no camera feed",
    "no camera feeds",
    "no feed",
    "no feeds",
    "camera feed is out",
    
    // SYSTEM REFERENCES
    "camera system down",
    "camera system is down",
    "camera system not working",
    "camera system isn't working",
    "camera system is out",
    "nvr down",
    "nvr is down",
    "nvr not working",
    "nvr isn't working",
    "nvr is out",
    "nvr off",
    "nvr is off",
    "dw down",
    "dw is down",
    "dw not working",
    "spectrum down",
    "spectrum is down",
    "spectrum not working",
    "dw spectrum down",
    "dw spectrum not working",
    "surveillance system down",
    "security cameras down",
    "security camera system down",
    "cctv down",
    "cctv is down",
    
    // WITH SITE NAME
    "cameras down at fruitvale",
    "fruitvale cameras down",
    "cameras are down at fruitvale",
    "cameras at fruitvale are down",
    "fruitvale camera system down",
    "fruitvale nvr down",
    "fruitvale cameras not working",
    "cameras down at site",
    "site cameras down",
    "cameras down here",
    "cameras here are down",
    "our cameras are down",
    "the cameras are down",
    "all cameras down",
    "all cameras are down",
    
    // QUESTIONS
    "cameras down?",
    "are cameras down",
    "are the cameras down",
    "is the camera down",
    "cameras working?",
    "are cameras working",
    "why are cameras down",
    "why aren't cameras working",
    "what's wrong with cameras",
    "whats wrong with cameras",
    "camera issue",
    "cameras not up",
    "cameras still down",
    "cameras back up?",
    "did cameras go down",
    
    // URGENT/CASUAL VARIATIONS
    "yo cameras down",
    "hey cameras down",
    "cameras r out",
    "cams down",
    "cams are down",
    "cam down",
    "cam is down",
    "cameras dead",
    "camera is dead",
    "help cameras down"
  ]
};

// ==========================================
// FIRE PANEL RESET
// ==========================================
const FRUITVALE_FIRE_PANEL_SOP = {
  title: "Fruitvale Fire Panel Reset",
  site: "Fruitvale",
  steps: [
    {
      stepNumber: 1,
      instruction: "Press the system reset button once, then press and hold the same button until the text on the screen changes to 'SYSTEM RESET IN PROGRESS'",
      userFriendly: "Okay, let's reset this. Press the system reset button once, then hold it down until the screen says 'SYSTEM RESET IN PROGRESS'. Text me when you see that.",
      waitForConfirmation: true,
      image: "fire-panel-step1.jpg"
    },
    {
      stepNumber: 2,
      instruction: "Wait until the screen says 'SYSTEM RESET COMPLETE'",
      userFriendly: "Good. Now wait for the screen to say 'SYSTEM RESET COMPLETE'. This takes about a minute. Text 'done' when you see it.",
      waitForConfirmation: true,
      image: "fire-panel-step2.jpg"
    },
    {
      stepNumber: 3,
      instruction: "Press the 'Enter' button then press the 'C/Exit' button in order. The screen should say 'SYSTEM IS NORMAL'.",
      userFriendly: "Almost done. Press these buttons IN ORDER:\n\n1. Enter\n2. C/Exit\n\nScreen should say 'SYSTEM IS NORMAL'. All good?",
      waitForConfirmation: true,
      image: "fire-panel-step3.jpg"
    }
  ],
  
  triggerPhrases: [
    // Basic variations
    "fire alarm",
    "fire alarm won't stop",
    "fire alarm wont stop",
    "fire alarm is beeping",
    "fire alarm beeping",
    "fire panel beeping",
    "fire panel is beeping",
    "alarm won't stop",
    "alarm wont stop",
    "alarm is beeping",
    "alarm beeping",
    "fire panel won't stop",
    "fire panel wont stop",
    "beeping won't quit",
    "beeping wont quit",
    "alarm panel is beeping",
    "alarm panel beeping",
    
    // Going off variations
    "fire alarm going off",
    "fire alarm is going off",
    "fire panel is going off",
    "fire panel going off",
    "alarm going off",
    "alarm is going off",
    
    // Reset variations
    "reset fire alarm",
    "reset the fire alarm",
    "how do i reset fire alarm",
    "how to reset fire alarm",
    "fire alarm reset",
    "fire panel reset",
    "reset fire panel",
    "need to reset fire alarm",
    
    // Stuck variations
    "fire panel stuck",
    "fire panel is stuck",
    "fire alarm stuck",
    "fire alarm is stuck",
    "alarm stuck",
    "alarm is stuck",
    
    // Other variations
    "alarm panel",
    "fire system alarm",
    "fire alarm panel",
    "alarm panel showing error",
    "fire alarm error",
    "fire panel error",
    
    // Urgent/casual
    "fire alarm wont shut off",
    "fire alarm won't shut off",
    "cant stop fire alarm",
    "can't stop fire alarm",
    "fire alarm keeps going",
    "alarm keeps beeping",
    "help fire alarm",
    "yo fire alarm going off"
  ]
};

// ==========================================
// ELECTRIC FENCE CONTROL
// ==========================================
const FRUITVALE_ELECTRIC_FENCE_SOP = {
  title: "Fruitvale Electric Fence Activation/Deactivation",
  site: "Fruitvale",
  steps: [
    {
      stepNumber: 1,
      instruction: "To ACTIVATE: Close all gates, unlock panel (code 510), enter 0297, press AWAY (button 2)",
      userFriendly: "To turn ON the fence:\n\n1. Close all gates first\n2. Unlock panel: 510\n3. Enter: 0297\n4. Press AWAY (button 2)\n\nDone?",
      waitForConfirmation: true
    },
    {
      stepNumber: 2,
      instruction: "To DEACTIVATE: Unlock panel (code 510), enter 0297, press OFF (button 1). Screen should say 'DISARMED READY TO ARM'",
      userFriendly: "To turn OFF the fence:\n\n1. Unlock panel: 510\n2. Enter: 0297\n3. Press OFF (button 1)\n\nScreen should say 'DISARMED READY TO ARM'. All set?",
      waitForConfirmation: true
    }
  ],
  
  triggerPhrases: [
    // Basic
    "electric fence",
    "turn on fence",
    "turn off fence",
    "turn on the fence",
    "turn off the fence",
    "turn fence on",
    "turn fence off",
    
    // Activate/deactivate
    "activate fence",
    "deactivate fence",
    "activate the fence",
    "deactivate the fence",
    "activate electric fence",
    "deactivate electric fence",
    
    // How to
    "how do i turn on fence",
    "how do i turn off fence",
    "how to turn on fence",
    "how to turn off fence",
    "how do i activate fence",
    "how do i deactivate fence",
    
    // Alarm
    "fence alarm",
    "fence is beeping",
    "fence beeping",
    "fence is alarming",
    "electric fence alarm",
    
    // Code
    "fence code",
    "what's the fence code",
    "whats the fence code",
    "electric fence code",
    "code for fence",
    
    // Panel
    "fence panel",
    "electric fence panel",
    "fence control panel",
    
    // Perimeter
    "perimeter fence",
    "perimeter fence on",
    "perimeter fence off",
    
    // Not working
    "fence not working",
    "fence isn't working",
    "fence isnt working",
    "fence won't turn on",
    "fence wont turn on",
    "fence won't turn off",
    "fence wont turn off",
    
    // Arm/disarm
    "how to arm fence",
    "how to disarm fence",
    "arm the fence",
    "disarm the fence",
    "arm fence",
    "disarm fence",
    
    // On/off
    "fence on",
    "fence off",
    "is fence on",
    "is fence off",
    
    // Help
    "help with fence",
    "need help with fence"
  ]
};

// ==========================================
// ACCESS CONTROL REFERENCE
// ==========================================
const FRUITVALE_ACCESS_CONTROL_INFO = {
  title: "Fruitvale Access Control Quick Reference",
  site: "Fruitvale",
  steps: [
    {
      stepNumber: 1,
      instruction: "THREE ways to enter: (1) Manzanita badge scanned with Jibble app, (2) Valid ID + verify with tenant, (3) Tenant escort from gate",
      userFriendly: "There are 3 ways to let someone in:\n\n1. Manzanita badge (scan with Jibble)\n2. Valid ID + call tenant to verify\n3. Tenant comes to gate and escorts them\n\nWhich situation do you have?",
      waitForConfirmation: true
    },
    {
      stepNumber: 2,
      instruction: "FOR VISITORS WITH ID: Take ID, give visitor pass, log in visitor log (badge #, name, who visiting), CALL tenant to verify, then allow entry",
      userFriendly: "If they give you ID:\n\n1. Take their ID\n2. Give visitor pass\n3. Log it (badge #, name, tenant)\n4. CALL tenant to verify (required)\n5. Let them in\n\nGot it?",
      waitForConfirmation: true
    },
    {
      stepNumber: 3,
      instruction: "FOR VISITORS WITHOUT ID: They stay outside gate, they call their escort. If no escort number, you can help call from contact list. Escort must come get them.",
      userFriendly: "If they WON'T give ID:\n\n1. They stay OUTSIDE\n2. They call their escort\n3. You can help call if needed\n4. Escort comes to gate to get them\n\nNo ID = No entry without escort!",
      waitForConfirmation: true
    },
    {
      stepNumber: 4,
      instruction: "CONTRACTORS: Must have work order with correct address and Marie as contact. Call Marie to verify if unsure. Deny access if no work order.",
      userFriendly: "For CONTRACTORS:\n\n1. Ask for work order\n2. Check: correct address + Marie listed\n3. Call Marie to verify if unsure\n4. NO work order = NO entry\n\nMake sense?",
      waitForConfirmation: false
    }
  ],
  
  triggerPhrases: [
    // Visitor won't show ID
    "visitor won't show id",
    "visitor wont show id",
    "visitor doesn't have id",
    "visitor doesnt have id",
    "visitor won't give me id",
    "visitor wont give me id",
    "visitor refuses to show id",
    "visitor refuses id",
    "visitor refusing id",
    
    // No ID variations
    "no id",
    "they won't show id",
    "they wont show id",
    "won't show id",
    "wont show id",
    "refuses to show id",
    "refusing to show id",
    "no identification",
    
    // Check in questions
    "how do i check in visitor",
    "how to check in visitor",
    "how do i check in a visitor",
    "check in visitor",
    "checking in visitor",
    "visitor check in",
    "visitor procedure",
    "visitor protocol",
    "visitor policy",
    
    // Access control general
    "access control",
    "access control policy",
    "access control procedure",
    "access procedure",
    "access policy",
    
    // Someone at gate
    "someone at gate",
    "someone at the gate",
    "person at gate",
    "person at the gate",
    "visitor at gate",
    "visitor at the gate",
    "people at gate",
    
    // Contractor variations
    "contractor at gate",
    "contractor here",
    "contractor wants in",
    "contractor at the gate",
    "contractors at gate",
    
    // Delivery variations
    "delivery at gate",
    "delivery here",
    "delivery person at gate",
    "delivery at the gate",
    
    // Let someone in
    "how do i let someone in",
    "how to let someone in",
    "can i let them in",
    "should i let them in",
    "do i let them in",
    "let visitor in",
    "letting someone in",
    
    // Gate access
    "gate access",
    "gate access policy",
    "gate access procedure",
    
    // Who can come in
    "who can come in",
    "who can enter",
    "who is allowed in",
    "who can i let in",
    
    // Visitor rules
    "visitor rules",
    "visitor requirements",
    
    // Access rules
    "access rules",
    "entry rules",
    "entry policy",
    "entry procedure",
    
    // Questions
    "visitor has no id",
    "what if no id",
    "visitor without id"
  ]
};

// ==========================================
// GATE ISSUES
// ==========================================
const FRUITVALE_GATE_ISSUES = {
  title: "Fruitvale Gate Issues",
  site: "Fruitvale",
  steps: [
    {
      stepNumber: 1,
      instruction: "Check if gate is stuck or if motor/chain is broken",
      userFriendly: "Okay, let's figure out what's wrong. Is the gate:\n\nA) Stuck but motor running?\nB) Motor not running at all?\nC) Chain broken/fallen off?\n\nText A, B, or C",
      waitForConfirmation: true
    },
    {
      stepNumber: 2,
      instruction: "If gate is stuck: Switch to manual operation using motor control box. If motor broken: Call Victor Maintenance immediately. If chain broken: Call Victor Maintenance immediately.",
      userFriendly: "Here's what to do:\n\nIf STUCK: Switch gate to manual mode using the motor control box.\n\nIf MOTOR/CHAIN BROKEN: Call Victor Maintenance right now.\n\nGate currently blocking traffic?",
      waitForConfirmation: true
    },
    {
      stepNumber: 3,
      instruction: "If site is vulnerable, manually secure access and escalate immediately",
      userFriendly: "If yes - secure the entrance manually. Stay at the gate until relief arrives. I'm escalating this now.\n\nIf no - log the maintenance issue and continue monitoring.",
      waitForConfirmation: false
    }
  ],
  
  triggerPhrases: [
    // Basic not working
    "gate isn't working",
    "gate isnt working",
    "gate is not working",
    "gate not working",
    "gates not working",
    "gates aren't working",
    "gates arent working",
    
    // Won't open/close
    "gate won't open",
    "gate wont open",
    "gate won't close",
    "gate wont close",
    "can't open gate",
    "cant open gate",
    "can't close gate",
    "cant close gate",
    
    // Stuck variations
    "gate is stuck",
    "gate stuck",
    "gates stuck",
    "gates are stuck",
    "gate is jammed",
    "gate jammed",
    
    // Broken variations
    "gate is broken",
    "gate broken",
    "gates broken",
    "gates are broken",
    
    // Problem/issue
    "gate problem",
    "gate issue",
    "problem with gate",
    "issue with gate",
    "gate malfunction",
    
    // Won't move
    "gate won't move",
    "gate wont move",
    "gates won't move",
    
    // Components
    "gate motor",
    "gate motor not working",
    "gate motor broken",
    "gate chain",
    "gate chain broken",
    "gate chain off",
    
    // With "the"
    "the gate isn't working",
    "the gate is stuck",
    "the gate won't open",
    "the gate is broken",
    "the gates aren't working",
    
    // Questions
    "gate down?",
    "is gate working",
    "is the gate working",
    "what's wrong with gate",
    "whats wrong with gate",
    
    // Urgent
    "help gate stuck",
    "gate emergency"
  ]
};

// ==========================================
// GENERAL HELP / CONFUSED
// ==========================================
const FRUITVALE_GENERAL_HELP = {
  title: "General Assistance",
  site: "Fruitvale",
  steps: [
    {
      stepNumber: 1,
      instruction: "Gather situation details from guard",
      userFriendly: "No problem. Tell me what's going on in one sentence. What do you need help with?",
      waitForConfirmation: true
    },
    {
      stepNumber: 2,
      instruction: "Escalate to supervisor with context",
      userFriendly: "Got it. I'm connecting you with your supervisor now. They'll reach out in a few minutes.",
      waitForConfirmation: false
    }
  ],
  
  triggerPhrases: [
    // Don't know what to do
    "i don't know what to do",
    "i dont know what to do",
    "don't know what to do",
    "dont know what to do",
    "not sure what to do",
    "im not sure what to do",
    "i'm not sure what to do",
    "no idea what to do",
    
    // Confused
    "i'm confused",
    "im confused",
    "confused",
    "very confused",
    "really confused",
    "totally confused",
    
    // Lost
    "i'm lost",
    "im lost",
    "lost",
    "feel lost",
    
    // Need help general
    "need help",
    "i need help",
    "help me",
    "can you help me",
    "can someone help",
    "need some help",
    "need assistance",
    
    // What do I do
    "what do i do",
    "what should i do",
    "what am i supposed to do",
    "what do i do now",
    "what should i do now",
    
    // Unsure
    "unsure",
    "i'm unsure",
    "im unsure",
    "not sure",
    "im not sure",
    "i'm not sure",
    
    // Stuck
    "stuck",
    "i'm stuck",
    "im stuck",
    "really stuck",
    
    // Help general
    "help",
    "help!",
    "help please",
    "i need help please",
    "can i get help",
    
    // Questions
    "what now",
    "what next",
    "now what",
    "what's next",
    "whats next"
  ]
};

module.exports = { 
  FRUITVALE_NVR_SOP,
  FRUITVALE_FIRE_PANEL_SOP,
  FRUITVALE_ELECTRIC_FENCE_SOP,
  FRUITVALE_ACCESS_CONTROL_INFO,
  FRUITVALE_GATE_ISSUES,
  FRUITVALE_GENERAL_HELP
};
