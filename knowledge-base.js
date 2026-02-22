// ═══════════════════════════════════════════════════════════════════════
// FRUITVALE SECURITY - KNOWLEDGE BASE
// All SOPs, procedures, and troubleshooting guides
// ═══════════════════════════════════════════════════════════════════════

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📹 CAMERA / NVR TROUBLESHOOTING SOP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const FRUITVALE_NVR_SOP = {
  title: "Camera System Troubleshooting",
  site: "Fruitvale",
  steps: [
    {
      stepNumber: 1,
      instruction: "Check if the NVR (Network Video Recorder) has power.",
      userFriendly: "🔧 Let's troubleshoot the cameras.\n\n**Step 1:** Check if the NVR has power. Look for:\n- Power light on front\n- Fans running (listen)\n- Display showing video\n\nIs the NVR powered on? (Yes/No)",
      waitForConfirmation: true
    },
    {
      stepNumber: 2,
      instruction: "Check if you can see video on the monitor connected to the NVR.",
      userFriendly: "Good! **Step 2:** Check if you can see any video on the monitor.\n\nCan you see video feeds? (Yes/No)",
      waitForConfirmation: true
    },
    {
      stepNumber: 3,
      instruction: "Reboot the NVR system by unplugging power, waiting 30 seconds, and plugging back in.",
      userFriendly: "**Step 3:** Let's reboot the system.\n\n1. Unplug the power cable from the NVR\n2. Wait 30 seconds\n3. Plug it back in\n4. Wait 2-3 minutes for it to boot\n\nDone rebooting? (Reply 'Done' when ready)",
      waitForConfirmation: true
    },
    {
      stepNumber: 4,
      instruction: "Check if cameras are back online after reboot.",
      userFriendly: "**Final Check:** Can you see the camera feeds now?\n\nWorking? (Yes/No)",
      waitForConfirmation: true,
      isResolutionCheck: true
    }
  ],
  
  triggerPhrases: [
    // General camera down
    "cameras are down", "cameras down", "cameras not working", "camera system down",
    "cameras went down", "cameras went out", "can't see cameras", "cant see cameras",
    "no camera feed", "camera feed is out", "cameras offline", "camera system offline",
    "cameras stopped working", "camera display blank", "monitor is black",
    
    // NVR specific
    "nvr is down", "nvr not working", "nvr offline", "nvr says offline",
    "video system down", "surveillance down", "security cameras down",
    
    // Specific camera issues
    "camera 3 not working", "camera not working", "one camera down", "some cameras down",
    "cameras fuzzy", "cameras are fuzzy", "can't see anything", "cant see anything",
    "cameras black", "cameras went black", "screen went black",
    
    // Display issues
    "monitor shows nothing", "no video", "no picture", "blank screen",
    "display is blank", "nothing on monitor", "tv shows no cameras"
  ]
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚧 GATE TROUBLESHOOTING SOP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const FRUITVALE_GATE_ISSUES = {
  title: "Gate System Troubleshooting",
  site: "Fruitvale",
  steps: [
    {
      stepNumber: 1,
      instruction: "Determine what type of gate issue this is.",
      userFriendly: "Okay, let's figure out what's wrong. Is the gate:\n\nA) Stuck but motor running?\nB) Motor not running at all?\nC) Chain broken/fallen off?\n\nText A, B, or C",
      waitForConfirmation: true
    },
    {
      stepNumber: 2,
      instruction: "Based on issue type, provide appropriate fix.",
      userFriendly: "Here's what to do:\n\nIf STUCK: Switch gate to manual mode using the motor control box.\nIf MOTOR/CHAIN BROKEN: Call Victor Maintenance right now.\n\nGate currently blocking traffic?",
      waitForConfirmation: true
    },
    {
      stepNumber: 3,
      instruction: "Follow through on the appropriate action.",
      userFriendly: "Let's try again:\n\nIf gate is stuck: Switch to manual operation using motor control box.\nIf motor broken: Call Victor Maintenance immediately.\nIf chain broken: Call Victor Maintenance immediately.\n\n(Still stuck? Text 'supervisor')",
      waitForConfirmation: true
    },
    {
      stepNumber: 4,
      instruction: "Check if gate is now working or if escalation is needed.",
      userFriendly: "If yes - secure the entrance manually. Stay at the gate until relief arrives. I'm escalating this now.\n\nIf no - log the maintenance issue and continue monitoring.",
      waitForConfirmation: true,
      isResolutionCheck: true
    }
  ],
  
  triggerPhrases: [
    // Gate stuck
    "gate stuck", "gate is stuck", "gate won't move", "gate wont move",
    "gate stuck open", "gate stuck closed", "gate frozen",
    
    // Gate won't open/close
    "gate won't open", "gate wont open", "gate won't close", "gate wont close",
    "gate not opening", "gate not closing", "can't open gate", "cant open gate",
    
    // Gate slow
    "gate slow", "gate moving slow", "gate is slow", "gate really slow",
    "gate taking forever", "gate barely moving",
    
    // Gate motor
    "gate motor", "motor not running", "motor broken", "motor not working",
    "gate making noise", "gate grinding", "weird noise",
    
    // Gate chain
    "chain broken", "chain fell off", "gate chain", "chain off track",
    
    // Gate general
    "gate issue", "gate problem", "gate not working", "gate broken",
    "gate need help", "help with gate", "gate malfunction"
  ]
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔥 FIRE PANEL TROUBLESHOOTING SOP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const FRUITVALE_FIRE_PANEL_SOP = {
  title: "Fire Panel Troubleshooting",
  site: "Fruitvale",
  steps: [
    {
      stepNumber: 1,
      instruction: "Check if there is smoke or actual fire.",
      userFriendly: "🔥 Fire panel alert.\n\n**FIRST:** Is there actual smoke or fire? (Yes/No)",
      waitForConfirmation: true
    },
    {
      stepNumber: 2,
      instruction: "If no fire, proceed to reset the panel.",
      userFriendly: "Good - no fire. **Step 2:** Let's reset the panel.\n\n1. Locate the fire panel (main entrance area)\n2. Press the 'Silence' button\n3. Press the 'Reset' button\n\nDid the alarm stop? (Yes/No)",
      waitForConfirmation: true
    },
    {
      stepNumber: 3,
      instruction: "Check if the trouble light is still on.",
      userFriendly: "**Step 3:** Is the 'Trouble' light still on? (Yes/No)",
      waitForConfirmation: true
    },
    {
      stepNumber: 4,
      instruction: "Verify the panel is now normal.",
      userFriendly: "**Final Check:** Is the panel quiet and showing normal status?\n\nAll clear? (Yes/No)",
      waitForConfirmation: true,
      isResolutionCheck: true
    }
  ],
  
  triggerPhrases: [
    // Fire panel alarms
    "fire panel", "fire alarm", "fire panel beeping", "panel beeping",
    "fire alarm going off", "alarm going off",
    
    // Panel status
    "fire panel trouble", "trouble light", "panel says trouble",
    "fire panel alert", "panel alert",
    
    // Specific sounds
    "beeping", "panel beeping", "alarm beeping", "fire beep",
    "chirping", "panel chirping",
    
    // General
    "fire system", "alarm system", "fire panel issue", "panel issue",
    "reset fire panel", "how to reset", "silence alarm"
  ]
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚡ ELECTRIC FENCE TROUBLESHOOTING SOP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const FRUITVALE_ELECTRIC_FENCE_SOP = {
  title: "Electric Fence Troubleshooting",
  site: "Fruitvale",
  steps: [
    {
      stepNumber: 1,
      instruction: "Check if there is actual perimeter breach or just alarm.",
      userFriendly: "⚡ Electric fence alarm.\n\n**FIRST:** Do you see anyone at the fence or any breach? (Yes/No)",
      waitForConfirmation: true
    },
    {
      stepNumber: 2,
      instruction: "If no breach, check for false trigger causes.",
      userFriendly: "Good - no breach. **Step 2:** Check for:\n- Debris on fence\n- Branches touching fence\n- Animals near fence\n\nSee any of these? (Yes/No)",
      waitForConfirmation: true
    },
    {
      stepNumber: 3,
      instruction: "Reset the fence alarm system.",
      userFriendly: "**Step 3:** Let's reset the system.\n\n1. Go to the fence control panel\n2. Press 'Reset' button\n3. Wait for green light\n\nDone? (Reply 'Done')",
      waitForConfirmation: true
    },
    {
      stepNumber: 4,
      instruction: "Verify the fence alarm is cleared.",
      userFriendly: "**Final Check:** Is the alarm cleared and fence system showing normal?\n\nAll clear? (Yes/No)",
      waitForConfirmation: true,
      isResolutionCheck: true
    }
  ],
  
  triggerPhrases: [
    // Fence alarm
    "fence alarm", "electric fence", "fence alarm going off",
    "perimeter alarm", "fence alert",
    
    // Fence issues
    "fence down", "fence not working", "fence offline",
    "fence breach", "perimeter breach",
    
    // General
    "fence system", "fence issue", "fence problem",
    "reset fence", "fence trouble"
  ]
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 ACCESS CONTROL INFORMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const FRUITVALE_ACCESS_CONTROL_INFO = {
  title: "Access Control & Badge Information",
  site: "Fruitvale",
  steps: [
    {
      stepNumber: 1,
      instruction: "Provide access control information based on the specific question.",
      userFriendly: "🔐 For access control and badges:\n\n- Badge not working? Try cleaning it and re-scanning\n- Need to grant access? Check the access control panel\n- Door won't unlock? Verify badge permissions\n\nWhat specifically do you need help with?",
      waitForConfirmation: false
    }
  ],
  
  triggerPhrases: [
    "access control", "badge", "card reader", "door won't unlock",
    "badge not working", "access denied", "need access",
    "unlock door", "door access", "keycard"
  ]
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ❓ GENERAL HELP & GUIDANCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const FRUITVALE_GENERAL_HELP = {
  title: "General Guard Assistance",
  site: "Fruitvale",
  steps: [
    {
      stepNumber: 1,
      instruction: "Provide general guidance and direct to appropriate resources.",
      userFriendly: "I'm here to help! For specific issues:\n\n📹 Cameras: Text 'cameras down'\n🚧 Gates: Text 'gate stuck' or 'gate issue'\n🔥 Fire Panel: Text 'fire panel'\n⚡ Fence: Text 'fence alarm'\n📋 Report something: Text 'report'\n📞 Supervisor: Text 'supervisor'\n\nWhat do you need?",
      waitForConfirmation: false
    }
  ],
  
  triggerPhrases: [
    "help", "need help", "what do i do", "how do i",
    "where is", "where do i find", "cant find", "can't find",
    "question", "quick question", "help me"
  ]
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  FRUITVALE_NVR_SOP,
  FRUITVALE_GATE_ISSUES,
  FRUITVALE_FIRE_PANEL_SOP,
  FRUITVALE_ELECTRIC_FENCE_SOP,
  FRUITVALE_ACCESS_CONTROL_INFO,
  FRUITVALE_GENERAL_HELP
};
