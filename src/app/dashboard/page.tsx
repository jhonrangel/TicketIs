'use client';

import { CreateTicketDialog } from '@/components/tickets/create-ticket-dialog';
import type { TicketData, RootCauseData, User } from '@/lib/types';
import { AdminTicketList } from '@/components/admin/admin-ticket-list';
import { Skeleton } from '@/components/ui/skeleton';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useUser } from '@/firebase';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const { data: tickets, loading: isLoadingTickets } = useCollection<TicketData>('tickets');
  const { data: users, loading: isLoadingUsers } = useCollection<User>('users');
  const { data: rootCauses, loading: isLoadingRootCauses } = useCollection<RootCauseData>('rootCauses');
  
  const isLoading = isLoadingTickets || isLoadingUsers || isLoadingRootCauses;


  const handleTicketCreated = async (newTicketData: Omit<TicketData, 'id' | 'status' | 'createdAt'>) => {
    if (!firestore) return;
    const ticketsCollection = collection(firestore, 'tickets');
    await addDoc(ticketsCollection, {
      ...newTicketData,
      status: 'Abierto',
      createdAt: serverTimestamp(),
    });
  };

  const renderListView = () => {
    if (isLoading) {
      return <div className="mt-6 space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>;
    }
    
    return <AdminTicketList 
                tickets={tickets || []}
                users={users || []} 
                rootCauses={rootCauses || []}
            />;
  };

  return (
    <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bandeja de Tickets</h1>
          <p className="text-muted-foreground">
            Gestiona y filtra todos tus tickets de soporte.
          </p>
        </div>
        <CreateTicketDialog onTicketCreated={handleTicketCreated} />
      </div>
      <div className="mt-6">
        {renderListView()}
      </div>
    </main>
  );
}
