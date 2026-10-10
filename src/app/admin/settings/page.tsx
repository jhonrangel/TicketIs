'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManagementPanel } from '@/components/admin/management-panel';
import { RootCausePanel } from '@/components/admin/root-cause-panel';
import { useUser, useCollection } from '@/firebase';
import { AdminUserList } from '@/components/admin/admin-user-list';
import { BodegaData, CuentaData, RootCauseData, SistemaData, User } from '@/lib/types';


export default function SettingsPage() {
  const { user: currentUser, isUserLoading } = useUser();
  const { data: allUsers = [], loading: loadingUsers } = useCollection<User>('users');
  const { data: bodegas = [], loading: loadingBodegas } = useCollection<BodegaData>('bodegas');
  const { data: cuentas = [], loading: loadingCuentas } = useCollection<CuentaData>('cuentas');
  const { data: sistemas = [], loading: loadingSistemas } = useCollection<SistemaData>('sistemas');
  const { data: rootCauses = [], loading: loadingRootCauses } = useCollection<RootCauseData>('rootCauses');
  
  const isLoading = isUserLoading || loadingUsers || loadingBodegas || loadingCuentas || loadingSistemas || loadingRootCauses;


  return (
    <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
          <p className="text-muted-foreground">
            Gestiona los recursos, clasificaciones y usuarios para la operación
            de la plataforma.
          </p>
        </div>
      </div>
      <Tabs defaultValue="resources" className="mt-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resources">Recursos</TabsTrigger>
          <TabsTrigger value="rootCauses">Causas Raíz</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
        </TabsList>
        <TabsContent value="resources" className="mt-6">
          <ManagementPanel
            bodegas={bodegas || []}
            cuentas={cuentas || []}
            sistemas={sistemas || []}
            loading={isLoading}
          />
        </TabsContent>
        <TabsContent value="rootCauses" className="mt-6">
          <RootCausePanel
            rootCauses={rootCauses || []}
            loading={isLoading}
            currentUser={currentUser!}
          />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <AdminUserList
            users={allUsers || []}
            loading={isLoading}
            currentUser={currentUser!}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
