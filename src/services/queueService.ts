import { collection, doc, updateDoc, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

const QUEUES_COLLECTION = 'queues';

/**
 * Updates queue people count and optionally service rate.
 */
export const updateQueue = async (queueId: string, people: number, service_rate?: number) => {
  try {
    const queueRef = doc(db, QUEUES_COLLECTION, queueId);
    const updateData: any = {
      people,
      updatedAt: serverTimestamp()
    };
    if (service_rate !== undefined) {
      updateData.service_rate = service_rate;
    }
    await updateDoc(queueRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${QUEUES_COLLECTION}/${queueId}`);
  }
};

/**
 * Fetches all queues once.
 */
export const getQueues = async () => {
  try {
    const snapshot = await getDocs(collection(db, QUEUES_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, QUEUES_COLLECTION);
    return [];
  }
};

/**
 * Real-time listener for queue updates.
 */
export const subscribeToQueues = (callback: (queues: any[]) => void) => {
  const unsubscribe = onSnapshot(collection(db, QUEUES_COLLECTION), (snapshot) => {
    const queues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(queues);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, QUEUES_COLLECTION);
  });
  return unsubscribe;
};

