/**
 * Mobile Haptic Feedback Helper
 * Uses the Web Vibration API for tactile response on mobile browsers
 * (Chris Raroque Design Secret: Haptic physical grounding)
 */

export function triggerHaptic(type: "light" | "medium" | "success" | "warning" | "selection" = "light") {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;

  try {
    switch (type) {
      case "selection":
        navigator.vibrate(5);
        break;
      case "light":
        navigator.vibrate(8);
        break;
      case "medium":
        navigator.vibrate(18);
        break;
      case "success":
        navigator.vibrate([10, 30, 15]);
        break;
      case "warning":
        navigator.vibrate([25, 50, 25]);
        break;
    }
  } catch {
    // Graceful fallback for devices that restrict vibration without user gesture
  }
}
