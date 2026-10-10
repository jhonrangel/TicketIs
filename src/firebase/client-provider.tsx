'use client';

import { ReactNode, useMemo } from 'react';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/lib/firebase-config';
import { FirebaseProvider } from './provider';

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// Initialize Firebase only once on the client
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
firestore = getFirestore(app);

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => ({
    app,
    auth,
    firestore,
  }), []);

  return (
    <FirebaseProvider value={value}>
      {children}
    </FirebaseProvider>
  );
}
