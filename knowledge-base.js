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
    // Natural guard language
    "cameras down",
    "cameras aren't working",
    "cameras not working",
    "can't see cameras",
    "camera screen is down",
    "my camera screen is down",
    "cameras out",
    "camera feed is gone",
    "cameras off",
    "no cameras",
    "cameras aren't showing",
    "camera display is off",
    "monitor is dead",
    "monitor won't turn on",
    "monitor is black",
    "screen is black",
    "screen is off",
    "screen won't turn on",
    "monitor is blank",
    "no video",
    "no camera feed",
    "lost camera feed",
    "nvr down",
    "nvr not working",
    "nvr is off",
    "camera system down",
    "camera system isn't working",
    "dw spectrum down",
    "spectrum not working"
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
    // Natural guard language
    "fire alarm",
    "fire alarm won't stop",
    "fire alarm beeping",
    "fire panel beeping",
    "alarm won't stop",
    "fire panel won't stop",
    "beeping won't quit",
    "alarm panel is beeping",
    "fire alarm going off",
    "fire panel is going off",
    "reset fire alarm",
    "how do i reset fire alarm",
    "fire alarm reset",
    "fire panel reset",
    "fire panel stuck",
    "fire alarm stuck",
    "alarm panel",
    "fire system alarm",
    "fire alarm panel",
    "alarm panel showing error"
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
    // Natural guard language
    "electric fence",
    "turn on fence",
    "turn off fence",
    "turn on the fence",
    "turn off the fence",
    "activate fence",
    "deactivate fence",
    "how do i turn on fence",
    "how do i turn off fence",
    "fence alarm",
    "fence is beeping",
    "fence code",
    "fence panel",
    "perimeter fence",
    "fence not working",
    "fence won't turn on",
    "fence won't turn off",
    "how to arm fence",
    "how to disarm fence"
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
    // Natural guard language
    "visitor won't show id",
    "visitor doesn't have id",
    "visitor won't give me id",
    "visitor refuses to show id",
    "no id",
    "they won't show id",
    "how do i check in visitor",
    "how to check in visitor",
    "visitor procedure",
    "visitor protocol",
    "access control",
    "someone at gate",
    "someone at the gate",
    "person at gate",
    "contractor at gate",
    "contractor here",
    "delivery at gate",
    "how do i let someone in",
    "how to let someone in",
    "can i let them in",
    "should i let them in",
    "gate access",
    "who can come in",
    "visitor rules",
    "access rules"
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
    "gate isn't working",
    "gate not working",
    "gate won't open",
    "gate won't close",
    "gate is stuck",
    "gate stuck",
    "gate broken",
    "gate problem",
    "gate issue",
    "gate malfunction",
    "gate won't move",
    "gate motor",
    "gate chain",
    "the gate isn't working"
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
    "i don't know what to do",
    "don't know what to do",
    "not sure what to do",
    "i'm confused",
    "confused",
    "i'm lost",
    "lost",
    "need help",
    "i need help",
    "help me",
    "what do i do",
    "what should i do",
    "unsure",
    "i'm unsure",
    "not sure",
    "stuck",
    "i'm stuck"
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
