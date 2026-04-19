import { collection, doc, updateDoc, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

const ZONES_COLLECTION = 'zones';

/**
 * Updates the crowd density for a specific zone.
 */
export const updateCrowd = async (zoneId: string, value: number) => {
  try {
    const zoneRef = doc(db, ZONES_COLLECTION, zoneId);
    await updateDoc(zoneRef, {
      crowd: value,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ZONES_COLLECTION}/${zoneId}`);
  }
};

/**
 * Fetches all zones once.
 */
export const getZones = async () => {
  try {
    const snapshot = await getDocs(collection(db, ZONES_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ZONES_COLLECTION);
    return []; // Return empty array so types match 
  }
};

/**
 * Real-time listener for zone updates.
 */
export const subscribeToZones = (callback: (zones: any[]) => void) => {
  const unsubscribe = onSnapshot(collection(db, ZONES_COLLECTION), (snapshot) => {
    const zones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(zones);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, ZONES_COLLECTION);
  });
  return unsubscribe; // Call this function to stop listening when component unmounts
};

/**
 * Simulates random crowd changes in 'gateA' and 'gateB' for demo purposes.
 */
export const simulateCrowdChanges = async () => {
  const gates = ['gateA', 'gateB'];
  const gateToUpdate = gates[Math.floor(Math.random() * gates.length)];
  const randomCrowd = Math.floor(Math.random() * 100);
  console.log(`Simulating crowd change for ${gateToUpdate}: ${randomCrowd}%`);
  await updateCrowd(gateToUpdate, randomCrowd);
};

