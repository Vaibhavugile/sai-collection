import { initializeApp } from "firebase/app";
import {
  getFirestore,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDEAyTdaIcyT0hBRs0zVjXPA5CZsbwaAkU",
  authDomain: "retailpos1.firebaseapp.com",
  projectId: "retailpos1",
  storageBucket: "retailpos1.firebasestorage.app",
  messagingSenderId: "882540666174",
  appId: "1:882540666174:web:b2d9af7eb47482ecdd206f",
  measurementId: "G-EP6MVKN0NW"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };