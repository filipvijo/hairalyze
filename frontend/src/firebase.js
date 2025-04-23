import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyClxY19hVlfNFw9X46mlJ7JOOKM-0Ea3i8",
    authDomain: "hairalyze-app.firebaseapp.com",
    projectId: "hairalyze-app",
    storageBucket: "hairalyze-app.firebasestorage.app",
    messagingSenderId: "1057533273049",
    appId: "1:1057533273049:web:ca0afaaf6c070af1acafc8",
    measurementId: "G-B3CFSFYG4H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Export auth to be used in other parts of the application
export { auth };
