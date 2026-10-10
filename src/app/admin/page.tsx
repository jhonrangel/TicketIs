
'use client';
import { useState, useMemo } from 'react';
import type { DateRange } from 'react-day-picker';
import { subDays, formatDistanceStrict, format, eachDayOfInterval, startOfDay } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminTicketList } from '@/components/admin/admin-ticket-list';
import { AdminExport } from '@/components/admin/admin-export';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Treemap, Cell, Bar, BarChart } from 'recharts';
import type { TicketData, User } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Ticket, CircleCheck, CircleX, Timer, Hourglass } from 'lucide-react';
import { es } from 'date-fns/locale';
import { cn, filterTickets } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCollection } from '@/firebase';

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary-foreground))', 'hsl(var(--destructive))', '#f97316', '#3b82f6', '#10b981'];

const CustomTreemapTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="text-sm font-bold">{data.name}</p>
        <p className="text-sm text-primary">Tickets: {data.value}</p>
      </div>
    );
  }
  return null;
};

export default function AdminDashboardPage() {
  const { data: allTickets } = useCollection<TicketData>('tickets');
  const { data: allUsers } = useCollection<User>('users');
  const { data: allBodegas } = useCollection<any>('bodegas');
  const { data: allRootCauses } = useCollection<any>('rootCauses');
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 29), to: new Date() });
  const [bodegaFilter, setBodegaFilter] = useState('todas');
  const [userFilter, setUserFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  
  const adminUsers = (allUsers || []).filter(u => u.role === 'admin');

  // Optimizamos el filtrado y cálculo de estadísticas en una sola pasada
  const {
    filteredTickets,
    stats,
    ticketsByBodega,
    closedTicketsByUser,
    ticketsByRootCause,
    trends
  } = useMemo(() => {
    const filtered = filterTickets(allTickets, { dateRange, bodegaFilter, userFilter, statusFilter });
    
    const s = { total: 0, open: 0, inProgress: 0, closed: 0, totalResolutionMs: 0, closedCount: 0 };
    const bodegaCounts: Record<string, number> = {};
    const userCounts: Record<string, number> = {};
    const causeCounts: Record<string, number> = {};
    
    const dailyMap = new Map<string, { created: number; inProgress: number; closed: number }>();
    if (dateRange?.from && dateRange?.to) {
        eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).forEach(day => {
            dailyMap.set(format(day, 'MMM d'), { created: 0, inProgress: 0, closed: 0 });
        });
    }

    filtered.forEach(ticket => {
        s.total++;
        if (ticket.status === 'Abierto') s.open++;
        else if (ticket.status === 'En Progreso') s.inProgress++;
        else if (ticket.status === 'Cerrado') {
            s.closed++;
            if (ticket.closedAt) {
                s.totalResolutionMs += (ticket.closedAt.seconds - ticket.createdAt.seconds) * 1000;
                s.closedCount++;
                if (ticket.closedBy) userCounts[ticket.closedBy] = (userCounts[ticket.closedBy] || 0) + 1;
                if (ticket.rootCause) causeCounts[ticket.rootCause] = (causeCounts[ticket.rootCause] || 0) + 1;
            }
        }
        
        bodegaCounts[ticket.bodega] = (bodegaCounts[ticket.bodega] || 0) + 1;

        const createdDateStr = format(startOfDay(new Date(ticket.createdAt.seconds * 1000)), 'MMM d');
        if (dailyMap.has(createdDateStr)) {
            const d = dailyMap.get(createdDateStr)!;
            d.created++;
            if (ticket.status === 'En Progreso') d.inProgress++;
        }
        if (ticket.closedAt) {
            const closedDateStr = format(startOfDay(new Date(ticket.closedAt.seconds * 1000)), 'MMM d');
            if (dailyMap.has(closedDateStr)) dailyMap.get(closedDateStr)!.closed++;
        }
    });

    const trendData = Array.from(dailyMap.entries()).map(([date, d]) => ({
        date,
        'Tickets Creados': d.created,
        'En Progreso': d.inProgress,
        Creados: d.created,
        Cerrados: d.closed
    }));

    return {
        filteredTickets: filtered,
        stats: s,
        ticketsByBodega: Object.entries(bodegaCounts).map(([name, tickets]) => ({ name, tickets })),
        closedTicketsByUser: Object.entries(userCounts).map(([name, tickets]) => ({ name, tickets })).sort((a, b) => b.tickets - a.tickets),
        ticketsByRootCause: Object.entries(causeCounts).map(([name, value]) => ({ name, value })),
        trends: trendData
    };
  }, [allTickets, dateRange, bodegaFilter, userFilter, statusFilter]);

  const avgResolutionTime = stats.closedCount > 0 
    ? formatDistanceStrict(0, stats.totalResolutionMs / stats.closedCount, { locale: es }) 
    : 'N/A';

  return (
    <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Métricas clave y análisis de tickets de soporte.</p>
        </div>
      </div>
      <Tabs defaultValue="dashboard" className="mt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="export">Exportar</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <div className="space-y-2">
                    <Label className="text-xs">Rango de Fechas</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : <span>Selecciona un rango</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={es} />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs">Bodega</Label>
                    <Select value={bodegaFilter} onValueChange={setBodegaFilter}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todas">Todas las Bodegas</SelectItem>
                            {(allBodegas || []).map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs">Usuario Asignado</Label>
                    <Select value={userFilter} onValueChange={setUserFilter}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos los Usuarios</SelectItem>
                            {adminUsers.map(u => <SelectItem key={u.id} value={u.displayName}>{u.displayName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs">Estado del Ticket</Label>
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Tickets</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                         <p className="text-xs text-muted-foreground">En el período seleccionado</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tickets Abiertos</CardTitle>
                        <CircleX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.open}</div>
                        <p className="text-xs text-muted-foreground">Pendientes de atención</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
                        <Hourglass className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.inProgress}</div>
                        <p className="text-xs text-muted-foreground">Siendo atendidos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tickets Cerrados</CardTitle>
                        <CircleCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.closed}</div>
                         <p className="text-xs text-muted-foreground">Resueltos en el período</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">T. de Resolución Prom.</CardTitle>
                        <Timer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgResolutionTime}</div>
                        <p className="text-xs text-muted-foreground">Para tickets cerrados</p>
                    </CardContent>
                </Card>
            </div>
            
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
             <Card>
                <CardHeader>
                    <CardTitle>Tendencia de Tickets Creados</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={trends}>
                            <defs>
                                <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                            <Area type="monotone" dataKey="Tickets Creados" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTickets)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Tendencia de Tickets en Progreso</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={250}>
                       <AreaChart data={trends}>
                            <defs>
                                <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                            <Area type="monotone" dataKey="En Progreso" stroke="#f97316" fillOpacity={1} fill="url(#colorInProgress)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Tendencia: Creados vs Cerrados</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={trends}>
                            <defs>
                                <linearGradient id="colorCreados" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorCerrados" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                            <Legend verticalAlign="top" height={36} />
                            <Area type="monotone" dataKey="Creados" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCreados)" />
                            <Area type="monotone" dataKey="Cerrados" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorCerrados)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Tickets por Causa Raíz</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                        <Treemap data={ticketsByRootCause} dataKey="value" nameKey="name" ratio={4/3} stroke="hsl(var(--card))" fill="hsl(var(--primary))">
                            {
                                ticketsByRootCause.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))
                            }
                            <Tooltip content={<CustomTreemapTooltip />} />
                        </Treemap>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Tickets por Bodega</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={ticketsByBodega} layout="vertical">
                            <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={80}/>
                            <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip formatter={(value) => [value, 'Tickets']} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} cursor={{ fill: 'hsl(var(--accent))' }} />
                            <Bar dataKey="tickets" name="Tickets" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Productividad por Usuario</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={closedTicketsByUser} layout="vertical">
                            <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={80} />
                            <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                            <Tooltip formatter={(value) => [value, 'Cerrados']} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} cursor={{ fill: 'hsl(var(--accent))' }} />
                            <Bar dataKey="tickets" name="Cerrados" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Tickets</CardTitle>
                <CardDescription>
                  La siguiente tabla muestra los tickets que coinciden con los filtros seleccionados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <AdminTicketList
                    tickets={filteredTickets || []}
                    users={allUsers || []}
                    rootCauses={allRootCauses || []}
                  />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="export" className="mt-6">
          <AdminExport
            allTickets={allTickets || []}
            allUsers={allUsers || []}
            allBodegas={allBodegas || []}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
