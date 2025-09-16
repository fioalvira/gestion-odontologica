import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';
import { Plus, FileText, Camera, Calendar, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ConsultationForm } from '@/components/consultations/ConsultationForm';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface Patient {
  id: string;
  full_name: string;
}

interface Consultation {
  id: string;
  consultation_date: string;
  diagnosis: string;
  treatment_performed: string;
  observations: string | null;
  next_appointment: string | null;
  created_at: string;
  images: ConsultationImage[];
}

interface ConsultationImage {
  id: string;
  image_url: string;
  description: string | null;
  image_type: string;
}

export const PatientHistory = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [deletingConsultation, setDeletingConsultation] = useState<string | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchPatientHistory();
    }
  }, [id]);

  const fetchPatientHistory = async () => {
    try {
      // Obtener información del paciente
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id, full_name')
        .eq('id', id)
        .single();

      if (patientError) {
        console.error('Error al obtener paciente:', patientError);
        return;
      }

      setPatient(patientData);

      // Obtener historial de consultas con imágenes
      const { data: consultationsData, error: consultationsError } = await supabase
        .from('consultations')
        .select(`
          id,
          consultation_date,
          diagnosis,
          treatment_performed,
          observations,
          next_appointment,
          created_at,
          consultation_images (
            id,
            image_url,
            description,
            image_type
          )
        `)
        .eq('patient_id', id)
        .order('consultation_date', { ascending: false });

      if (consultationsError) {
        console.error('Error al obtener consultas:', consultationsError);
      } else {
        const formattedConsultations = (consultationsData || []).map(consultation => ({
          ...consultation,
          images: consultation.consultation_images || [],
        }));
        setConsultations(formattedConsultations);
      }

    } catch (error) {
      console.error('Error al obtener historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConsultation = async (consultationId: string) => {
    setDeletingConsultation(consultationId);
    try {
      const { error } = await supabase
        .from('consultations')
        .delete()
        .eq('id', consultationId);

      if (error) {
        console.error('Error al eliminar consulta:', error);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar la consulta',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Consulta eliminada',
          description: 'La consulta ha sido eliminada correctamente',
        });
        fetchPatientHistory(); // Recargar el historial
      }
    } catch (error) {
      console.error('Error al eliminar consulta:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setDeletingConsultation(null);
    }
  };

  const getImageTypeText = (type: string) => {
    switch (type) {
      case 'before': return 'Antes';
      case 'after': return 'Después';
      case 'xray': return 'Radiografía';
      case 'other': return 'Otro';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando historial médico...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-medium text-muted-foreground">Paciente no encontrado</p>
        <div className="flex gap-4 justify-center mt-4">
          <BackButton />
          <Button asChild>
            <Link to="/pacientes">
              Ir a Pacientes
            </Link>
          </Button>
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
            <h1 className="text-3xl font-bold tracking-tight">
              Historial Médico - {patient.full_name}
            </h1>
            <p className="text-muted-foreground">
              Registro completo de consultas y tratamientos
            </p>
          </div>
        </div>
        <Dialog open={showConsultationForm} onOpenChange={setShowConsultationForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Consulta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Consulta - {patient.full_name}</DialogTitle>
              <DialogDescription>
                Registra una nueva consulta y tratamiento realizado
              </DialogDescription>
            </DialogHeader>
            <ConsultationForm 
              patientId={id!}
              onSuccess={() => {
                setShowConsultationForm(false);
                fetchPatientHistory();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {consultations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No hay consultas registradas
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Comienza el historial médico del paciente registrando su primera consulta
            </p>
            <Button onClick={() => setShowConsultationForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primera Consulta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {consultations.map((consultation) => (
            <Card key={consultation.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{consultation.diagnosis}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(consultation.consultation_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </span>
                    </CardDescription>
                  </div>
                  {profile?.role === 'odontologa' && (
                    <DeleteConfirmation
                      title="¿Eliminar consulta?"
                      description="¿Estás seguro de que quieres eliminar esta consulta? Esta acción no se puede deshacer."
                      onConfirm={() => handleDeleteConsultation(consultation.id)}
                      loading={deletingConsultation === consultation.id}
                    >
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={deletingConsultation === consultation.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DeleteConfirmation>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Tratamiento Realizado</h4>
                  <p className="text-sm bg-muted p-3 rounded-lg">
                    {consultation.treatment_performed}
                  </p>
                </div>

                {consultation.observations && (
                  <div>
                    <h4 className="font-medium mb-2">Observaciones</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                      {consultation.observations}
                    </p>
                  </div>
                )}

                {consultation.next_appointment && (
                  <div>
                    <h4 className="font-medium mb-2">Próxima Cita</h4>
                    <p className="text-sm">
                      {format(new Date(consultation.next_appointment), "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </div>
                )}

                {consultation.images.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Imágenes ({consultation.images.length})
                    </h4>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {consultation.images.map((image) => (
                        <div key={image.id} className="space-y-2">
                          <div className="relative group">
                            <img
                              src={image.image_url}
                              alt={image.description || 'Imagen de consulta'}
                              className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(image.image_url, '_blank')}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <span className="text-white text-sm font-medium">Ver imagen</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs bg-muted px-2 py-1 rounded">
                              {getImageTypeText(image.image_type)}
                            </span>
                          </div>
                          {image.description && (
                            <p className="text-xs text-muted-foreground">
                              {image.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Registrado el {format(new Date(consultation.created_at), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientHistory;
