'use client';
import { useAuth, useFirestore } from '../use-firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut as firebaseSignOut,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    deleteUser as firebaseDeleteUser,
} from 'firebase/auth';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    setDoc, 
    serverTimestamp,
    deleteDoc 
} from 'firebase/firestore';
import { UserRole } from '@/lib/types';
import { useUser } from './use-user';

export function useAuthActions() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();

  const createUser = async (email: string, pass: string, displayName: string, role: UserRole) => {
    if (!auth || !firestore) throw new Error('Firebase not initialized');

    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('displayName', '==', displayName));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error(`El nombre de usuario "${displayName}" ya está en uso.`);
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, {
            id: user.uid,
            displayName,
            email,
            role,
            createdAt: serverTimestamp(),
            photoURL: user.photoURL || '',
        });
    }

    return user;
  };

  const signInWithUsername = async (username: string, pass:string) => {
      if (!auth || !firestore) throw new Error('Firebase not initialized');

      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('displayName', '==', username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('El nombre de usuario no existe.');
      }
      
      const userDoc = querySnapshot.docs[0].data();
      const email = userDoc.email;

      if (!email) {
        throw new Error('El usuario no tiene un email asociado.');
      }

      return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signOut = async () => {
    if (!auth) throw new Error('Firebase not initialized');
    await firebaseSignOut(auth);
  };

  const reauthenticateAndChangePassword = async (currentPass: string, newPass: string) => {
    if (!auth || !auth.currentUser || !auth.currentUser.email) throw new Error('Usuario no autenticado.');

    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPass);

    await reauthenticateWithCredential(auth.currentUser!, credential);
    await updatePassword(auth.currentUser!, newPass);
  }

  const deleteUser = async (userId: string) => {
     if (!auth || !firestore) throw new Error('Firebase not initialized');
     
     // Esta implementación solo elimina el documento de Firestore.
     // La eliminación completa del usuario de Firebase Auth requeriría un backend (Cloud Function)
     // por razones de seguridad.
     const userDocRef = doc(firestore, 'users', userId);
     await deleteDoc(userDocRef);
  }

  return { createUser, signInWithUsername, signOut, reauthenticateAndChangePassword, deleteUser };
}
