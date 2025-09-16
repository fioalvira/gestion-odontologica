
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export const UserInvite = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Only allow odontologa role to create users
  if (profile?.role !== 'odontologa') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-destructive">Acceso Denegado</CardTitle>
          <CardDescription className="text-center">
            Solo los administradores pueden crear nuevas cuentas de usuario.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const generateSecurePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleInviteUser = async () => {
    if (!email) {
      toast({
        title: 'Campo requerido',
        description: 'Por favor ingresa el email del usuario',
        variant: 'destructive',
      });
      return;
    }

    if (!password) {
      toast({
        title: 'Campo requerido',
        description: 'Por favor ingresa una contraseña segura',
        variant: 'destructive',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Email inválido',
        description: 'Por favor ingresa un email válido',
        variant: 'destructive',
      });
      return;
    }

    // Password strength validation
    if (password.length < 8) {
      toast({
        title: 'Contraseña débil',
        description: 'La contraseña debe tener al menos 8 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Creating user account for:', email);
      
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });

      if (authError) {
        console.error('Error creating user:', authError);
        toast({
          title: 'Error al crear usuario',
          description: authError.message,
          variant: 'destructive',
        });
        return;
      }

      if (authData.user) {
        // The profile will be automatically created by the trigger
        console.log('User created successfully:', authData.user.id);
        
        // Log the user creation action
        const { error: logError } = await supabase
          .rpc('log_user_action', {
            p_action: 'user_created_by_admin',
            p_table_name: 'profiles',
            p_record_id: authData.user.id,
            p_new_values: { email: email, created_by: profile.id }
          });

        if (logError) {
          console.warn('Failed to log user creation:', logError);
        }
      }

      setSuccess(true);
      toast({
        title: 'Usuario creado exitosamente',
        description: 'La cuenta ha sido creada. El usuario puede acceder con las credenciales proporcionadas.',
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado al crear el usuario',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-center">¡Cuenta Creada!</CardTitle>
          <CardDescription className="text-center">
            La cuenta ha sido creada exitosamente. El usuario puede acceder al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Credenciales de acceso:
          </p>
          <div className="bg-muted p-3 rounded-md text-sm">
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Contraseña:</strong> {password}</p>
          </div>
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-4">
            <strong>Importante:</strong> Guarda estas credenciales de forma segura y compártelas con el usuario de manera privada.
          </div>
          <Button 
            onClick={() => window.location.href = '/login'} 
            className="w-full mt-4"
          >
            Ir al Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex justify-center mb-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Mail className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle>Crear Cuenta de Usuario</CardTitle>
        <CardDescription>
          Configura las credenciales de acceso para un nuevo usuario
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email *
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            disabled={loading}
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Contraseña *
          </label>
          <div className="flex gap-2">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              disabled={loading}
              required
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPassword(generateSecurePassword())}
              disabled={loading}
            >
              Generar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            La contraseña debe tener al menos 8 caracteres
          </p>
        </div>
        <Button 
          onClick={handleInviteUser} 
          className="w-full" 
          disabled={loading || !email || !password}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Cuenta de Usuario
        </Button>
        <div className="text-xs text-muted-foreground text-center">
          El usuario tendrá rol de "secretaria" por defecto. Los roles se pueden cambiar desde la configuración.
        </div>
      </CardContent>
    </Card>
  );
};
