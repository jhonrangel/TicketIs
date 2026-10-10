
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { DateRange } from 'react-day-picker';
import type { TicketData } from './types';
import { isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface TicketFilters {
    dateRange?: DateRange;
    bodegaFilter: string;
    userFilter: string;
    statusFilter: string;
}

/**
 * Filtra una lista de tickets basándose en un rango de fechas, bodega, usuario asignado y estado.
 */
export function filterTickets(tickets: TicketData[] | null, filters: TicketFilters): TicketData[] {
    if (!tickets) return [];
    
    const { dateRange, bodegaFilter, userFilter, statusFilter } = filters;

    return tickets.filter(ticket => {
        const createdAt = new Date(ticket.createdAt.seconds * 1000);
        
        // Filtrado por fecha: si hay un rango definido, validamos que la fecha esté dentro
        const inDateRange = dateRange?.from && dateRange?.to 
            ? (!isBefore(createdAt, startOfDay(dateRange.from)) && !isAfter(createdAt, endOfDay(dateRange.to))) 
            : true;
            
        const inBodega = bodegaFilter === 'todas' || ticket.bodega === bodegaFilter;
        const inUser = userFilter === 'todos' || ticket.assignee === userFilter;
        const inStatus = statusFilter === 'todos' || ticket.status === statusFilter;
        
        return inDateRange && inBodega && inUser && inStatus;
    });
}
