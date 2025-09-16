
import { BackButton } from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserInvite } from '@/components/admin/UserInvite';
import { RoleManager } from '@/components/admin/RoleManager';
import { useAuth } from '@/components/auth/AuthProvider';
import { Settings, Users, UserPlus, Shield } from 'lucide-react';

export const Configuration = () => {
  const { profile } = useAuth();

  // Only allow odontologa role to access configuration
  if (profile?.role !== 'odontologa') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-destructive">Acceso Denegado</h1>
            <p className="text-muted-foreground">
              Solo los administradores pueden acceder a la configuración del sistema.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">
            Administra la configuración del sistema y los usuarios
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Gestión de Usuarios
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <CardTitle>Crear Nuevo Usuario</CardTitle>
                </div>
                <CardDescription>
                  Agrega nuevos usuarios al sistema con credenciales seguras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserInvite />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <CardTitle>Información del Sistema</CardTitle>
                </div>
                <CardDescription>
                  Estado actual de la seguridad y configuración
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm font-medium text-green-800">Row Level Security</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Activo</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm font-medium text-green-800">Autenticación</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Configurado</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm font-medium text-green-800">Auditoría</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Activa</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Todas las configuraciones de seguridad están activas y funcionando correctamente.
                </div>
              </CardContent>
            </Card>
          </div>

          <RoleManager />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Configuración de Seguridad</CardTitle>
              </div>
              <CardDescription>
                Configuraciones avanzadas de seguridad del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">✅ Medidas de Seguridad Implementadas</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Row Level Security (RLS) habilitado en todas las tablas</li>
                    <li>• Control de acceso basado en roles (RBAC)</li>
                    <li>• Auditoría de acciones de usuarios</li>
                    <li>• Validación de entrada en formularios</li>
                    <li>• Funciones de seguridad del lado del servidor</li>
                    <li>• Políticas de almacenamiento seguro</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">🔒 Políticas de Seguridad</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Solo usuarios autenticados pueden acceder a los datos</li>
                    <li>• Los administradores tienen permisos completos</li>
                    <li>• Las secretarias tienen permisos limitados</li>
                    <li>• No se permite la escalada de privilegios</li>
                    <li>• Todas las acciones sensibles son registradas</li>
                  </ul>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="font-medium text-amber-800 mb-2">⚠️ Recomendaciones Adicionales</h3>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Cambiar contraseñas regularmente</li>
                    <li>• Revisar los logs de auditoría periódicamente</li>
                    <li>• Mantener el sistema actualizado</li>
                    <li>• Capacitar a los usuarios en buenas prácticas de seguridad</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuration;
