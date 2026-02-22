// ═══════════════════════════════════════════════════════════════════════
// FRUITVALE SECURITY - KNOWLEDGE BASE
// All SOPs, procedures, and troubleshooting guides
// ═══════════════════════════════════════════════════════════════════════

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📹 CAMERA / NVR TROUBLESHOOTING SOP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
    // 150 COMPREHENSIVE CAMERA/NVR TRIGGERS
    "cameras are down", "cameras aren't working", "cameras not working", "camera system is down",
    "the cameras went down", "cameras went out", "i can't see the cameras", "cant see cameras",
    "no camera feed", "camera feed is out", "cameras are offline", "camera system offline",
    "lost camera signal", "cameras stopped working", "camera display is blank", "monitor is black",
    "no picture on cameras", "cameras showing nothing", "camera screen is blank", "nvr is down",
    "nvr not working", "nvr system down", "video system down", "surveillance system down",
    "security cameras down", "cctv down", "cctv not working", "cctv system offline",
    "video feed is out", "lost video feed", "can't access cameras", "cant access cameras",
    "camera system crashed", "cameras froze", "camera feed froze", "monitor froze",
    "no video signal", "video signal lost", "cameras went black", "screen went black",
    "all cameras are out", "some cameras are down", "half the cameras are out",
    "cameras aren't showing", "cant pull up cameras", "camera system won't load", "wont load",
    "nvr won't connect", "cant connect to nvr", "lost connection to cameras",
    "camera connection lost", "dvr isn't working", "dvr is down", "recording system down",
    "video recorder down", "cameras aren't recording", "system isn't recording",
    "how do i fix the cameras", "how do i get cameras back", "how do i restore camera feed",
    "what do i do when cameras are down", "cameras need reset", "how do i reset cameras",
    "how do i restart the nvr", "need to reboot cameras", "camera reboot needed",
    "system needs restart", "how do i bring cameras back up", "how do i get video back",
    "cameras are black screen", "nothing on the monitor", "monitor shows no signal",
    "tv shows no cameras", "guard shack tv is blank", "cant see anything on screen",
    "display is blank", "no image on cameras", "camera image is gone", "lost all camera views",
    "view screens are blank", "surveillance is down", "security feed is out",
    "camera monitors are dark", "the nvr isn't responding", "nvr isnt responding",
    "nvr is frozen", "system is frozen", "camera software crashed", "dw system is down",
    "digital watchdog down", "camera server is down", "cant access camera server",
    "server won't connect", "server wont connect", "cameras need troubleshooting",
    "camera troubleshooting needed", "video system needs fix", "fix the camera system",
    "cameras require attention", "camera system failure", "system failure cameras",
    "total camera loss", "complete camera outage", "no visual on cameras", "visual feed lost",
    "cant monitor cameras", "monitoring system down", "camera grid is blank", "all views are blank",
    "multi-view is blank", "multi view is blank", "camera layout is blank",
    "guard view is blank", "cant see guard view", "layout won't load", "layout wont load",
    "views won't display", "views wont display", "camera channels are out", "all channels down",
    "channels aren't showing", "channels arent showing", "cant switch camera views",
    "views aren't changing", "stuck on one camera", "cameras won't cycle", "cameras wont cycle",
    "camera rotation stopped", "cameras are glitching", "camera feed is glitchy",
    "video is pixelated", "cameras are fuzzy", "blurry camera feed", "cameras are lagging",
    "video lag issue", "camera delay problem", "live feed isn't working", "live feed isnt working",
    "cant get live view", "real-time view is down", "cameras are static", "getting static on cameras",
    "snow on camera screens", "blue screen on cameras", "error message on cameras",
    "camera error display", "system error cameras", "cameras show error",
    "camera malfunction alert", "alert cameras are down", "warning camera system",
    "cameras just went out", "cameras suddenly stopped", "video just cut out",
    "lost cameras just now", "cameras went down suddenly", "immediate camera loss",
    "cameras failed just now", "just lost all cameras", "camera system just failed",
    // Shortened/casual
    "cams down", "cameras out", "nvr down", "no cameras", "cam feed out", "system down cameras",
    // Additional variations
    "camera 3 not working", "camera 3", "one camera down", "some cameras down"
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
