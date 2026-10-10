'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '../ui/skeleton';
import type { BodegaData, CuentaData, SistemaData } from '@/lib/types';
import { PlusCircle, Trash2, Edit, X, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useFirestore } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
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


interface ManagementPanelProps {
    bodegas: BodegaData[];
    cuentas: CuentaData[];
    sistemas: SistemaData[];
    loading: boolean;
}

const bodegaSchema = z.object({ name: z.string().min(1, 'El nombre es requerido') });
const cuentaSchema = z.object({ name: z.string().min(1, 'El nombre es requerido') });
const sistemaSchema = z.object({ name: z.string().min(1, 'El nombre es requerido') });
const asociarSistemaSchema = z.object({ sistemaId: z.string().min(1, 'Debes seleccionar un sistema') });

type BodegaFormValues = z.infer<typeof bodegaSchema>;
type CuentaFormValues = z.infer<typeof cuentaSchema>;
type SistemaFormValues = z.infer<typeof sistemaSchema>;
type AsociarSistemaFormValues = z.infer<typeof asociarSistemaSchema>;


function SistemaAssociationForm({ cuenta, allSistemas, onAssociate }: { cuenta: CuentaData, allSistemas: SistemaData[], onAssociate: (sistemaId: string, cuentaId: string) => void }) {
    const associationForm = useForm<AsociarSistemaFormValues>({ 
        resolver: zodResolver(asociarSistemaSchema), 
        defaultValues: { sistemaId: '' } 
    });

    const associatedSistemaIds = cuenta.sistemas || [];
    const availableSistemas = allSistemas.filter(s => !associatedSistemaIds.includes(s.id));

    const handleAssociateSistema = (data: AsociarSistemaFormValues) => {
        onAssociate(data.sistemaId, cuenta.id);
        associationForm.reset({ sistemaId: '' });
    };

    return (
        <Form {...associationForm}>
            <form onSubmit={associationForm.handleSubmit(handleAssociateSistema)} className="flex items-start gap-2 pt-4 border-t mt-4">
                <FormField control={associationForm.control} name="sistemaId" render={({ field }) => (
                    <FormItem className="flex-grow">
                         <FormLabel className="text-xs text-muted-foreground">Asociar Sistema Existente</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un sistema..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {availableSistemas.length > 0 ? (
                                    availableSistemas.map(sistema => (
                                        <SelectItem key={sistema.id} value={sistema.id}>{sistema.name}</SelectItem>
                                    ))
                                ) : (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No hay más sistemas para asociar.</div>
                                )}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" size="sm" className="mt-6">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Asociar
                </Button>
            </form>
        </Form>
    );
}

function CuentaForm({ bodegaId, onCuentaCreated }: { bodegaId: string; onCuentaCreated: (data: CuentaFormValues, bodegaId: string) => void }) {
    const cuentaForm = useForm<CuentaFormValues>({
        resolver: zodResolver(cuentaSchema),
        defaultValues: { name: '' },
    });

    const handleCreateCuenta = (data: CuentaFormValues) => {
        onCuentaCreated(data, bodegaId);
        cuentaForm.reset({ name: '' });
    };

    return (
         <Form {...cuentaForm}>
            <form onSubmit={cuentaForm.handleSubmit(handleCreateCuenta)} className="flex items-start gap-2 pt-4 border-t mt-4">
                 <FormField control={cuentaForm.control} name="name" render={({ field }) => (
                    <FormItem className="flex-grow">
                        <FormLabel className="text-xs text-muted-foreground">Asociar Nueva Cuenta</FormLabel>
                        <FormControl><Input placeholder="Nombre de la nueva cuenta" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" size="sm" className="mt-6">
                     <PlusCircle className="mr-2 h-4 w-4" />
                    Asociar
                </Button>
            </form>
        </Form>
    );
}

export function ManagementPanel({ bodegas, cuentas, sistemas, loading }: ManagementPanelProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const bodegaForm = useForm<BodegaFormValues>({ resolver: zodResolver(bodegaSchema), defaultValues: { name: '' } });
  const sistemaForm = useForm<SistemaFormValues>({ resolver: zodResolver(sistemaSchema), defaultValues: { name: '' } });
  
  const [editingSistemaId, setEditingSistemaId] = useState<string | null>(null);
  const [editingSistemaName, setEditingSistemaName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ collection: string, id: string, name: string } | null>(null);
  
  const canManage = true; 

  const handleCreate = async (collectionName: string, data: any, successMessage: string) => {
    if (!firestore) return;
    try {
        await addDoc(collection(firestore, collectionName), data);
        toast({ title: 'Éxito', description: successMessage });
    } catch(e) {
        toast({ title: 'Error', description: `No se pudo crear el elemento.`, variant: 'destructive' });
    }
  }

  const handleCreateBodega = (data: BodegaFormValues) => {
    handleCreate('bodegas', data, `Bodega "${data.name}" creada.`);
    bodegaForm.reset();
  };

  const handleCreateCuenta = (data: CuentaFormValues, bodegaId: string) => {
    handleCreate('cuentas', { ...data, bodegaId, sistemas: [] }, `Cuenta "${data.name}" creada y asociada.`);
  };

  const handleCreateSistema = (data: SistemaFormValues) => {
    handleCreate('sistemas', data, `Sistema "${data.name}" creado.`);
    sistemaForm.reset();
  };
  
  const confirmDelete = (collectionName: string, id: string, name: string) => {
    setShowDeleteConfirm({ collection: collectionName, id, name });
  };

  const handleDelete = async () => {
    if (!firestore || !showDeleteConfirm) return;
    const { collection: collectionName, id, name } = showDeleteConfirm;
    
    try {
        await deleteDoc(doc(firestore, collectionName, id));
        toast({ title: 'Elemento Eliminado', description: `"${name}" ha sido eliminado.` });
    } catch(e) {
        toast({ title: 'Error', description: 'No se pudo eliminar el elemento.', variant: 'destructive' });
    } finally {
        setShowDeleteConfirm(null);
    }
  };
  
  const handleAssociateSistema = async (sistemaId: string, cuentaId: string) => {
    if (!firestore) return;
    try {
        const cuentaRef = doc(firestore, 'cuentas', cuentaId);
        await updateDoc(cuentaRef, { sistemas: arrayUnion(sistemaId) });
        toast({ title: 'Éxito', description: 'Sistema asociado correctamente.'});
    } catch (e) {
        toast({ title: 'Error', description: 'No se pudo asociar el sistema.', variant: 'destructive' });
    }
  };
  
  const handleDisassociateSistema = async (sistemaId: string, cuentaId: string) => {
    if (!firestore) return;
    try {
        const cuentaRef = doc(firestore, 'cuentas', cuentaId);
        await updateDoc(cuentaRef, { sistemas: arrayRemove(sistemaId) });
        toast({ title: 'Éxito', description: 'Sistema desasociado correctamente.'});
    } catch (e) {
        toast({ title: 'Error', description: 'No se pudo desasociar el sistema.', variant: 'destructive' });
    }
  }
  
  const handleUpdateSistema = async () => {
    if (!firestore || !editingSistemaId || !editingSistemaName) return;
    try {
        const sistemaRef = doc(firestore, 'sistemas', editingSistemaId);
        await updateDoc(sistemaRef, { name: editingSistemaName });
        toast({ title: 'Éxito', description: 'Sistema actualizado.' });
        setEditingSistemaId(null);
        setEditingSistemaName('');
    } catch (e) {
        toast({ title: 'Error', description: 'No se pudo actualizar el sistema.', variant: 'destructive' });
    }
  }
  
  const getDeletionDetails = () => {
    if (!showDeleteConfirm) return { typeName: 'elemento', description: 'Esta acción no se puede deshacer.' };

    switch (showDeleteConfirm.collection) {
        case 'bodegas':
            return {
                typeName: `la bodega`,
                description: 'Las cuentas asociadas no se eliminarán, pero quedarán desvinculadas y deberán ser reasignadas a otra bodega si es necesario.'
            };
        case 'cuentas':
            return {
                typeName: `la cuenta`,
                description: 'Los tickets existentes que usan esta cuenta no se verán afectados, pero no se podrá seleccionar para nuevos tickets.'
            };
        case 'sistemas':
             return {
                typeName: `el sistema`,
                description: 'Las cuentas que utilizan este sistema ya no podrán seleccionarlo. Los tickets existentes no se verán afectados.'
            };
        default:
            return { typeName: 'el elemento', description: 'Esta acción no se puede deshacer.' };
    }
};
const deletionDetails = getDeletionDetails();


  const renderContent = () => {
    if (loading) {
        return <Skeleton className="h-96 w-full" />
    }
    return (
        <div className="space-y-6">
            {canManage && (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Añadir Nueva Bodega</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...bodegaForm}>
                                <form onSubmit={bodegaForm.handleSubmit(handleCreateBodega)} className="flex items-start gap-2">
                                        <FormField control={bodegaForm.control} name="name" render={({ field }) => (
                                        <FormItem className="flex-grow">
                                            <FormLabel>Nombre de la Bodega</FormLabel>
                                            <FormControl><Input placeholder="Ej: Bodega Sur" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <Button type="submit" className="self-end">Crear Bodega</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Sistemas Maestros</CardTitle>
                            <CardDescription>Crea y gestiona la lista de sistemas que pueden ser asociados a las cuentas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                        <Form {...sistemaForm}>
                                <form onSubmit={sistemaForm.handleSubmit(handleCreateSistema)} className="flex items-start gap-2 mb-4">
                                    <FormField control={sistemaForm.control} name="name" render={({ field }) => (
                                        <FormItem className="flex-grow">
                                            <FormLabel>Nuevo Sistema</FormLabel>
                                            <FormControl><Input placeholder="Ej: SAP EWM" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <Button type="submit" className="self-end">Añadir Sistema</Button>
                                </form>
                            </Form>
                            <div className="mt-4 border rounded-lg max-h-48 overflow-auto">
                            <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nombre del Sistema</TableHead>
                                            <TableHead className="text-right w-28">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sistemas.length > 0 ? (
                                            sistemas.map(sistema => (
                                                <TableRow key={sistema.id}>
                                                    <TableCell>
                                                        {editingSistemaId === sistema.id ? (
                                                            <Input 
                                                                value={editingSistemaName} 
                                                                onChange={(e) => setEditingSistemaName(e.target.value)} 
                                                                className="h-8"
                                                            />
                                                        ) : (
                                                            sistema.name
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                         {editingSistemaId === sistema.id ? (
                                                            <>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUpdateSistema}><Check className="h-4 w-4 text-green-600" /></Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingSistemaId(null)}><X className="h-4 w-4" /></Button>
                                                            </>
                                                         ) : (
                                                            <>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingSistemaId(sistema.id); setEditingSistemaName(sistema.name); }}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => confirmDelete('sistemas', sistema.id, sistema.name)}>
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </>
                                                         )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center text-muted-foreground">No hay sistemas creados.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                            </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            
            <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Recursos por Bodega</h2>
                <Accordion type="multiple" className="w-full space-y-4">
                {bodegas.map(bodega => (
                    <AccordionItem value={bodega.id} key={bodega.id} className="border rounded-lg overflow-hidden bg-card">
                        <AccordionTrigger className="p-6 hover:no-underline data-[state=open]:bg-muted/50">
                             <div className="flex justify-between items-center w-full">
                                <div className="flex flex-col text-left">
                                    <h3 className="text-xl font-semibold">{bodega.name}</h3>
                                    <p className="text-sm text-muted-foreground">Haz clic para ver y gestionar cuentas y sistemas.</p>
                                </div>
                                {canManage && (
                                     <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="mr-4"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            confirmDelete('bodegas', bodega.id, bodega.name)}
                                        }
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="px-6 py-4 bg-muted/20 border-t">
                                <div className="space-y-4">
                                    {cuentas.filter(c => c.bodegaId === bodega.id).map(cuenta => {
                                        const associatedSistemas = sistemas.filter(s => (cuenta.sistemas || []).includes(s.id));
                                        return (
                                            <Card key={cuenta.id} className="bg-background group/cuenta">
                                                <CardHeader className="flex-row items-center justify-between">
                                                    <div>
                                                        <CardTitle className="text-lg">{cuenta.name}</CardTitle>
                                                        <CardDescription>Sistemas asociados a esta cuenta.</CardDescription>
                                                    </div>
                                                    {canManage && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="opacity-0 group-hover/cuenta:opacity-100 transition-opacity"
                                                            onClick={() => confirmDelete('cuentas', cuenta.id, cuenta.name)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    )}
                                                </CardHeader>
                                                <CardContent>
                                                    {associatedSistemas.length > 0 ? (
                                                        <ul className="space-y-2">
                                                            {associatedSistemas.map(sistema => (
                                                                <li key={sistema.id} className="group/sistema flex items-center justify-between text-sm">
                                                                    <span>{sistema.name}</span>
                                                                    {canManage && (
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="icon" 
                                                                            className="h-7 w-7 opacity-0 group-hover/sistema:opacity-100 transition-opacity"
                                                                            onClick={() => handleDisassociateSistema(sistema.id, cuenta.id)}
                                                                        >
                                                                            <X className="h-4 w-4 text-destructive/70" />
                                                                        </Button>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">No hay sistemas asociados.</p>
                                                    )}
                                                    {canManage && (
                                                        <SistemaAssociationForm 
                                                            cuenta={cuenta} 
                                                            allSistemas={sistemas}
                                                            onAssociate={handleAssociateSistema}
                                                        />
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                    {cuentas.filter(c => c.bodegaId === bodega.id).length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">No hay cuentas asociadas a esta bodega.</p>
                                    )}
                                    {canManage && <CuentaForm bodegaId={bodega.id} onCuentaCreated={handleCreateCuenta} />}
                               </div>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
                 {bodegas.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No hay bodegas creadas.</p>
                 )}
            </div>
             <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro que quieres eliminar {deletionDetails.typeName} "{showDeleteConfirm?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Esta acción no se puede deshacer y eliminará el elemento permanentemente. {deletionDetails.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={handleDelete}
                        >
                            Confirmar Eliminación
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Recursos</CardTitle>
        <CardDescription>Crea y gestiona bodegas, cuentas y sistemas para la creación de tickets.</CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
