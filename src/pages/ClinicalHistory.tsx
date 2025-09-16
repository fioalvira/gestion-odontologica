
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/back-button';
import { FileText, Calendar, User, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface ConsultationWithPatient {
  id: string;
  consultation_date: string;
  diagnosis: string;
  treatment_performed: string;
  observations: string | null;
  created_at: string;
  patient: {
    id: string;
    full_name: string;
  };
}

export const ClinicalHistory = () => {
  const [consultations, setConsultations] = useState<ConsultationWithPatient[]>([]);
  const [filteredConsultations, setFilteredConsultations] = useState<ConsultationWithPatient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClinicalHistory();
  }, []);

  useEffect(() => {
    const filtered = consultations.filter(consultation =>
      consultation.patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.treatment_performed.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredConsultations(filtered);
  }, [consultations, searchTerm]);

  const fetchClinicalHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          id,
          consultation_date,
          diagnosis,
          treatment_performed,
          observations,
          created_at,
          patients!inner (
            id,
            full_name
          )
        `)
        .order('consultation_date', { ascending: false });

      if (error) {
        console.error('Error al obtener historial clínico:', error);
      } else {
        const formattedData = (data || []).map(item => ({
          ...item,
          patient: {
            id: item.patients.id,
            full_name: item.patients.full_name,
          }
        }));
        setConsultations(formattedData);
      }
    } catch (error) {
      console.error('Error al obtener historial clínico:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando historial clínico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial Clínico General</h1>
          <p className="text-muted-foreground">
            Registro completo de todas las consultas realizadas
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consultas Registradas
          </CardTitle>
          <CardDescription>
            {consultations.length} consultas en total
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por paciente, diagnóstico o tratamiento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredConsultations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <div className="text-lg font-medium text-muted-foreground">
                {searchTerm ? 'No se encontraron consultas' : 'No hay consultas registradas'}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Las consultas aparecerán aquí cuando se registren'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConsultations.map((consultation) => (
                <Card key={consultation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <Link 
                            to={`/pacientes/${consultation.patient.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {consultation.patient.full_name}
                          </Link>
                        </div>
                        <CardTitle className="text-lg">{consultation.diagnosis}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(consultation.consultation_date), 'dd/MM/yyyy', { locale: es })}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-1">Tratamiento Realizado</h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        {consultation.treatment_performed}
                      </p>
                    </div>

                    {consultation.observations && (
                      <div>
                        <h4 className="font-medium mb-1">Observaciones</h4>
                        <p className="text-sm text-muted-foreground">
                          {consultation.observations}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                      <span>
                        Registrado: {format(new Date(consultation.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </span>
                      <Link 
                        to={`/pacientes/${consultation.patient.id}/historial`}
                        className="text-primary hover:underline"
                      >
                        Ver historial completo →
                      </Link>
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

export default ClinicalHistory;
