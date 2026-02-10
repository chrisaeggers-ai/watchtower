// Fruitvale NVR/DW Login/Access SOP
// Extracted from PDF - 10 steps to fix camera system
// Each step includes an image to send to guards via MMS

const FRUITVALE_NVR_SOP = {
  title: "Fruitvale NVR/DW Camera System Troubleshooting",
  site: "Fruitvale",
  steps: [
    {
      stepNumber: 1,
      instruction: "Go to the IT room door next to the fire alarm panel.",
      userFriendly: "First, head to the IT room. It's the door right next to the fire alarm panel. I'm sending you a picture of what it looks like.",
      waitForConfirmation: true,
      image: "step1.jpg",
      imageDescription: "IT room door next to fire alarm panel"
    },
    {
      stepNumber: 2,
      instruction: "Enter code 1078 on the padlock to unlock the door.",
      userFriendly: "Now enter the code **1078** on the padlock to unlock the door. Here's a picture of the lock. Text me when you're inside.",
      waitForConfirmation: true,
      image: "step2.jpg",
      imageDescription: "Padlock showing code 1078",
      details: {
        code: "1078"
      }
    },
    {
      stepNumber: 3,
      instruction: "Disconnect HDMI cable (1) from NVR and connect HDMI cable (2) to bring up NVR display on small monitor in IT room.",
      userFriendly: "Look for 2 HDMI cables near the NVR (see picture). Disconnect cable #1 and connect cable #2 to show the display on the small monitor. Done?",
      waitForConfirmation: true,
      image: "step3.jpg",
      imageDescription: "HDMI cables labeled 1 and 2",
      details: {
        note: "There are 2 HDMI cables - one for guard shack TV, one for IT room monitor"
      }
    },
    {
      stepNumber: 4,
      instruction: "Connect the mouse and keyboard cables to the USB ports on the NVR.",
      userFriendly: "Now plug in the mouse and keyboard cables into the USB ports on the NVR. Here's where they go. Ready?",
      waitForConfirmation: true,
      image: "step4.jpg",
      imageDescription: "USB ports on NVR for mouse and keyboard"
    },
    {
      stepNumber: 5,
      instruction: "Click on 'DW' on the left side of the screen.",
      userFriendly: "You should see the screen now. Click on **'DW'** on the left side (see picture). Let me know when you've done that.",
      waitForConfirmation: true,
      image: "step5.jpg",
      imageDescription: "DW icon on left side of screen"
    },
    {
      stepNumber: 6,
      instruction: "Click on 'OiFunds Fruitvale' to connect to the server.",
      userFriendly: "Now click on **'OiFunds Fruitvale'** to connect to the server (shown in picture). Text me once it connects.",
      waitForConfirmation: true,
      image: "step6.jpg",
      imageDescription: "OiFunds Fruitvale connection button"
    },
    {
      stepNumber: 7,
      instruction: "If server doesn't accept 'OiFunds', use manual connection: Click 'Connect to Server', enter User: admin, Password: admin12345, click OK.",
      userFriendly: "If the server doesn't connect automatically, do this (see picture):\n\n1. Click 'Connect to Server'\n2. Username: **admin**\n3. Password: **admin12345**\n4. Click OK\n\nDid it connect?",
      waitForConfirmation: true,
      image: "step7.jpg",
      imageDescription: "Connect to Server dialog with login fields",
      details: {
        username: "admin",
        password: "admin12345",
        note: "Alternative connection method if OiFunds doesn't work"
      }
    },
    {
      stepNumber: 8,
      instruction: "If cameras don't automatically show up, click dropdown arrow next to 'New Layout 1' and select 'Guard View'.",
      userFriendly: "If the cameras aren't showing yet, click the dropdown arrow next to 'New Layout 1' at the top and select **'Guard View'** (see picture). See the cameras now?",
      waitForConfirmation: true,
      image: "step8.jpg",
      imageDescription: "Dropdown menu showing Guard View selection"
    },
    {
      stepNumber: 9,
      instruction: "Alternative: Click side arrow on left to open camera panel, scroll to 'Guard View' and double-click it.",
      userFriendly: "Still not showing? Try this: Click the side arrow on the left (shown in picture), scroll down to **'Guard View'** and double-click it. Cameras up?",
      waitForConfirmation: true,
      image: "step9.jpg",
      imageDescription: "Side panel with Guard View option",
      details: {
        note: "Alternative method to bring up camera view"
      }
    },
    {
      stepNumber: 10,
      instruction: "IMPORTANT: Disconnect HDMI cable and mouse/keyboard, then reconnect the original HDMI cable to make cameras show on guard shack TV.",
      userFriendly: "Excellent! Final step (this is important!): **Disconnect the HDMI cable and mouse/keyboard**, then **reconnect the original HDMI cable** so the cameras show back up on the TV in the guard shack. Here's what it should look like when done. Text me when finished.",
      waitForConfirmation: true,
      image: "step10.jpg",
      imageDescription: "Final camera grid view on screen",
      details: {
        note: "CRITICAL - Must switch HDMI back to guard shack TV"
      }
    }
  ],
  
  // Trigger phrases that indicate camera issues
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

module.exports = { FRUITVALE_NVR_SOP };
