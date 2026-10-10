
'use client';
import { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { MoreHorizontal, User, CircleDashed, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TicketData, User as AdminUser, RootCauseData } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CloseTicketDialog } from '../tickets/close-ticket-dialog';
import { useRouter } from 'next/navigation';
import { 
    Column,
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnFiltersState,
} from '@tanstack/react-table';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DynamicTime } from '../tickets/dynamic-time';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp, addDoc, collection, deleteDoc } from 'firebase/firestore';


type TicketStatus = 'Abierto' | 'En Progreso' | 'Cerrado';
const ALL_STATUSES: TicketStatus[] = ['Abierto', 'En Progreso', 'Cerrado'];


interface AdminTicketListProps {
  tickets: TicketData[];
  users: AdminUser[];
  rootCauses: RootCauseData[];
}

const statusVariant: Record<TicketStatus, 'destructive' | 'secondary' | 'default'> = {
  Abierto: 'destructive',
  'En Progreso': 'secondary',
  Cerrado: 'default',
};

function TicketActions({ 
    ticket, 
    currentUser, 
    adminUsers, 
    onAssign, 
    onStatusChange, 
    onDelete 
}: { 
    ticket: TicketData, 
    currentUser: AdminUser | null,
    adminUsers: AdminUser[],
    onAssign: (ticketId: string, assignee: string) => void,
    onStatusChange: (ticketId: string, status: TicketStatus) => void,
    onDelete: (ticketId: string) => void,
}) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    if (!currentUser) {
        return null;
    }
    
    return (
        <>
            <div className="text-right" onClick={e => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {currentUser?.role === 'admin' && (
                            <>
                                <DropdownMenuItem onClick={() => onAssign(ticket.id, currentUser!.displayName || 'Admin')}>Asignarme</DropdownMenuItem>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>Asignar a</DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        {adminUsers.map(user => (
                                            <DropdownMenuItem key={user.id} onClick={() => onAssign(ticket.id, user.displayName)}>
                                                {user.displayName}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        {ALL_STATUSES.map((status) => (
                            <DropdownMenuItem
                                key={status}
                                onClick={() => onStatusChange(ticket.id, status)}
                                disabled={ticket.status === status}
                            >
                                Marcar como {status}
                            </DropdownMenuItem>
                        ))}
                         {currentUser.role === 'admin' && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar Ticket
                                </DropdownMenuItem>
                            </>
                         )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de eliminar este ticket?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el ticket "{ticket.title}" ({ticket.id}).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className={cn(buttonVariants({ variant: 'destructive' }))}
                            onClick={() => {
                                onDelete(ticket.id);
                                setShowDeleteConfirm(false);
                            }}
                        >
                            Confirmar Eliminación
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export function AdminTicketList({ tickets, users, rootCauses }: AdminTicketListProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  
  const [ticketToClose, setTicketToClose] = useState<TicketData | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const adminUsers = useMemo(() => {
    if (currentUser?.role === 'admin') {
      return users.filter((u) => u.role === 'admin');
    }
    return [];
  }, [users, currentUser]);
  
  const updateTicket = async (ticketId: string, data: Partial<TicketData>) => {
    if (!firestore) return;
    const ticketRef = doc(firestore, 'tickets', ticketId);
    await updateDoc(ticketRef, data);
  };

  const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
    if (newStatus === 'Cerrado') {
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) setTicketToClose(ticket);
    } else {
        updateTicket(ticketId, { status: newStatus });
        toast({
            title: 'Ticket Actualizado',
            description: `El estado del ticket ha sido cambiado a "${newStatus}".`,
        });
    }
  };

  const handleAssignTicket = (ticketId: string, assignee: string) => {
    updateTicket(ticketId, { assignee });
    toast({
        title: 'Ticket Asignado',
        description: `El ticket ha sido asignado a ${assignee}.`,
    });
  };
  
  const handleCloseTicketSubmit = async (values: { comment: string; rootCause: string; newRootCause?: string }) => {
    if (!ticketToClose || !currentUser || !firestore) return;
    
    let finalRootCause = values.rootCause;
    if (values.rootCause === 'new' && values.newRootCause) {
        finalRootCause = values.newRootCause;
        const rootCausesCollection = collection(firestore, 'rootCauses');
        await addDoc(rootCausesCollection, {
            name: finalRootCause,
            createdBy: currentUser.displayName,
        });
    }
    
    await updateTicket(ticketToClose.id, { 
        status: 'Cerrado',
        closingComment: values.comment,
        rootCause: finalRootCause,
        closedBy: currentUser.displayName,
        closedAt: serverTimestamp(),
    });

    toast({
      title: 'Ticket Cerrado',
      description: `El ticket "${ticketToClose.title}" ha sido cerrado.`,
    });
    setTicketToClose(null);
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, 'tickets', ticketId));
    toast({
      title: 'Ticket Eliminado',
      description: `El ticket ${ticketId} ha sido eliminado permanentemente.`,
      variant: 'destructive',
    });
  }
  
    const columns = useMemo<ColumnDef<TicketData>[]>(() => [
        { accessorKey: 'id', header: 'ID de Ticket', cell: ({row}) => <div className="font-mono text-xs w-24 truncate">{row.original.id}</div>, enableColumnFilter: false },
        {
            accessorKey: 'title',
            header: ({ column }) => <ColumnHeader column={column} title="Título" />,
            cell: ({row}) => <div className="w-48 truncate">{row.original.title}</div>
        },
        {
            accessorKey: 'status',
            header: ({ column }) => <ColumnHeader column={column} title="Estado" options={['Abierto', 'En Progreso', 'Cerrado']} />,
            cell: ({row}) => <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge>,
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            accessorKey: 'assignee',
            header: ({ column }) => <ColumnHeader column={column} title="Asignado a" options={Array.from(new Set(tickets.map(t => t.assignee).filter(Boolean))) as string[]} />,
            cell: ({row}) => row.original.assignee ? (
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">{row.original.assignee}</span></div>
              ) : ( <span className="text-xs text-muted-foreground">Sin asignar</span> ),
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            accessorKey: 'rootCause',
            header: ({ column }) => <ColumnHeader column={column} title="Causa Raíz" options={Array.from(new Set(tickets.map(t => t.rootCause).filter(Boolean))) as string[]} />,
            cell: ({row}) => row.original.rootCause ? <Badge variant="outline">{row.original.rootCause}</Badge> : <span className="text-xs text-muted-foreground">N/A</span>,
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            accessorKey: 'creatorName',
            header: ({ column }) => <ColumnHeader column={column} title="Reportado por" options={Array.from(new Set(tickets.map(t => t.creatorName)))} />,
            cell: ({row}) => (
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                    <div className="flex flex-col"><span className="font-medium">{row.original.creatorName}</span><span className="text-xs text-muted-foreground">{row.original.creatorRole}</span></div>
                </TooltipTrigger><TooltipContent><p>{row.original.creatorEmail}</p></TooltipContent></Tooltip></TooltipProvider>
            ),
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            accessorKey: 'bodega',
            header: ({ column }) => <ColumnHeader column={column} title="Bodega" options={Array.from(new Set(tickets.map(t => t.bodega)))} />,
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        { accessorKey: 'createdAt', header: 'Fecha de Creación', cell: ({row}) => <DynamicTime date={new Date(row.original.createdAt.seconds * 1000)} mode="format" />, enableColumnFilter: false },
        {
            id: 'tiempoActivo',
            header: 'Tiempo Activo',
            cell: ({ row }) => {
              const ticket = row.original;
              return ticket.status !== 'Cerrado' ? (
                <DynamicTime date={new Date(ticket.createdAt.seconds * 1000)} mode="distance_to_now" />
              ) : (
                <span className="text-xs text-muted-foreground">N/A</span>
              );
            },
            enableColumnFilter: false,
        },
        {
            id: 'tiempoResolucion',
            header: 'Tiempo de Resolución',
            cell: ({ row }) => {
              const ticket = row.original;
              return ticket.status === 'Cerrado' && ticket.closedAt ? (
                 <DynamicTime date={new Date(ticket.closedAt.seconds * 1000)} baseDate={new Date(ticket.createdAt.seconds * 1000)} mode="distance" />
              ) : (
                <span className="text-xs text-muted-foreground">N/A</span>
              );
            },
            enableColumnFilter: false,
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Acciones</div>,
            cell: ({ row }) => (
                <TicketActions
                    ticket={row.original}
                    currentUser={currentUser}
                    adminUsers={adminUsers}
                    onAssign={handleAssignTicket}
                    onStatusChange={handleStatusChange}
                    on onDelete={handleDeleteTicket}
                />
            ),
            enableColumnFilter: false,
        },
    ], [tickets, users, currentUser, adminUsers, rootCauses, firestore]);

    const table = useReactTable({
        data: tickets,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnFiltersChange: setColumnFilters,
        columnResizeMode: 'onChange',
        state: {
            columnFilters,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            }
        }
    });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
          <Table style={{ width: table.getCenterTotalSize(), minWidth: '100%' }}>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    return (
                        <TableHead key={header.id} style={{ width: header.getSize() }}>
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/tickets/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-center p-8 text-sm text-muted-foreground">
                        <CircleDashed className="h-10 w-10 mb-4" />
                        <h3 className="font-semibold">No se encontraron tickets</h3>
                        <p>Prueba a cambiar los filtros de búsqueda.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
      </div>
       <div className="flex items-center justify-between px-2">
            <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredRowModel().rows.length} de {tickets.length} fila(s) mostradas.
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Filas por página</p>
                    <Select
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value));
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={table.getState().pagination.pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 30, 40, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} >
                        <span className="sr-only">Ir a la primera página</span>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} >
                        <span className="sr-only">Ir a la página anterior</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} >
                        <span className="sr-only">Ir a la siguiente página</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} >
                        <span className="sr-only">Ir a la última página</span>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
      <CloseTicketDialog
        isOpen={!!ticketToClose}
        onOpenChange={(open) => !open && setTicketToClose(null)}
        onSubmit={handleCloseTicketSubmit}
        ticketTitle={ticketToClose?.title || ''}
        rootCauses={rootCauses || []}
      />
    </div>
  );
}

function ColumnHeader({
    column,
    title,
    options
}: {
    column: Column<TicketData, unknown>,
    title: string,
    options?: string[]
}) {

    const FilterComponent = useMemo(() => {
        if (options && options.length > 0) {
             return (
                <Select
                    value={(column.getFilterValue()?.[0] as string) ?? 'todos'}
                     onValueChange={(value) => column.setFilterValue(value === 'todos' ? undefined : [value])}
                >
                    <SelectTrigger className="w-full h-8 border-dashed bg-background/50">
                        <SelectValue placeholder={`Filtrar ${title}...`} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {options.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }
        return (
             <Input
                className="w-full h-8 border-dashed bg-background/50"
                placeholder={`Buscar en ${title}...`}
                value={(column.getFilterValue() as string) ?? ''}
                onChange={(event) => column.setFilterValue(event.target.value)}
            />
        );
    }, [column, title, options]);

    return (
        <div className="flex flex-col gap-2">
           <span className="font-bold text-foreground">{title}</span>
            {column.getCanFilter() ? FilterComponent : null}
        </div>
    );
}
