
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { Loader2, Shield, Users } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'odontologa' | 'secretaria';
  active: boolean;
  created_at: string;
}

export const RoleManager = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  // Only allow odontologa role to manage user roles
  if (profile?.role !== 'odontologa') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-destructive">Acceso Denegado</CardTitle>
          <CardDescription className="text-center">
            Solo los administradores pueden gestionar roles de usuario.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los usuarios',
          variant: 'destructive',
        });
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: 'odontologa' | 'secretaria') => {
    if (userId === profile?.id && newRole !== profile.role) {
      toast({
        title: 'Acción no permitida',
        description: 'No puedes cambiar tu propio rol',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingUser(userId);
    try {
      console.log(`Updating user ${userId} role to ${newRole}`);
      
      // Use the secure server-side function to update the role
      const { data, error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) {
        console.error('Error updating user role:', error);
        toast({
          title: 'Error al actualizar rol',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        console.log('Role updated successfully:', data);
        toast({
          title: 'Rol actualizado',
          description: `El rol del usuario ha sido actualizado a ${newRole}`,
        });
        
        // Refresh the users list
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado al actualizar el rol',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'odontologa' ? 'default' : 'secondary';
  };

  const getRoleDisplayName = (role: string) => {
    return role === 'odontologa' ? 'Odontóloga' : 'Secretaria';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando usuarios...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Gestión de Roles</CardTitle>
        </div>
        <CardDescription>
          Administra los roles y permisos de los usuarios del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">{user.full_name || user.email}</h3>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                    {!user.active && (
                      <Badge variant="destructive">Inactivo</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Registrado: {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={user.role}
                    onValueChange={(newRole: 'odontologa' | 'secretaria') => 
                      handleRoleUpdate(user.id, newRole)
                    }
                    disabled={updatingUser === user.id || user.id === profile?.id}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="secretaria">Secretaria</SelectItem>
                      <SelectItem value="odontologa">Odontóloga</SelectItem>
                    </SelectContent>
                  </Select>
                  {updatingUser === user.id && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-amber-600" />
            <h4 className="text-sm font-medium text-amber-800">Información de Seguridad</h4>
          </div>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>• Solo los administradores pueden cambiar roles de usuario</li>
            <li>• No puedes cambiar tu propio rol por seguridad</li>
            <li>• Todos los cambios de roles quedan registrados en el sistema</li>
            <li>• Los roles determinan los permisos de acceso en la aplicación</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
