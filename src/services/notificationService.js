// =====================================================
// VGlytics Notification Service
// =====================================================

const REMINDER_ENABLED_KEY =
  "vglytics_food_reminder_enabled";

const REMINDER_SUBSCRIPTION_KEY =
  "vglytics_push_subscription";

// =====================================================
// CHECK SUPPORT
// =====================================================

function isNotificationSupported() {
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

// =====================================================
// CONVERT VAPID KEY
// =====================================================

function urlBase64ToUint8Array(base64String) {
  const padding =
    "=".repeat(
      (4 - (base64String.length % 4)) % 4
    );

  const base64 = (
    base64String +
    padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map(
      (char) => char.charCodeAt(0)
    )
  );
}

// =====================================================
// REGISTER SERVICE WORKER
// =====================================================

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    throw new Error(
      "Service workers are not supported in this browser."
    );
  }

  const registration =
    await navigator.serviceWorker.register(
      "/sw.js"
    );

  await navigator.serviceWorker.ready;

  return registration;
}

// =====================================================
// GET SAVED SUBSCRIPTION
// =====================================================

function getSavedSubscription() {
  try {
    const saved =
      localStorage.getItem(
        REMINDER_SUBSCRIPTION_KEY
      );

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);
  } catch {
    return null;
  }
}

// =====================================================
// SAVE SUBSCRIPTION
// =====================================================

function saveSubscription(subscription) {
  try {
    localStorage.setItem(
      REMINDER_SUBSCRIPTION_KEY,
      JSON.stringify(subscription)
    );

    return true;
  } catch {
    return false;
  }
}

// =====================================================
// ENABLE FOOD REMINDER
// =====================================================

export async function setupDailyFoodReminder(
  vapidPublicKey
) {
  if (!isNotificationSupported()) {
    throw new Error(
      "Push notifications are not supported in this browser."
    );
  }

  if (!vapidPublicKey) {
    throw new Error(
      "VAPID public key is missing."
    );
  }

  // Request permission
  let permission =
    Notification.permission;

  if (permission !== "granted") {
    permission =
      await Notification.requestPermission();
  }

  if (permission !== "granted") {
    throw new Error(
      "Notification permission was not granted."
    );
  }

  // Register service worker
  const registration =
    await registerServiceWorker();

  // Check existing subscription
  let subscription =
    await registration.pushManager.getSubscription();

  // Create subscription if needed
  if (!subscription) {
    const applicationServerKey =
      urlBase64ToUint8Array(
        vapidPublicKey
      );

    subscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
  }

  const subscriptionJSON =
    subscription.toJSON();

  saveSubscription(
    subscriptionJSON
  );

  localStorage.setItem(
    REMINDER_ENABLED_KEY,
    "true"
  );

  console.log(
    "VGlytics push subscription:",
    subscriptionJSON
  );

  return subscriptionJSON;
}

// =====================================================
// COMPATIBILITY NAME USED BY SETTINGS
// =====================================================

export async function enableFoodReminder(
  vapidPublicKey
) {
  return setupDailyFoodReminder(
    vapidPublicKey
  );
}

// =====================================================
// DISABLE FOOD REMINDER
// =====================================================

export async function disableFoodReminder() {
  try {
    if (
      "serviceWorker" in navigator
    ) {
      const registration =
        await navigator.serviceWorker.ready;

      const subscription =
        await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }
    }
  } catch (error) {
    console.warn(
      "Unable to unsubscribe push:",
      error
    );
  }

  localStorage.removeItem(
    REMINDER_ENABLED_KEY
  );

  localStorage.removeItem(
    REMINDER_SUBSCRIPTION_KEY
  );

  return true;
}

// =====================================================
// CHECK STATUS
// =====================================================

export function isFoodReminderEnabled() {
  try {
    return (
      localStorage.getItem(
        REMINDER_ENABLED_KEY
      ) === "true"
    );
  } catch {
    return false;
  }
}

// =====================================================
// GET SUBSCRIPTION
// =====================================================

export function getFoodReminderSubscription() {
  return getSavedSubscription();
}