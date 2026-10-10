'use client';

import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CircleDashed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { TicketData } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDoc } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { DynamicTime } from '@/components/tickets/dynamic-time';
import { Separator } from '@/components/ui/separator';

export default function TicketDetailsPage() {
  const { ticketId } = useParams();
  const { data: ticket, loading } = useDoc<TicketData>(`tickets/${ticketId}`);

  const renderContent = () => {
    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                 <Separator />
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-5 w-2/3" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-5 w-2/3" />
                    </div>
                </div>
            </div>
        );
    }
    if (!ticket) {
        return (
             <div className="flex flex-col items-center justify-center text-center p-8 text-sm text-muted-foreground">
                <CircleDashed className="h-10 w-10 mb-4" />
                <h3 className="font-semibold">Ticket no encontrado</h3>
                <p>No se pudo cargar el ticket con ID: {ticketId}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Descripción</h3>
                <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Bodega</p>
                    <p className="font-semibold">{ticket.bodega}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Cuenta</p>
                    <p className="font-semibold">{ticket.cuenta}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Sistema</p>
                    <p className="font-semibold">{ticket.sistema}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Reportado por</p>
                    <p className="font-semibold">{ticket.creatorName} ({ticket.creatorRole})</p>
                </div>
            </div>
             
             {ticket.status === 'Cerrado' && (
                <>
                    <Separator />
                     <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Resolución</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                             <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Cerrado por</p>
                                <p className="font-semibold">{ticket.closedBy}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Fecha de cierre</p>
                                {ticket.closedAt && <DynamicTime date={new Date(ticket.closedAt.seconds * 1000)} mode="format" />}
                            </div>
                             <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Causa Raíz</p>
                                <p className="font-semibold">{ticket.rootCause}</p>
                            </div>
                              <div className="space-y-1 col-span-2">
                                <p className="text-sm font-medium text-muted-foreground">Comentario de cierre</p>
                                <p className="text-sm whitespace-pre-wrap">{ticket.closingComment}</p>
                            </div>
                        </div>
                    </div>
                </>
             )}
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1 bg-muted/40 p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4">
            <Button variant="outline" asChild>
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a la bandeja
                </Link>
            </Button>
          </div>
          <Card className="max-h-[calc(100vh-10rem)]">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-2xl">{loading ? <Skeleton className="h-8 w-64" /> : ticket?.title}</CardTitle>
                    <CardDescription className="mt-1">
                        {loading ? <Skeleton className="h-4 w-48" /> : `ID: ${ticketId}`}
                    </CardDescription>
                </div>
                {ticket && <Badge variant={ticket.status === 'Cerrado' ? 'outline' : 'default'}>{ticket.status}</Badge>}
              </div>
            </CardHeader>
            <ScrollArea className="h-[calc(100vh-22rem)]">
                <CardContent className="pr-6">
                    {renderContent()}
                </CardContent>
            </ScrollArea>
          </Card>
        </div>
      </main>
    </div>
  );
}
