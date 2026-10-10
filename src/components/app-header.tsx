'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { LogOut, PanelLeft, Shield, Settings, Home, KeyRound } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { AppSidebarContent } from './app-sidebar';
import { Skeleton } from './ui/skeleton';
import { useUser, useAuthActions } from '@/firebase';


export default function AppHeader() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { signOut } = useAuthActions();

  const handleLogout = async () => {
    await signOut();
    router.replace('/');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const nameParts = name.split(' ').filter(Boolean);
    if (nameParts.length === 0) return 'U';
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <AppSidebarContent />
            </SheetContent>
          </Sheet>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            {isUserLoading ? (
               <Skeleton className="h-9 w-9 rounded-full" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.displayName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    <Home className="mr-2 h-4 w-4" />
                    <span>Bandeja de Tickets</span>
                  </DropdownMenuItem>
                   {user.role === 'admin' && (
                     <>
                      <DropdownMenuItem onClick={() => router.push('/admin')}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configuración</span>
                      </DropdownMenuItem>
                     </>
                   )}
                  <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={() => router.push('/admin/settings/change-password')}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    <span>Cambiar Contraseña</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null }
          </nav>
        </div>
      </header>
  );
}
