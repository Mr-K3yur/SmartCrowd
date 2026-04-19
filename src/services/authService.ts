import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

export const loginOrRegister = async (email: string, pass: string) => {
  try {
    // 1. Attempt to sign in first
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    // 2. If the user doesn't exist (or invalid credentials for a non-existent account), try to auto-register them
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
      try {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        const user = result.user;
        
        // Define role dynamically based on the requested password map
        const role = (pass === 'admin123' || pass === 'stadium8') ? 'admin' : 'guest';
        
        // Save to Database
        try {
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            name: email.split('@')[0], // Give them a default name
            role: role,
            createdAt: serverTimestamp()
          });
        } catch (dbError) {
          handleFirestoreError(dbError, OperationType.CREATE, `users/${user.uid}`);
        }

        return user;
      } catch (registerError: any) {
        throw new Error(registerError.message);
      }
    } else {
      throw new Error(error.message);
    }
  }
};

export const logoutUser = () => {
    return signOut(auth);
};


