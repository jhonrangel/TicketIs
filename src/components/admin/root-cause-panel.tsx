'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '../ui/skeleton';
import type { RootCauseData, User } from '@/lib/types';
import { Trash2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { addDoc, collection, deleteDoc, doc } from 'firebase/firestore';
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


const formSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
});

type FormValues = z.infer<typeof formSchema>;

interface RootCausePanelProps {
  rootCauses: RootCauseData[];
  loading: boolean;
  currentUser: User;
}

export function RootCausePanel({ rootCauses, loading, currentUser }: RootCausePanelProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
  });

  const canManage = currentUser?.role === 'admin';

  const handleCreate = async (data: FormValues) => {
    if (!firestore || !currentUser) return;
    try {
      await addDoc(collection(firestore, 'rootCauses'), {
        name: data.name,
        createdBy: currentUser.displayName,
      });
      toast({ title: 'Éxito', description: `Causa Raíz "${data.name}" creada.` });
      form.reset();
    } catch(e) {
      toast({ title: 'Error', description: 'No se pudo crear la Causa Raíz.', variant: 'destructive'});
    }
  };

  const handleDelete = async () => {
    if (!firestore || !itemToDelete) return;
    
    try {
      await deleteDoc(doc(firestore, 'rootCauses', itemToDelete.id));
      toast({ title: 'Éxito', description: `Causa Raíz "${itemToDelete.name}" eliminada.` });
    } catch(e) {
      toast({ title: 'Error', description: 'No se pudo eliminar la Causa Raíz.', variant: 'destructive'});
    } finally {
      setItemToDelete(null);
    }
  };
  
  const renderContent = () => {
    if (loading) {
      return (
          <>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full mt-6" />
          </>
      )
    }
    return (
        <div className="grid md:grid-cols-2 gap-6">
            {canManage && (
                <Card>
                    <CardHeader>
                        <CardTitle>Añadir Nueva Causa Raíz</CardTitle>
                        <CardDescription>Crea una nueva clasificación para la causa raíz de los tickets.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre de la Causa Raíz</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Error de usuario" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <Button type="submit" className="w-full">Crear Causa Raíz</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            )}
             <Card className={!canManage ? 'md:col-span-2' : ''}>
                <CardHeader>
                    <CardTitle>Causas Raíz Existentes</CardTitle>
                    <CardDescription>Lista maestra de todas las clasificaciones disponibles.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Creado por</TableHead>
                                    {canManage && <TableHead className="text-right">Acciones</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rootCauses.length > 0 ? rootCauses.map(rc => (
                                    <TableRow key={rc.id}>
                                        <TableCell className="font-medium">{rc.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{rc.createdBy}</TableCell>
                                        {canManage && (
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setItemToDelete({ id: rc.id, name: rc.name })}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={canManage ? 3 : 2} className="text-center text-muted-foreground">
                                            No hay causas raíz definidas.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <>
      {renderContent()}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la causa raíz "{itemToDelete?.name}".
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
    </>
  );
}
