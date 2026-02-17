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
    "cameras aren't showing", "cant pull up cameras", "camera system won't load",
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
    "camera monitors are dark", "the nvr isn't responding", "nvr is frozen", "system is frozen",
    "camera software crashed", "dw system is down", "digital watchdog down",
    "camera server is down", "cant access camera server", "server won't connect",
    "cameras need troubleshooting", "camera troubleshooting needed", "video system needs fix",
    "fix the camera system", "cameras require attention", "camera system failure",
    "system failure cameras", "total camera loss", "complete camera outage",
    "no visual on cameras", "visual feed lost", "cant monitor cameras", "monitoring system down",
    "camera grid is blank", "all views are blank", "multi-view is blank", "camera layout is blank",
    "guard view is blank", "cant see guard view", "layout won't load", "views won't display",
    "camera channels are out", "all channels down", "channels aren't showing",
    "cant switch camera views", "views aren't changing", "stuck on one camera",
    "cameras won't cycle", "camera rotation stopped", "cameras are glitching",
    "camera feed is glitchy", "video is pixelated", "cameras are fuzzy", "blurry camera feed",
    "cameras are lagging", "video lag issue", "camera delay problem", "live feed isn't working",
    "cant get live view", "real-time view is down", "cameras are static",
    "getting static on cameras", "snow on camera screens", "blue screen on cameras",
    "error message on cameras", "camera error display", "system error cameras",
    "cameras show error", "camera malfunction alert", "alert cameras are down",
    "warning camera system", "cameras just went out", "cameras suddenly stopped",
    "video just cut out", "lost cameras just now", "cameras went down suddenly",
    "immediate camera loss", "cameras failed just now", "just lost all cameras",
    "camera system just failed", "cams down", "cameras out", "nvr down", "no cameras",
    "cam feed out", "system down cameras", "cams not working", "monitor black", "no video"
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
    "gate emergency",
    
    // COMPREHENSIVE MANUAL GATE OPERATION TRIGGERS (150+ variations)
    // Covering formal, rushed, vague, slang, and situational phrasing
    
    "how do i manually open the gate",
    "how do i open the gate by hand",
    "how do i get the gate open manually",
    "what's the manual override for the gate",
    "whats the manual override for the gate",
    "how do i override the gate",
    "gate won't open — how do i do it manually",
    "gate wont open how do i do it manually",
    "what's the manual process for opening the gate",
    "whats the manual process for opening the gate",
    "how do i open the arm manually",
    "how do i lift the gate myself",
    "is there a way to open the gate without power",
    "power's out — how do i open the gate",
    "powers out how do i open the gate",
    "the gate is stuck — what's the manual way",
    "the gate is stuck whats the manual way",
    "how do i disengage the gate motor",
    "how do i unlock the gate manually",
    "how do i release the gate arm",
    "where's the manual release for the gate",
    "wheres the manual release for the gate",
    "gate isn't responding — how do i open it myself",
    "gate isnt responding how do i open it myself",
    "how do i open the gate without the keypad",
    "the remote isn't working — now what",
    "the remote isnt working now what",
    "what's the backup way to open the gate",
    "whats the backup way to open the gate",
    "how do i open it if the system's down",
    "how do i open it if the systems down",
    "how do i manually swing the gate open",
    "can i open the gate by hand",
    "is there a manual latch",
    "where's the override switch",
    "wheres the override switch",
    "how do i bypass the motor",
    "what do i do if the gate won't respond",
    "what do i do if the gate wont respond",
    "gate won't budge — what's next",
    "gate wont budge whats next",
    "how do i open the gate without electricity",
    "how do i disengage the mechanism",
    "the arm is stuck — how do i lift it",
    "the arm is stuck how do i lift it",
    "how do i reset and open the gate manually",
    "is there a key to open the gate manually",
    "where's the manual key slot",
    "wheres the manual key slot",
    "how do i put the gate in manual mode",
    "how do i switch it to manual",
    "how do i operate the gate without the system",
    "the keypad's dead — how do i open it",
    "the keypads dead how do i open it",
    "how do i unlock the gate arm",
    "gate motor failed — how do i open it",
    "gate motor failed how do i open it",
    "what's the manual release procedure",
    "whats the manual release procedure",
    "how do i force it open safely",
    "how do i pop the gate open",
    "what's the hand-open process",
    "whats the hand-open process",
    "how do i override the automatic system",
    "how do i access the manual control",
    "the control panel isn't working — now what",
    "the control panel isnt working now what",
    "how do i manually disengage the gate",
    "how do i open the entry gate without power",
    "how do i manually raise the barrier",
    "gate is jammed — how do i open it",
    "gate is jammed how do i open it",
    "how do i pull the release",
    "what do i do when the gate arm won't lift",
    "what do i do when the gate arm wont lift",
    "is there a backup key",
    "where's the manual handle",
    "wheres the manual handle",
    "how do i unlock the barrier",
    "how do i get vehicles through if it won't open",
    "how do i get vehicles through if it wont open",
    "how do i manually open the entrance",
    "gate system down — what's the fix",
    "gate system down whats the fix",
    "how do i get the gate open right now",
    "what's the emergency open procedure",
    "whats the emergency open procedure",
    "how do i open the gate in an emergency",
    "how do i manually reset and open it",
    "how do i unlock it without the system",
    "how do i lift the arm",
    "what's the step-by-step to open it manually",
    "whats the step by step to open it manually",
    "gate won't respond — instructions",
    "gate wont respond instructions",
    "what's the override process",
    "whats the override process",
    "how do i operate the gate manually",
    "how do i take it out of auto mode",
    "how do i unlock the control box",
    "the gate arm won't move — what now",
    "the gate arm wont move what now",
    "how do i open it without the remote",
    "what's the backup method to open it",
    "whats the backup method to open it",
    "how do i manually open the driveway gate",
    "how do i manually open the arm gate",
    "where is the manual release located",
    "how do i manually release the motor",
    "the gate's not responding — manual instructions",
    "the gates not responding manual instructions",
    "what do i press to override it",
    "how do i unlock the barrier arm",
    "is there a manual key for this",
    "how do i open it if the power is cut",
    "how do i manually operate the gate arm",
    "what's the manual entry process",
    "whats the manual entry process",
    "how do i disengage auto mode",
    "gate's stuck closed — help",
    "gates stuck closed help",
    "how do i open the security gate by hand",
    "where do i access the release",
    "what's the mechanical release process",
    "whats the mechanical release process",
    "how do i manually swing the gate",
    "how do i open the barrier if it's offline",
    "how do i open the barrier if its offline",
    "the arm won't lift — what do i do",
    "the arm wont lift what do i do",
    "how do i manually bypass it",
    "gate not opening — manual steps",
    "gate not opening manual steps",
    "how do i manually get access through the gate",
    "the gate system froze — how do i open it",
    "the gate system froze how do i open it",
    "how do i unlock it physically",
    "how do i put the gate into manual override",
    "what's the emergency release method",
    "whats the emergency release method",
    "gate control box is dead — now what",
    "gate control box is dead now what",
    "how do i manually control the barrier",
    "how do i open it without the button",
    "what's the fail-safe way to open the gate",
    "whats the fail safe way to open the gate",
    "the entry arm is stuck — what's next",
    "the entry arm is stuck whats next",
    "how do i open it manually step-by-step",
    "how do i open it manually step by step",
    "the system's offline — how do i open the gate",
    "the systems offline how do i open the gate",
    "is there a manual backup option",
    "how do i manually disengage the barrier arm",
    "what's the manual gate access procedure",
    "whats the manual gate access procedure",
    "gate isn't moving — how do i override it",
    "gate isnt moving how do i override it",
    "how do i get the gate open if the panel's dead",
    "how do i get the gate open if the panels dead",
    "where's the emergency key",
    "wheres the emergency key",
    "how do i unlock the manual latch",
    "how do i manually raise the entry arm",
    "what's the manual release location",
    "whats the manual release location",
    "how do i open it when electronics fail",
    "how do i get this gate open manually",
    "what's the backup process for opening the gate",
    "whats the backup process for opening the gate",
    "the arm won't respond — manual steps",
    "the arm wont respond manual steps",
    "how do i bypass the automatic function",
    "how do i manually open the site gate",
    "how do i unlock the gate if the keypad is dead",
    "how do i open the gate without access control",
    "what's the physical override",
    "whats the physical override",
    "where is the override key kept",
    "how do i manually access the property",
    "how do i manually lift the security arm",
    "what's the procedure if the gate won't open",
    "whats the procedure if the gate wont open",
    "how do i release the motor clutch",
    "the gate is unresponsive — what's the manual way",
    "the gate is unresponsive whats the manual way",
    "how do i operate the gate manually during outage",
    "what's the fallback to open the gate",
    "whats the fallback to open the gate",
    "how do i manually disengage the lock",
    "gate control is down — how do i open it",
    "gate control is down how do i open it",
    "how do i open it physically",
    "what's the hand-release process",
    "whats the hand release process",
    "how do i manually free the barrier",
    "how do i open the gate without the system running",
    "how do i override the entry arm",
    "what do i do if the gate won't lift",
    "what do i do if the gate wont lift",
    "how do i manually activate the release",
    "is there a manual way to open this gate",
    "where do i find the manual release key",
    "how do i open the gate if it's locked up",
    "how do i open the gate if its locked up",
    "how do i disengage the automatic motor",
    "what's the emergency open steps",
    "whats the emergency open steps",
    "how do i manually get the arm up",
    "the gate's frozen — what's the manual fix",
    "the gates frozen whats the manual fix",
    "how do i open this gate without power",
    
    // Shortened/casual variations
    "manual gate open",
    "open gate manual",
    "gate manual mode",
    "manual override gate",
    "bypass gate motor"
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
    // 250 COMPREHENSIVE EMPLOYEE HANDBOOK TRIGGERS
    
    // PAYROLL & PAYDAY (40 questions)
    "when is payday", "what day is payday", "when do i get paid", "when do we get paid",
    "what's payday", "whats payday", "pay day", "payday schedule", "when's my paycheck",
    "whens my paycheck", "when does pay come", "what day do we get paid", "pay schedule",
    "payment schedule", "when's the next payday", "whens the next payday",
    "how often do we get paid", "weekly pay or biweekly", "direct deposit schedule",
    "when is direct deposit", "when does direct deposit hit", "what time does direct deposit",
    "check pickup schedule", "where do i pick up my check", "when can i get my check",
    "paycheck not received", "didn't get paid", "didnt get paid", "missing paycheck",
    "where's my pay", "wheres my pay", "haven't been paid", "havent been paid",
    "paystub question", "how do i get my paystub", "where's my paystub", "wheres my paystub",
    "view paystub", "pay rate question", "what's my pay rate", "whats my pay rate",
    "hourly rate", "overtime pay", "how much is overtime",
    
    // TIME OFF & SCHEDULING (50 questions)
    "how do i request time off", "request time off", "time off request", "pto request",
    "vacation request", "how do i ask for time off", "need time off", "want to request a day off",
    "how do i call out", "call out procedure", "sick day procedure", "how do i call in sick",
    "who do i call for sick day", "sick leave policy", "how many sick days", "vacation days",
    "how much pto", "pto balance", "time off balance", "accrued time off", "unpaid time off",
    "personal day", "emergency time off", "family emergency leave", "bereavement leave",
    "medical leave", "how far in advance time off", "time off approval", "who approves time off",
    "time off denied", "can't get time off", "cant get time off", "schedule change request",
    "shift change", "swap shifts", "trade shifts", "cover my shift", "find shift coverage",
    "who covers my shift", "shift swap policy", "schedule posted when", "where's the schedule",
    "wheres the schedule", "view my schedule", "check my schedule", "what's my schedule",
    "whats my schedule", "am i scheduled", "when do i work", "what days do i work",
    "schedule conflict",
    
    // UNIFORM & DRESS CODE (30 questions)
    "uniform policy", "what's the uniform", "whats the uniform", "dress code", "what do i wear",
    "uniform requirements", "where do i get uniform", "how do i get a uniform", "uniform order",
    "new uniform needed", "replace uniform", "uniform damaged", "lost my uniform",
    "uniform allowance", "do i pay for uniform", "uniform cost", "shirt requirements",
    "pants requirements", "shoes requirements", "boot requirements", "what shoes can i wear",
    "steel toe required", "badge policy", "name tag policy", "id badge", "where's my badge",
    "wheres my badge", "lost my badge", "replace badge", "cold weather gear", "jacket policy",
    
    // BENEFITS & INSURANCE (25 questions)
    "health insurance", "medical benefits", "when do benefits start", "benefits eligibility",
    "dental insurance", "vision insurance", "insurance enrollment", "how do i enroll",
    "benefits package", "what benefits offered", "401k information", "retirement plan",
    "life insurance", "disability insurance", "workers comp", "workers compensation",
    "how do i file workers comp", "injury at work", "work injury procedure",
    "medical emergency at work", "go to doctor work injury", "which doctor for injury",
    "hospital for work injury", "report injury", "accident report",
    
    // HR POLICIES & PROCEDURES (40 questions)
    "company handbook", "where's the handbook", "wheres the handbook", "employee handbook",
    "read the handbook", "handbook rules", "company policies", "company rules", "break policy",
    "lunch break policy", "how long is lunch", "when's my break", "whens my break",
    "break schedule", "smoke break policy", "can i smoke", "where can i smoke",
    "cell phone policy", "phone usage policy", "can i use my phone", "social media policy",
    "recording policy", "photos at work", "video at work", "visitor policy at work",
    "can family visit", "bringing guests", "attendance policy", "tardiness policy",
    "late to work", "clocking in late", "missed clock in", "forgot to clock in",
    "time clock issues", "how do i clock in", "where do i clock in", "clock out procedure",
    "timesheet correction", "timecard error", "wrong hours logged", "dispute hours",
    
    // EMERGENCY CONTACTS & REPORTING (30 questions)
    "who do i call", "emergency contact", "supervisor phone number", "manager contact",
    "emma's number", "emmas number", "emma phone number", "chris phone number",
    "chris contact", "office phone number", "main office contact", "after hours contact",
    "weekend emergency", "who do i report to", "chain of command", "incident reporting",
    "how do i report incident", "report accident", "report theft", "report vandalism",
    "report suspicious activity", "security breach reporting", "safety concern",
    "report safety issue", "osha complaint", "harassment reporting", "report harassment",
    "discrimination reporting", "hr complaint", "file complaint", "grievance procedure",
    
    // TRAINING & CERTIFICATION (20 questions)
    "training requirements", "mandatory training", "when's training", "whens training",
    "guard card", "security license", "renew guard card", "guard card expired",
    "cpr certification", "first aid training", "aed training", "fire safety training",
    "active shooter training", "de-escalation training", "baton training",
    "pepper spray training", "taser training", "firearm training", "training reimbursement",
    "certification reimbursement", "continuing education",
    
    // MISCELLANEOUS (15 questions)
    "parking at work", "where do i park", "employee parking", "parking pass",
    "gas reimbursement", "mileage reimbursement", "travel expenses", "meal allowance",
    "equipment provided", "what equipment provided", "supply request", "need supplies",
    "order supplies", "performance review", "when's my review", "whens my review",
    
    // SHORTENED/CASUAL VARIATIONS
    "payday?", "when paid", "time off", "call out", "uniform", "benefits", "handbook",
    "who do i call", "break policy", "schedule",
    
    // ORIGINAL GENERAL HELP PHRASES (keeping these too)
    "i don't know what to do", "i dont know what to do", "don't know what to do",
    "dont know what to do", "not sure what to do", "im not sure what to do",
    "i'm not sure what to do", "no idea what to do", "i'm confused", "im confused",
    "confused", "very confused", "really confused", "totally confused", "i'm lost",
    "im lost", "lost", "feel lost", "need help", "i need help", "help me",
    "can you help me", "can someone help", "need some help", "need assistance",
    "what do i do", "what should i do", "what am i supposed to do", "what do i do now",
    "what should i do now", "unsure", "i'm unsure", "im unsure", "not sure",
    "stuck", "i'm stuck", "im stuck", "really stuck", "help", "help!", "help please",
    "i need help please", "can i get help", "what now", "what next", "now what",
    "what's next", "whats next"
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
