
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';
import { Plus, Search, Phone, Mail, Calendar, Eye, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  birth_date: string;
  active: boolean;
  created_at: string;
}

export const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingPatient, setDeletingPatient] = useState<string | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const filtered = patients.filter(patient =>
      patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredPatients(filtered);
  }, [patients, searchTerm]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('active', true)
        .order('full_name');

      if (error) {
        console.error('Error al obtener pacientes:', error);
      } else {
        setPatients(data || []);
      }
    } catch (error) {
      console.error('Error al obtener pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    setDeletingPatient(patientId);
    try {
      // Marcar como inactivo en lugar de eliminar completamente
      const { error } = await supabase
        .from('patients')
        .update({ active: false })
        .eq('id', patientId);

      if (error) {
        console.error('Error al eliminar paciente:', error);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el paciente',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Paciente eliminado',
          description: 'El paciente ha sido eliminado correctamente',
        });
        fetchPatients(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error al eliminar paciente:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setDeletingPatient(null);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
            <p className="text-muted-foreground">
              Gestiona la información de tus pacientes
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/pacientes/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Paciente
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
          <CardDescription>
            {patients.length} pacientes registrados
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-lg font-medium text-muted-foreground">
                {searchTerm ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza agregando tu primer paciente'
                }
              </p>
              {!searchTerm && (
                <Button asChild className="mt-4">
                  <Link to="/pacientes/nuevo">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Paciente
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPatients.map((patient) => (
                <Card key={patient.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{patient.full_name}</CardTitle>
                      <Badge variant="secondary">
                        {calculateAge(patient.birth_date)} años
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      {patient.phone}
                    </div>
                    {patient.email && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 mr-2" />
                        {patient.email}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      Registrado: {format(new Date(patient.created_at), 'dd/MM/yyyy', { locale: es })}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link to={`/pacientes/${patient.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link to={`/pacientes/${patient.id}/historial`}>
                          Historial
                        </Link>
                      </Button>
                      {profile?.role === 'odontologa' && (
                        <DeleteConfirmation
                          title="¿Eliminar paciente?"
                          description={`¿Estás seguro de que quieres eliminar a ${patient.full_name}? Esta acción no se puede deshacer.`}
                          onConfirm={() => handleDeletePatient(patient.id)}
                          loading={deletingPatient === patient.id}
                        >
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={deletingPatient === patient.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DeleteConfirmation>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Patients;
