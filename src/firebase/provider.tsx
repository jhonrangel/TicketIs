'use client';
import { createContext, ReactNode, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

export const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  firestore: null,
});

export function FirebaseProvider({ children, value }: { children: ReactNode, value: FirebaseContextType }) {
  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebaseContext() {
  const context = useContext(FirebaseContext);
  if (context === null) {
    throw new Error('useFirebaseContext must be used within a FirebaseProvider');
  }
  return context;
}
