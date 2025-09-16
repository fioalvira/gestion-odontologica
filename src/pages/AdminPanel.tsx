
import { UserInvite } from '@/components/admin/UserInvite';
import { BackButton } from '@/components/ui/back-button';

export const AdminPanel = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <BackButton variant="outline" />
          <div></div>
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestiona usuarios y configuraciones del sistema</p>
        </div>
        
        <div className="flex justify-center">
          <UserInvite />
        </div>
      </div>
    </div>
  );
};
