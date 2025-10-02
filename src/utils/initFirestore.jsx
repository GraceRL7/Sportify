// src/utils/initFirestore.js
import { db, appId } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

export const initFirestore = async () => {
  try {
    // trial_results collection
    const trialResultsRef = doc(
      collection(db, `artifacts/${appId}/public/data/trial_results`)
    );
    await setDoc(trialResultsRef, { init: true }, { merge: true });

    // schedules collection
    const schedulesRef = doc(
      collection(db, `artifacts/${appId}/public/data/schedules`)
    );
    await setDoc(schedulesRef, { init: true }, { merge: true });

    // players collection
    const playersRef = doc(
      collection(db, `artifacts/${appId}/public/data/players`)
    );
    await setDoc(playersRef, { init: true }, { merge: true });

    console.log("✅ Firestore base structure initialized");
  } catch (error) {
    console.error("❌ Error initializing Firestore:", error);
  }
};
