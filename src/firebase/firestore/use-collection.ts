
'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, type Query, type DocumentData } from 'firebase/firestore';
import { useFirestore } from '../use-firebase';

interface UseCollectionOptions {
  q?: Query;
}

export function useCollection<T extends DocumentData>(
  collectionName: string,
  options?: UseCollectionOptions
) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore) return;

    let unsubscribe: () => void;
    try {
      const collRef = collection(firestore, collectionName);
      const q = options?.q || collRef;

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as T));
          setData(docs);
          setLoading(false);
        },
        (err) => {
          setError(err);
          setLoading(false);
        }
      );
    } catch (e: any) {
      setError(e);
      setLoading(false);
    }

    return () => unsubscribe?.();
  }, [firestore, collectionName, options?.q]);

  return { data, loading, error };
}
