'use client';
import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreateUserDialog } from './create-user-dialog';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { User, UserRole } from '@/lib/types';
import { DynamicTime } from '../tickets/dynamic-time';
import { useAuthActions } from '@/firebase';
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
import { cn } from '@/lib/utils';
import { buttonVariants } from '../ui/button';


interface AdminUserListProps {
  users: User[];
  loading: boolean;
  currentUser: User;
}

const roleVariant: Record<UserRole, 'default' | 'secondary'> = {
  admin: 'default',
  user: 'secondary',
};

export function AdminUserList({ users, loading, currentUser }: AdminUserListProps) {
  const { toast } = useToast();
  const { deleteUser } = useAuthActions();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const sortedUsers = [...users].sort(
    (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
  );
  
  const canManageUsers = currentUser.role === 'admin';

  const handleDeleteConfirm = () => {
    if (!userToDelete) return;
    handleDelete(userToDelete);
    setUserToDelete(null);
  }

  const handleDelete = async (user: User) => {
    try {
      await deleteUser(user.id);
       toast({
        title: 'Usuario Eliminado',
        description: `El usuario "${user.displayName}" ha sido eliminado.`,
      });
    } catch(e: any) {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar usuario',
        description: e.message,
      });
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }
    return (
       <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre de Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              {canManageUsers && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.displayName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={roleVariant[user.role]}>{user.role}</Badge>
                </TableCell>
                <TableCell>
                  {user.createdAt ? <DynamicTime date={new Date(user.createdAt.seconds * 1000)} mode="format" /> : 'N/A'}
                </TableCell>
                {canManageUsers && (
                    <TableCell className="text-right">
                        {user.id !== currentUser.id ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menú</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => setUserToDelete(user)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Eliminar Usuario</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : null}
                    </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        {canManageUsers && <CreateUserDialog />}
      </div>
      {renderContent()}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de eliminar a este usuario?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente al usuario "{userToDelete?.displayName}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                    className={cn(buttonVariants({ variant: 'destructive' }))}
                    onClick={handleDeleteConfirm}
                >
                    Confirmar Eliminación
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
