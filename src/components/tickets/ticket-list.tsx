'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

type TicketStatus = 'Abierto' | 'En Progreso' | 'Cerrado';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

interface TicketListProps {
  tickets: Ticket[];
}

const statusVariant: Record<TicketStatus, 'default' | 'secondary' | 'outline'> = {
  'Abierto': 'default',
  'En Progreso': 'secondary',
  'Cerrado': 'outline'
};


export function TicketList({ tickets }: TicketListProps) {
  const router = useRouter();
  const sortedTickets = [...tickets].sort(
    (a, b) => b.createdAt.seconds - a.createdAt.seconds
  );

  const handleViewDetails = (ticketId: string) => {
    router.push(`/dashboard/tickets/${ticketId}`);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sortedTickets.map((ticket) => (
        <Card key={ticket.id} className="flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg leading-tight pr-4">{ticket.title}</CardTitle>
               <Badge variant={statusVariant[ticket.status]}>{ticket.status}</Badge>
            </div>
            <CardDescription>
                {format(new Date(ticket.createdAt.seconds * 1000), "dd 'de' MMMM, yyyy", { locale: es })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-3">{ticket.description}</p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleViewDetails(ticket.id)}
            >
              Ver Detalles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
