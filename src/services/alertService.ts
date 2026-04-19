import { collection, addDoc, getDocs, onSnapshot, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

const ALERTS_COLLECTION = 'alerts';

/**
 * Creates a new broadcast alert.
 */
export const sendAlert = async (message: string, severity: 'info' | 'warning' | 'critical' = 'info') => {
  try {
    await addDoc(collection(db, ALERTS_COLLECTION), {
      message,
      severity,
      timestamp: serverTimestamp() // Set by Firestore backend
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, ALERTS_COLLECTION);
  }
};

/**
 * Fetches recent alerts once.
 */
export const getAlerts = async () => {
  try {
    const q = query(collection(db, ALERTS_COLLECTION), orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ALERTS_COLLECTION);
    return [];
  }
};

/**
 * Real-time listener for alerts.
 */
export const subscribeToAlerts = (callback: (alerts: any[]) => void) => {
  const q = query(collection(db, ALERTS_COLLECTION), orderBy('timestamp', 'desc'), limit(50));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(alerts);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, ALERTS_COLLECTION);
  });
  return unsubscribe;
};

