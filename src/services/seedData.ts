import { collection, doc, setDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

/**
 * Inserts dummy data on first load.
 */
export const seedInitialData = async () => {
  try {
    const zonesSnapshot = await getDocs(collection(db, 'zones'));
    if (!zonesSnapshot.empty) {
      console.log('Seed: Data already exists, skipping.');
      return; 
    }

    console.log('Seed: Starting initial data insertion...');

    // Dummy zones
    const zones = [
        { id: "gateA", name: "Gate A", crowd: 75 },
        { id: "gateB", name: "Gate B", crowd: 30 },
        { id: "sector1", name: "Sector 1 Seating", crowd: 85 },
        { id: "sector2", name: "Sector 2 Seating", crowd: 45 },
    ];

    for (const z of zones) {
        await setDoc(doc(db, 'zones', z.id), {
            name: z.name,
            crowd: z.crowd,
            updatedAt: serverTimestamp()
        });
    }

    // Dummy queues
    const queues = [
        { id: "food1", name: "Food Stall 1", people: 20, service_rate: 2 },
        { id: "bathroomN", name: "North Restrooms", people: 5, service_rate: 5 },
        { id: "merch1", name: "Merch Stand", people: 12, service_rate: 1 },
    ];

    for (const q of queues) {
        await setDoc(doc(db, 'queues', q.id), {
            name: q.name,
            people: q.people,
            service_rate: q.service_rate,
            updatedAt: serverTimestamp()
        });
    }

    // Dummy alert
    await setDoc(doc(db, 'alerts', 'dummyAlert1'), {
        message: "Welcome to SmartCrowd Lite!",
        severity: "info",
        timestamp: serverTimestamp()
    });

    console.log("Seed: Dummy data injected successfully!");
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seedData');
  }
};

