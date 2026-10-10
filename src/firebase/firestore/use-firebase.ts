'use client';
import { useFirebaseContext } from '../provider';

// This hook gets the instances from the context
export function useFirebase() {
  return useFirebaseContext();
}

export function useFirestore() {
  const context = useFirebaseContext();
  if (!context.firestore) {
    throw new Error('Firestore not initialized');
  }
  return context.firestore;
}
