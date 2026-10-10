'use client';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, filterTickets } from '@/lib/utils';
import { Calendar as CalendarIcon, FileText, FileSpreadsheet } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { BodegaData, TicketData, User } from '@/lib/types';
import * as XLSX from 'xlsx';


interface AdminExportProps {
    allTickets: TicketData[];
    allUsers: User[];
    allBodegas: BodegaData[];
}

export function AdminExport({ allTickets, allUsers, allBodegas }: AdminExportProps) {
    const { toast } = useToast();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 29), to: new Date() });
    const [bodegaFilter, setBodegaFilter] = useState('todas');
    const [userFilter, setUserFilter] = useState('todos');
    const [statusFilter, setStatusFilter] = useState('todos');

    const adminUsers = allUsers.filter(u => u.role === 'admin');

    const handleExport = (formatType: 'csv' | 'xlsx') => {
        const filteredData = filterTickets(allTickets, { dateRange, bodegaFilter, userFilter, statusFilter });

        if (filteredData.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No hay datos para exportar',
                description: 'Prueba a cambiar los filtros para encontrar datos.',
            });
            return;
        }

        const dataToExport = filteredData.map(ticket => ({
            "ID": ticket.id,
            "Titulo": ticket.title,
            "Estado": ticket.status,
            "Bodega": ticket.bodega,
            "Cuenta": ticket.cuenta,
            "Sistema": ticket.sistema,
            "FechaCreacion": format(new Date(ticket.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm:ss'),
            "Creador": ticket.creatorName,
            "RolCreador": ticket.creatorRole,
            "EmailCreador": ticket.creatorEmail,
            "AsignadoA": ticket.assignee || '',
            "FechaCierre": ticket.closedAt ? format(new Date(ticket.closedAt.seconds * 1000), 'yyyy-MM-dd HH:mm:ss') : '',
            "CerradoPor": ticket.closedBy || '',
            "CausaRaiz": ticket.rootCause || '',
            "ComentarioCierre": ticket.closingComment || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

        const fileName = `reporte_tickets_${format(new Date(), 'yyyyMMdd')}.${formatType}`;
        XLSX.writeFile(workbook, fileName);
        
        toast({
            title: 'Exportación Exitosa',
            description: `Se han exportado ${filteredData.length} registros a ${fileName}.`
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Exportar Reporte</CardTitle>
                <CardDescription>
                    Selecciona los filtros para generar un reporte en formato CSV o Excel.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <div className="space-y-2">
                        <Label>Rango de Fechas</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y", { locale: es })} - ${format(dateRange.to, "LLL dd, y", { locale: es })}` : format(dateRange.from, "LLL dd, y", { locale: es })) : <span>Selecciona un rango</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={es} />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="space-y-2">
                        <Label>Bodega</Label>
                        <Select value={bodegaFilter} onValueChange={setBodegaFilter}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todas">Todas las Bodegas</SelectItem>
                                {allBodegas.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Usuario Asignado</Label>
                        <Select value={userFilter} onValueChange={setUserFilter}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos los Usuarios</SelectItem>
                                {adminUsers.map(u => <SelectItem key={u.id} value={u.displayName}>{u.displayName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Estado del Ticket</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos los Estados</SelectItem>
                                <SelectItem value="Abierto">Abierto</SelectItem>
                                <SelectItem value="En Progreso">En Progreso</SelectItem>
                                <SelectItem value="Cerrado">Cerrado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button onClick={() => handleExport('csv')} variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Exportar a CSV
                    </Button>
                    <Button onClick={() => handleExport('xlsx')}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Exportar a Excel
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
