
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, User, CheckCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ConsultationForm } from '@/components/consultations/ConsultationForm';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  appointment_time: string;
  duration_minutes: number;
  treatment: string;
  status: string;
  notes: string | null;
  patient: {
    id: string;
    full_name: string;
  };
}

export const TodayAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodayAppointments();
  }, []);

  const fetchTodayAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_time,
          duration_minutes,
          treatment,
          status,
          notes,
          patients (
            id,
            full_name
          )
        `)
        .eq('appointment_date', today)
        .order('appointment_time');

      if (error) {
        console.error('Error al obtener citas:', error);
      } else {
        const formattedAppointments = (data || []).map(appointment => ({
          ...appointment,
          patient: {
            id: appointment.patients?.id || '',
            full_name: appointment.patients?.full_name || 'Paciente no encontrado',
          }
        }));
        setAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error('Error al obtener citas:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (appointmentId: string, patientId: string, patientName: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completada' })
        .eq('id', appointmentId);

      if (error) {
        console.error('Error al marcar cita como completada:', error);
        toast({
          title: 'Error',
          description: 'No se pudo marcar la cita como completada',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Cita completada',
          description: 'La cita ha sido marcada como completada',
        });
        
        // Actualizar la lista
        fetchTodayAppointments();
        
        // Abrir el formulario de consulta
        setSelectedPatient({ id: patientId, name: patientName });
        setShowConsultationForm(true);
      }
    } catch (error) {
      console.error('Error al marcar cita:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'programada':
        return <Badge variant="outline">Programada</Badge>;
      case 'confirmada':
        return <Badge variant="secondary">Confirmada</Badge>;
      case 'completada':
        return <Badge variant="default" className="bg-green-600">Completada</Badge>;
      case 'cancelada':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Citas de Hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Cargando citas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Citas de Hoy
          </CardTitle>
          <CardDescription>
            {format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No hay citas programadas
              </h3>
              <p className="text-sm text-muted-foreground">
                No tienes citas programadas para el día de hoy
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {appointment.appointment_time.slice(0, 5)}
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <User className="h-4 w-4" />
                        {appointment.patient.full_name}
                      </div>
                    </div>
                    <div className="text-sm">
                      <strong>Tratamiento:</strong> {appointment.treatment}
                    </div>
                    {appointment.notes && (
                      <div className="text-xs text-muted-foreground">
                        <strong>Notas:</strong> {appointment.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(appointment.status)}
                    {appointment.status !== 'completada' && appointment.status !== 'cancelada' && (
                      <Button
                        size="sm"
                        onClick={() => markAsCompleted(appointment.id, appointment.patient.id, appointment.patient.full_name)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Marcar Atendida
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear consulta después de marcar como atendida */}
      <Dialog open={showConsultationForm} onOpenChange={setShowConsultationForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Consulta - {selectedPatient?.name}</DialogTitle>
            <DialogDescription>
              La cita ha sido marcada como completada. Ahora registra los detalles de la consulta realizada.
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <ConsultationForm 
              patientId={selectedPatient.id}
              onSuccess={() => {
                setShowConsultationForm(false);
                setSelectedPatient(null);
                toast({
                  title: 'Consulta registrada',
                  description: 'La consulta ha sido registrada correctamente en el historial del paciente',
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
