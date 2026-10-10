'use client';
import { LoginDialog } from '@/components/auth/login-dialog';
import { CreateTicketDialog } from '@/components/tickets/create-ticket-dialog';
import type { TicketData } from '@/lib/types';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';


export default function RootPage() {
  const firestore = useFirestore();

  const handleTicketCreated = async (newTicketData: Omit<TicketData, 'id' | 'status' | 'createdAt'>) => {
    if (!firestore) return;
    const ticketsCollection = collection(firestore, 'tickets');
    await addDoc(ticketsCollection, {
      ...newTicketData,
      status: 'Abierto',
      createdAt: serverTimestamp(),
    });
  };

  return (
      <div className="flex min-h-screen w-full flex-col bg-background animated-bg">
        <header className="absolute top-0 right-0 p-4 z-20">
          <LoginDialog />
        </header>

        <main className="flex flex-1 items-center justify-center">
          <div className="relative z-10 flex flex-col items-center space-y-8 text-center">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Portal de Soporte TicketIS
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                ¿Tienes una incidencia? Crea un ticket y nuestro equipo de soporte te ayudará a la brevedad.
              </p>
            </div>
            <CreateTicketDialog onTicketCreated={handleTicketCreated} isPublicForm={true} />
          </div>
        </main>

        <footer className="relative z-10 py-4 text-center text-sm text-muted-foreground">
          <p>Creado por Jhon Rangel (Jhon.rangel@kuehne-nagel.com)</p>
        </footer>
      </div>
  );
}
