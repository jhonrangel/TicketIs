'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo, useEffect } from 'react';
import type { TicketData, BodegaData, CuentaData, SistemaData } from '@/lib/types';
import { useUser, useCollection } from '@/firebase';


const formSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  bodega: z.string().min(1, 'La bodega es requerida'),
  cuenta: z.string().min(1, 'La cuenta es requerida'),
  sistema: z.string().min(1, 'El sistema es requerido'),
  creatorName: z.string().min(1, 'El nombre de quien reporta es requerido'),
  creatorRole: z.string().optional(),
  otherCreatorRole: z.string().optional(),
  creatorEmail: z.string().email('Email inválido').optional().or(z.literal('')),
}).refine(data => (data.creatorRole && data.creatorRole !== 'Otro') || !!data.otherCreatorRole, {
    message: 'El rol es requerido',
    path: ['creatorRole'],
});

type TicketFormValues = z.infer<typeof formSchema>;

const creatorRoles = ['Supervisor', 'Jefe', 'Analista', 'Operario', 'Administrativo'];

function generateEmailFromName(name: string) {
    if (!name) return '';
    return name.trim().toLowerCase().replace(/\s+/g, '.') + '@kuehne-nagel.com';
}

interface CreateTicketDialogProps {
  onTicketCreated: (ticket: Omit<TicketData, 'id' | 'createdAt' | 'status'>) => void;
  isPublicForm?: boolean;
}

