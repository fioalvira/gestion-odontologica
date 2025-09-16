
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';
import { TodayAppointments } from '@/components/calendar/TodayAppointments';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  treatment: string;
  status: string;
  patient: {
    full_name: string;
  };
}

export const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetchAppointmentsForDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchAppointmentsForDate = async (date: Date) => {
    setLoading(true);
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          treatment,
          status,
          patients (
            full_name
          )
        `)
        .eq('appointment_date', dateString)
        .order('appointment_time');

      if (error) {
        console.error('Error al obtener citas:', error);
      } else {
        const formattedAppointments = (data || []).map(appointment => ({
          ...appointment,
          patient: {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
            <p className="text-muted-foreground">
              Gestiona las citas y horarios
            </p>
          </div>
        </div>
        <Dialog open={showAppointmentForm} onOpenChange={setShowAppointmentForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Programar Nueva Cita</DialogTitle>
              <DialogDescription>
                Programa una nueva cita para un paciente
              </DialogDescription>
            </DialogHeader>
            <AppointmentForm
              defaultDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
              onSuccess={() => {
                setShowAppointmentForm(false);
                if (selectedDate) {
                  fetchAppointmentsForDate(selectedDate);
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Citas de hoy */}
        <div className="lg:col-span-3">
          <TodayAppointments />
        </div>

        {/* Calendario */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>

        {/* Citas del día seleccionado */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Citas para {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
              </CardTitle>
              <CardDescription>
                {appointments.length} citas programadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Cargando citas...</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No hay citas programadas
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    No tienes citas programadas para esta fecha
                  </p>
                  <Button onClick={() => setShowAppointmentForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Programar Cita
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{appointment.patient.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {appointment.appointment_time.slice(0, 5)} - {appointment.treatment}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground capitalize">
                          {appointment.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
