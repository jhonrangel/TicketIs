'use client';
import { AppLayout } from '@/components/app-layout';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.replace('/');
      } else if (user.role !== 'admin') {
        router.replace('/dashboard');
      }
    }
  }, [isUserLoading, user, router]);


  if (isUserLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background animated-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
