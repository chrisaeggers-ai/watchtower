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
      userFriendly: "First, head to the IT room. It's the door right next to the fire alarm panel. Let me know when you're there.",
      waitForConfirmation: true,
      image: "step1.jpg"
    },
    {
      stepNumber: 2,
      instruction: "Enter code 1078 on the padlock to unlock the door.",
      userFriendly: "Great! Now enter the code 1078 on the padlock to unlock the door. Text me when you're inside.",
      waitForConfirmation: true,
      image: "step2.jpg"
    },
    {
      stepNumber: 3,
      instruction: "Disconnect HDMI cable (1) from NVR and connect HDMI cable (2) to bring up NVR display on small monitor in IT room.",
      userFriendly: "Look for 2 HDMI cables near the NVR. Disconnect cable #1 and connect cable #2 to show the display on the small monitor. Done?",
      waitForConfirmation: true,
      image: "step3.jpg"
    },
    {
      stepNumber: 4,
      instruction: "Connect the mouse and keyboard cables to the USB ports on the NVR.",
      userFriendly: "Now plug in the mouse and keyboard cables into the USB ports on the NVR. Ready?",
      waitForConfirmation: true,
      image: "step4.jpg"
    },
    {
      stepNumber: 5,
      instruction: "Click on 'DW' on the left side of the screen.",
      userFriendly: "You should see the screen now. Click on 'DW' on the left side. Let me know when you've done that.",
      waitForConfirmation: true,
      image: "step5.jpg"
    },
    {
      stepNumber: 6,
      instruction: "Click on 'OiFunds Fruitvale' to connect to the server.",
      userFriendly: "Now click on 'OiFunds Fruitvale' to connect to the server. Text me once it connects.",
      waitForConfirmation: false  // No image for step6
    },
    {
      stepNumber: 7,
      instruction: "If server doesn't accept 'OiFunds', use manual connection: Click 'Connect to Server', enter User: admin, Password: admin12345, click OK.",
      userFriendly: "If the server doesn't connect automatically:\n\n1. Click 'Connect to Server'\n2. Username: admin\n3. Password: admin12345\n4. Click OK\n\nDid it connect?",
      waitForConfirmation: true,
      image: "step7.jpg"
    },
    {
      stepNumber: 8,
      instruction: "If cameras don't automatically show up, click dropdown arrow next to 'New Layout 1' and select 'Guard View'.",
      userFriendly: "If the cameras aren't showing yet, click the dropdown arrow next to 'New Layout 1' at the top and select 'Guard View'. See the cameras now?",
      waitForConfirmation: true,
      image: "step8.jpg"
    },
    {
      stepNumber: 9,
      instruction: "Alternative: Click side arrow on left to open camera panel, scroll to 'Guard View' and double-click it.",
      userFriendly: "Still not showing? Try this: Click the side arrow on the left, scroll down to 'Guard View' and double-click it. Cameras up?",
      waitForConfirmation: false  // No image for step9
    },
    {
      stepNumber: 10,
      instruction: "IMPORTANT: Disconnect HDMI cable and mouse/keyboard, then reconnect the original HDMI cable to make cameras show on guard shack TV.",
      userFriendly: "Excellent! Final step: Disconnect the HDMI cable and mouse/keyboard, then reconnect the original HDMI cable so the cameras show back up on the TV in the guard shack. This is important! Let me know when done.",
      waitForConfirmation: true,
      image: "step10.jpg"
    }
  ],
  
  triggerPhrases: [
    "camera screen down",
    "camera monitor isn't working",
    "screen is black",
    "camera feed is gone",
    "monitor is dead",
    "camera display offline",
    "no video showing",
    "screen won't turn on",
    "cameras not visible",
    "display failure",
    "monitor is blank",
    "camera system down",
    "lost video feed",
    "screen froze",
    "display issue",
    "camera screen glitching",
    "monitor not responding",
    "no camera signal",
    "video screen out",
    "feed not showing",
    "cameras down",
    "cameras not working",
    "nvr down",
    "nvr not working",
    "cameras off",
    "no cameras"
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
      userFriendly: "Okay, let's reset the fire panel. Press the system reset button once, then press and HOLD it until the screen says 'SYSTEM RESET IN PROGRESS'. Let me know when you see that message.",
      waitForConfirmation: true,
      image: "fire-panel-step1.jpg"
    },
    {
      stepNumber: 2,
      instruction: "Wait until the screen says 'SYSTEM RESET COMPLETE'",
      userFriendly: "Good! Now just wait for the screen to say 'SYSTEM RESET COMPLETE'. This might take a minute. Text me when you see it.",
      waitForConfirmation: true,
      image: "fire-panel-step2.jpg"
    },
    {
      stepNumber: 3,
      instruction: "Press the 'Enter' button then press the 'C/Exit' button in order. The screen should say 'SYSTEM IS NORMAL'.",
      userFriendly: "Almost done! Now press these 2 buttons IN ORDER:\n\n1. Press 'Enter'\n2. Press 'C/Exit'\n\nThe screen should now say 'SYSTEM IS NORMAL'. All done?",
      waitForConfirmation: true,
      image: "fire-panel-step3.jpg"
    }
  ],
  
  triggerPhrases: [
    "fire alarm",
    "fire panel",
    "fire alarm beeping",
    "fire panel beeping",
    "alarm won't stop",
    "reset fire alarm",
    "fire alarm reset",
    "fire panel won't reset",
    "alarm panel",
    "fire system alarm"
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
      userFriendly: "To ACTIVATE the electric fence:\n\n1. Make sure all gates are closed\n2. Unlock panel with code: 510\n3. Enter code: 0297\n4. Press AWAY (the 2 button)\n\nDone?",
      waitForConfirmation: true
    },
    {
      stepNumber: 2,
      instruction: "To DEACTIVATE: Unlock panel (code 510), enter 0297, press OFF (button 1). Screen should say 'DISARMED READY TO ARM'",
      userFriendly: "To DEACTIVATE the electric fence:\n\n1. Unlock panel with code: 510\n2. Enter code: 0297\n3. Press OFF (the first button)\n4. Screen should say 'DISARMED READY TO ARM'\n\nAll set?",
      waitForConfirmation: true
    }
  ],
  
  triggerPhrases: [
    "electric fence",
    "fence alarm",
    "turn on fence",
    "turn off fence",
    "activate fence",
    "deactivate fence",
    "fence code",
    "fence panel",
    "perimeter fence",
    "fence not working"
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
      userFriendly: "There are 3 ways visitors can enter Fruitvale:\n\n1. They have a Manzanita badge (scan with Jibble app)\n2. They show valid ID AND you verify with the tenant\n3. Their tenant escort comes to get them at the gate\n\nWhich situation do you have?",
      waitForConfirmation: true
    },
    {
      stepNumber: 2,
      instruction: "FOR VISITORS WITH ID: Take ID, give visitor pass, log in visitor log (badge #, name, who visiting), CALL tenant to verify, then allow entry",
      userFriendly: "For visitors who give you their ID:\n\n1. Take their ID\n2. Give them a visitor pass\n3. Log: badge #, name, who they're visiting\n4. CALL the tenant to verify (required!)\n5. Then let them in\n\nGot it?",
      waitForConfirmation: true
    },
    {
      stepNumber: 3,
      instruction: "FOR VISITORS WITHOUT ID: They stay outside gate, they call their escort. If no escort number, you can help call from contact list. Escort must come get them.",
      userFriendly: "For visitors who WON'T give ID:\n\n1. They must stay OUTSIDE the gate\n2. They call their escort\n3. If they don't have the number, you can help\n4. Their escort MUST come get them from the gate\n\nNo ID = No entry without escort!",
      waitForConfirmation: true
    },
    {
      stepNumber: 4,
      instruction: "CONTRACTORS: Must have work order with correct address and Marie as contact. Call Marie to verify if unsure. Deny access if no work order.",
      userFriendly: "For CONTRACTORS:\n\n1. Ask for work order\n2. Check it has correct address\n3. Marie should be listed as contact\n4. Call Marie to verify if unsure\n5. NO work order = NO entry\n\nMake sense?",
      waitForConfirmation: false
    }
  ],
  
  triggerPhrases: [
    "visitor won't show id",
    "how do i check in visitor",
    "visitor procedure",
    "access control",
    "someone at gate",
    "visitor doesn't have id",
    "contractor at gate",
    "how to let someone in",
    "gate access",
    "visitor protocol"
  ]
};

module.exports = { 
  FRUITVALE_NVR_SOP,
  FRUITVALE_FIRE_PANEL_SOP,
  FRUITVALE_ELECTRIC_FENCE_SOP,
  FRUITVALE_ACCESS_CONTROL_INFO
};
