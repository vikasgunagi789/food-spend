import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let auth = null;
let db = null;

const hasFirebaseConfig =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.authDomain) &&
  Boolean(firebaseConfig.projectId) &&
  Boolean(firebaseConfig.appId);

if (hasFirebaseConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    console.log("VGlytics: Firebase initialized successfully.");
  } catch (error) {
    console.error("VGlytics: Firebase initialization failed.", error);
    app = null;
    auth = null;
    db = null;
  }
} else {
  console.warn(
    "VGlytics: Firebase configuration is missing. Running in local-only mode."
  );
}

export { app, auth, db };