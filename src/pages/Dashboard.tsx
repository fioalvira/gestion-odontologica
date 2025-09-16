
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Clock, Activity, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface DashboardStats {
  todayAppointments: number;
  totalPatients: number;
  weeklyAppointments: number;
  pendingPayments: number;
}

interface TodayAppointment {
  id: string;
  appointment_time: string;
  patient_name: string;
  treatment: string;
  status: string;
}

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    totalPatients: 0,
    weeklyAppointments: 0,
    pendingPayments: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekStart = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

      // Obtener estadísticas
      const [
        { count: todayAppointments },
        { count: totalPatients },
        { count: weeklyAppointments },
        { count: pendingPayments },
      ] = await Promise.all([
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('appointment_date', today)
          .neq('status', 'cancelada'),
        supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('active', true),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('appointment_date', weekStart)
          .neq('status', 'cancelada'),
        supabase
          .from('consultations')
          .select('*', { count: 'exact', head: true })
          .eq('payment_status', 'pendiente'),
      ]);

      setStats({
        todayAppointments: todayAppointments || 0,
        totalPatients: totalPatients || 0,
        weeklyAppointments: weeklyAppointments || 0,
        pendingPayments: pendingPayments || 0,
      });

      // Obtener citas de hoy con detalles
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_time,
          treatment,
          status,
          patients (full_name)
        `)
        .eq('appointment_date', today)
        .neq('status', 'cancelada')
        .order('appointment_time');

      if (appointments) {
        const formattedAppointments = appointments.map(apt => ({
          id: apt.id,
          appointment_time: apt.appointment_time,
          patient_name: (apt.patients as any)?.full_name || 'Paciente desconocido',
          treatment: apt.treatment,
          status: apt.status,
        }));
        setTodayAppointments(formattedAppointments);
      }

    } catch (error) {
      console.error('Error al obtener datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmada': return 'default';
      case 'completada': return 'secondary';
      case 'programada': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'programada': return 'Programada';
      case 'confirmada': return 'Confirmada';
      case 'completada': return 'Completada';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel Principal</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/pacientes/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Paciente
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/calendario">
              <Calendar className="h-4 w-4 mr-2" />
              Nueva Cita
            </Link>
          </Button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Citas programadas para hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              Pacientes activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.weeklyAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Citas programadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Consultas sin pagar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Citas de hoy */}
      <Card>
        <CardHeader>
          <CardTitle>Citas de Hoy</CardTitle>
          <CardDescription>
            Agenda del día {format(new Date(), "d 'de' MMMM", { locale: es })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No hay citas programadas para hoy</p>
              <p className="text-sm text-muted-foreground mt-2">
                ¡Aprovecha para ponerte al día con otras tareas!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">
                        {appointment.appointment_time.slice(0, 5)}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{appointment.patient_name}</p>
                      <p className="text-sm text-muted-foreground">{appointment.treatment}</p>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(appointment.status)}>
                    {getStatusText(appointment.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
