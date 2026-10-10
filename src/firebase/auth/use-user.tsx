
'use client';
import { useState, useEffect } from 'react';
import { useAuth, useFirestore } from '../use-firebase';
import { type User as FirebaseAuthUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';

export const useUser = () => {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<AppUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
        setIsUserLoading(false);
        return;
    };
    
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser: FirebaseAuthUser | null) => {
      if (firebaseUser) {
        if (!firestore) {
            setUser(null);
            setIsUserLoading(false);
            return;
        }
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ id: docSnap.id, ...docSnap.data() } as AppUser);
          } else {
            setUser(null);
          }
          setIsUserLoading(false);
        }, () => {
            setUser(null);
            setIsUserLoading(false);
        });
        return () => unsubscribeFirestore();
      } else {
        setUser(null);
        setIsUserLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth, firestore]);

  return { user, isUserLoading };
};