export function CreateTicketDialog({ onTicketCreated, isPublicForm = false }: CreateTicketDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedBodegaId, setSelectedBodegaId] = useState<string | null>(null);
  const [selectedCuentaId, setSelectedCuentaId] = useState<string | null>(null);
  
  const { user: currentUser } = useUser();
  const { data: bodegas, loading: loadingBodegas } = useCollection<BodegaData>('bodegas');
  const { data: cuentas, loading: loadingCuentas } = useCollection<CuentaData>('cuentas');
  const { data: sistemas, loading: loadingSistemas } = useCollection<SistemaData>('sistemas');


  const form = useForm<TicketFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      bodega: '',
      cuenta: '',
      sistema: '',
      creatorName: '',
      creatorRole: '',
      otherCreatorRole: '',
      creatorEmail: '',
    },
  });
  
  const selectedRole = form.watch('creatorRole');
  const isOtherRole = selectedRole === 'Otro';
  
  const creatorNameValue = form.watch('creatorName');
  useEffect(() => {
    if (isPublicForm) {
        const email = generateEmailFromName(creatorNameValue);
        form.setValue('creatorEmail', email);
    }
  }, [creatorNameValue, form, isPublicForm]);
  
  useEffect(() => {
    if (!isPublicForm && currentUser && open) {
        form.setValue('creatorName', currentUser.displayName, { shouldValidate: true });
        form.setValue('creatorEmail', currentUser.email, { shouldValidate: true });
        
        // This is a simplified logic, you might need a more robust role mapping
        const userRole = currentUser.role === 'admin' ? 'Jefe' : 'Analista';
        
        if (creatorRoles.includes(userRole)) {
            form.setValue('creatorRole', userRole, { shouldValidate: true });
        } else {
            form.setValue('creatorRole', 'Otro', { shouldValidate: true });
            form.setValue('otherCreatorRole', userRole, { shouldValidate: true });
        }
    }
  }, [currentUser, isPublicForm, open, form]);


  const filteredCuentas = useMemo(() => {
    if (!selectedBodegaId || !cuentas) return [];
    return cuentas.filter(c => c.bodegaId === selectedBodegaId);
  }, [selectedBodegaId, cuentas]);

  const filteredSistemas = useMemo(() => {
    const cuenta = cuentas?.find(c => c.id === selectedCuentaId);
    if (!cuenta || !sistemas) return [];
    const sistemaIds = cuenta.sistemas || [];
    return sistemas.filter(s => sistemaIds.includes(s.id));
  }, [selectedCuentaId, cuentas, sistemas]);

  const onSubmit: SubmitHandler<TicketFormValues> = (data) => {
    const finalRole = data.creatorRole === 'Otro' ? data.otherCreatorRole : data.creatorRole;
    
    const newTicket = { 
        ...data,
        creatorRole: finalRole || '',
    };
    // @ts-ignore
    delete newTicket.otherCreatorRole;

    onTicketCreated(newTicket);

    toast({
      title: 'Ticket Creado',
      description: 'Tu solicitud de soporte ha sido registrada exitosamente.',
    });
    setOpen(false);
    form.reset();
    setSelectedBodegaId(null);
    setSelectedCuentaId(null);
  };

  const handleBodegaChange = (bodegaId: string) => {
    const bodega = bodegas?.find(b => b.id === bodegaId);
    if(bodega) {
        form.setValue('bodega', bodega.name);
        setSelectedBodegaId(bodega.id);
        form.setValue('cuenta', '');
        form.setValue('sistema', '');
        setSelectedCuentaId(null);
    }
  }

  const handleCuentaChange = (cuentaId: string) => {
    const cuenta = filteredCuentas.find(c => c.id === cuentaId);
    if(cuenta) {
        form.setValue('cuenta', cuenta.name);
        setSelectedCuentaId(cuenta.id);
        form.setValue('sistema', '');
    }
  }
  
  const handleSistemaChange = (sistemaName: string) => {
    form.setValue('sistema', sistemaName);
  }

  const triggerText = isPublicForm ? "Crear Nuevo Ticket" : "Crear Ticket";
  
  const isUserDataSet = !isPublicForm && !!currentUser;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
            form.reset();
            setSelectedBodegaId(null);
            setSelectedCuentaId(null);
        }
    }}>
      <DialogTrigger asChild>
        <Button variant={isPublicForm ? 'default' : 'outline'} size={isPublicForm ? 'lg' : 'default'} className={isPublicForm ? 'py-6 text-lg' : ''}>{triggerText}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reportar una Incidencia</DialogTitle>
          <DialogDescription>
            Completa el formulario para generar un nuevo ticket de soporte.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="creatorName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre de quien reporta</FormLabel>
                    <FormControl>
                        <Input placeholder="Nombre completo" {...field} disabled={isUserDataSet} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                {isUserDataSet ? (
                    <FormField
                    control={form.control}
                    name="creatorEmail"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input readOnly placeholder="email@kuehne-nagel.com" {...field} disabled={isUserDataSet}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                ) : null}

                <div>
                    <FormField
                        control={form.control}
                        name="creatorRole"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Rol de quien reporta</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isUserDataSet}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un rol" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <>
                                        {creatorRoles.map((role) => (
                                            <SelectItem key={role} value={role}>
                                            {role}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="Otro">Otro...</SelectItem>
                                    </>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    {isOtherRole && (
                        <FormField
                            control={form.control}
                            name="otherCreatorRole"
                            render={({ field }) => (
                                <FormItem className="mt-2">
                                <FormLabel className="sr-only">Otro Rol</FormLabel>
                                <FormControl>
                                    <Input placeholder="Especifica el rol" {...field} disabled={isUserDataSet} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>
            </div>
            <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Título de la incidencia</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Falla en sistema de facturación" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción detallada</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el problema en detalle, incluyendo pasos para reproducirlo si es posible."
                      className="resize-y min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="bodega"
                    render={() => (
                        <FormItem>
                        <FormLabel>Bodega</FormLabel>
                        <Select onValueChange={handleBodegaChange} value={selectedBodegaId || ''}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una bodega" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {bodegas?.map((bodega) => (
                                <SelectItem key={bodega.id} value={bodega.id}>
                                {bodega.name}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="cuenta"
                    render={() => (
                        <FormItem>
                        <FormLabel>Cuenta</FormLabel>
                        <Select onValueChange={handleCuentaChange} value={selectedCuentaId || ''} disabled={!selectedBodegaId}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una cuenta" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {filteredCuentas.map((cuenta) => (
                                <SelectItem key={cuenta.id} value={cuenta.id}>
                                {cuenta.name}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="sistema"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Sistema</FormLabel>
                        <Select onValueChange={handleSistemaChange} value={field.value} disabled={!selectedCuentaId}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un sistema" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {filteredSistemas.map((sistema) => (
                                <SelectItem key={sistema.id} value={sistema.name}>
                                {sistema.name}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
             <DialogFooter>
                <Button type="submit">Crear Ticket</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
