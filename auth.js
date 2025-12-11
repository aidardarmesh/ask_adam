// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyD5MhROo9Kg2aa5rrjQoEEZNsUEkX5IRKo",
    authDomain: "adam-ask.firebaseapp.com",
    projectId: "adam-ask",
    storageBucket: "adam-ask.firebasestorage.app",
    messagingSenderId: "105320144052",
    appId: "1:105320144052:web:d3a25d3a01a9060c2f0be1",
    measurementId: "G-LZEQM46G0P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);