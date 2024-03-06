// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAoFyTw7LETvDaFp389CS29VPKmSsE8uZw",
  authDomain: "building-planner-97ca3.firebaseapp.com",
  projectId: "building-planner-97ca3",
  storageBucket: "building-planner-97ca3.appspot.com",
  messagingSenderId: "546583952849",
  appId: "1:546583952849:web:1a7e33cb6904b8aa0434f0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
