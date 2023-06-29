import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { doc, getDoc, getFirestore } from "firebase/firestore";


const firebaseConfig = {
    apiKey: "AIzaSyDkMH9hI5XWtowNXV7y4GiXePBBMJFA8vg",
    authDomain: "evcon-app.firebaseapp.com",
    projectId: "evcon-app",
    storageBucket: "evcon-app.appspot.com",
    messagingSenderId: "488133362511",
    appId: "1:488133362511:web:a7ccd019533e36ca9c3b3a",
    measurementId: "G-9K83450XQC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const db = getFirestore(app);

export async function getSeason(countryCode, leagueID, season){
    const docRef = doc(db, "countries/" + countryCode + "/leagues/" + leagueID + "/seasons", season);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        console.log("Document data:", docSnap.data());
    } else {
        console.log("No such document!");
    }
    
    return docSnap.data();
    
}


export async function getIndex(){
    const docRef = doc(db, "index", "latest");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        console.log("Document data:", docSnap.data());
    } else {
        console.log("No such document!");
    }
    
    return docSnap.data();
    
}