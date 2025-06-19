// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyD62J-dJJv8ghFJCmxpVMle1XdN4sz1jP4",
    authDomain: "rpl-ai-693f9.firebaseapp.com",
    projectId: "rpl-ai-693f9",
    storageBucket: "rpl-ai-693f9.firebasestorage.app",
    messagingSenderId: "753062865903",
    appId: "1:753062865903:web:e1c0afeac1d8047824a41a",
    measurementId: "G-HDCSVNX5X9"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);