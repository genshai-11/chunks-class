import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBrH0sAU__R4k1IBrSYIF73fFdASeSpdE4",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "chunks-voicecloning-genshai.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "chunks-voicecloning-genshai",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "chunks-voicecloning-genshai.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "284566312743",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:284566312743:web:5684ad42-756a-4f59-89ea-08fa00d7a832"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  console.log("Connecting to Firestore for project:", firebaseConfig.projectId);

  // 1. Check lesson document for Day 8 E-commerce: level_b_eres_day_8
  try {
    const docRef = doc(db, "lessons", "level_b_eres_day_8");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      console.log("Found in Firestore 'lessons/level_b_eres_day_8':", data.title || data.lesson_title);
      console.log("Total chunks:", data.chunks?.length);
      console.log("Sample chunks (first 5):", JSON.stringify(data.chunks?.slice(0, 5), null, 2));
    } else {
      console.log("Document 'lessons/level_b_eres_day_8' not found in Firestore!");
    }
  } catch (err: any) {
    console.error("Error reading lesson doc:", err.message);
  }

  // 2. Query all lessons containing 'commerce' or 'ecommerce' or 'retail'
  try {
    const lessonsRef = collection(db, "lessons");
    const allSnaps = await getDocs(lessonsRef);
    console.log(`Total lessons in collection: ${allSnaps.size}`);
    allSnaps.forEach(d => {
      const data = d.data();
      const title = (data.title || data.lesson_title || "").toLowerCase();
      if (title.includes("commerce") || title.includes("retail") || title.includes("market") || d.id.includes("day_8")) {
        console.log(`- ID: ${d.id}, Title: ${data.title || data.lesson_title}, Chunks: ${data.chunks?.length}`);
      }
    });
  } catch (err: any) {
    console.error("Error listing lessons:", err.message);
  }
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
