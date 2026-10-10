'use client';
import { AppSidebar } from '@/components/app-sidebar';
import AppHeader from '@/components/app-header';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
      <div className="flex min-h-screen w-full flex-col">
          <AppSidebar />
          <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <AppHeader />
          {children}
          </div>
      </div>
  );
}
