import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBK1pGn7JyMIDlCcUxttye917HMXIo5gW8",
    authDomain: "lifemeeting-3f44d.firebaseapp.com",
    projectId: "lifemeeting-3f44d",
    storageBucket: "lifemeeting-3f44d.firebasestorage.app",
    messagingSenderId: "294858819038",
    appId: "1:294858819038:web:c3c74c6ebf32368e09494f",
    measurementId: "G-29S9T0VJYG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
