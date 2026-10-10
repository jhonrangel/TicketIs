'use client';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Home, Settings, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useUser } from '@/firebase';

export function AppSidebar() {
    return (
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
            <AppSidebarContent />
        </aside>
    )
}

export function AppSidebarContent() {
    const pathname = usePathname();
    const { user } = useUser();
    const isAdmin = user?.role === 'admin';

    return (
        <TooltipProvider>
            <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
                <Link
                    href="/dashboard"
                    className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
                >
                    <div className="relative h-5 w-5 transition-all group-hover:scale-110">
                         <Image src="/icon.png" alt="Logo" fill style={{ objectFit: 'contain' }} />
                    </div>
                    <span className="sr-only">TicketIS</span>
                </Link>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link
                            href="/dashboard"
                            className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                                (pathname === '/dashboard') && "bg-accent text-accent-foreground"
                            )}
                        >
                            <Home className="h-5 w-5" />
                            <span className="sr-only">Bandeja de Tickets</span>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">Bandeja de Tickets</TooltipContent>
                </Tooltip>
                {isAdmin && (
                    <>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href="/admin"
                                    className={cn(
                                        "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                                        pathname === '/admin' && "bg-accent text-accent-foreground"
                                    )}
                                >
                                    <Shield className="h-5 w-5" />
                                    <span className="sr-only">Panel de Administración</span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">Panel de Administración</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href="/admin/settings"
                                    className={cn(
                                        "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                                        pathname.startsWith('/admin/settings') && "bg-accent text-accent-foreground"
                                    )}
                                >
                                    <Settings className="h-5 w-5" />
                                    <span className="sr-only">Configuración</span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">Configuración</TooltipContent>
                        </Tooltip>
                    </>
                )}
            </nav>
            <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
            </nav>
        </TooltipProvider>
    )
}
