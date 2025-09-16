
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'odontologa' | 'secretaria';
  phone: string | null;
  active: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Inicializando...');
    
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('AuthProvider: Error obteniendo sesión inicial:', error);
        setLoading(false);
        return;
      }
      
      console.log('AuthProvider: Sesión inicial', session);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: Cambio de estado', event, session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Log successful login
        if (event === 'SIGNED_IN') {
          try {
            await supabase.rpc('log_user_action', {
              p_action: 'user_login',
              p_table_name: 'profiles',
              p_record_id: session.user.id
            });
          } catch (error) {
            console.warn('Failed to log user login:', error);
          }
        }
        
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('AuthProvider: Obteniendo perfil para', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error al obtener perfil:', error);
        
        // If profile doesn't exist and we have authentication, it might be a new user
        if (error.code === 'PGRST116') {
          console.log('Profile not found, might be a new user');
        }
      } else if (data) {
        // Validate profile data
        if (!data.active) {
          console.warn('User profile is inactive');
          await signOut();
          return;
        }
        
        const profileData: Profile = {
          ...data,
          role: data.role as 'odontologa' | 'secretaria'
        };
        console.log('AuthProvider: Perfil obtenido', profileData);
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error al obtener perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthProvider: Cerrando sesión...');
      
      // Log the logout action before signing out
      if (user?.id) {
        try {
          await supabase.rpc('log_user_action', {
            p_action: 'user_logout',
            p_table_name: 'profiles',
            p_record_id: user.id
          });
        } catch (error) {
          console.warn('Failed to log user logout:', error);
        }
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error al cerrar sesión:', error);
      }
      
      // Clear local state
      setSession(null);
      setUser(null);
      setProfile(null);
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
