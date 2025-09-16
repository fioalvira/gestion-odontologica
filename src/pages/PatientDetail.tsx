import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Calendar, FileText, Phone, Mail, MapPin, AlertCircle, User, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Patient {
  id: string;
  created_at: string;
  full_name: string;
  email: string | null;
  phone: string;
  birth_date: string;
  address: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  medical_history: string | null;
  allergies: string | null;
  active: boolean;
}

interface RecentAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  treatment: string;
  status: string;
}

interface RecentConsultation {
  id: string;
  consultation_date: string;
  diagnosis: string;
  treatment_performed: string;
  cost: number | null;
  payment_status: string;
}

export const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
  const [recentConsultations, setRecentConsultations] = useState<RecentConsultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPatientDetails();
    }
  }, [id]);

  const fetchPatientDetails = async () => {
    try {
      // Obtener datos del paciente
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError) {
        console.error('Error al obtener paciente:', patientError);
        navigate('/pacientes');
        return;
      }

      setPatient(patientData);

      // Obtener citas recientes
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, treatment, status')
        .eq('patient_id', id)
        .order('appointment_date', { ascending: false })
        .limit(5);

      setRecentAppointments(appointmentsData || []);

      // Obtener consultas recientes
      const { data: consultationsData } = await supabase
        .from('consultations')
        .select('id, consultation_date, diagnosis, treatment_performed, cost, payment_status')
        .eq('patient_id', id)
        .order('consultation_date', { ascending: false })
        .limit(5);

      setRecentConsultations(consultationsData || []);

    } catch (error) {
      console.error('Error al obtener detalles del paciente:', error);
    } finally {
      setLoading(false);
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmada': return 'default';
      case 'completada': return 'secondary';
      case 'programada': return 'outline';
      case 'pagado': return 'secondary';
      case 'pendiente': return 'destructive';
      case 'parcial': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'programada': return 'Programada';
      case 'confirmada': return 'Confirmada';
      case 'completada': return 'Completada';
      case 'cancelada': return 'Cancelada';
      case 'pagado': return 'Pagado';
      case 'pendiente': return 'Pendiente';
      case 'parcial': return 'Parcial';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando información del paciente...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-medium text-muted-foreground">Paciente no encontrado</p>
        <Button asChild className="mt-4">
          <Link to="/pacientes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Pacientes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/pacientes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{patient.full_name}</h1>
            <p className="text-muted-foreground">
              {calculateAge(patient.birth_date)} años • Paciente desde {format(new Date(patient.created_at), 'MMMM yyyy', { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/pacientes/${patient.id}/editar`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/pacientes/${patient.id}/historial`}>
              <FileText className="h-4 w-4 mr-2" />
              Ver Historial
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Información personal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
                  <p className="text-lg">{patient.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</label>
                  <p className="text-lg">
                    {format(new Date(patient.birth_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                    <span className="text-sm text-muted-foreground ml-2">({calculateAge(patient.birth_date)} años)</span>
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                    <p>{patient.phone}</p>
                  </div>
                </div>
                {patient.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p>{patient.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {patient.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                    <p>{patient.address}</p>
                  </div>
                </div>
              )}

              {(patient.emergency_contact || patient.emergency_phone) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Contacto de Emergencia
                    </h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {patient.emergency_contact && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                          <p>{patient.emergency_contact}</p>
                        </div>
                      )}
                      {patient.emergency_phone && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                          <p>{patient.emergency_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Historia médica */}
          {(patient.medical_history || patient.allergies) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Información Médica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.medical_history && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Historia Médica</label>
                    <p className="mt-1 text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                      {patient.medical_history}
                    </p>
                  </div>
                )}
                {patient.allergies && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Alergias</label>
                    <p className="mt-1 text-sm bg-destructive/10 text-destructive-foreground p-3 rounded-lg border border-destructive/20">
                      {patient.allergies}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Panel lateral - Actividad reciente */}
        <div className="space-y-6">
          {/* Citas recientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Citas Recientes
              </CardTitle>
              <CardDescription>
                Últimas {recentAppointments.length} citas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay citas registradas
                </p>
              ) : (
                <div className="space-y-3">
                  {recentAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{appointment.treatment}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(appointment.appointment_date), "d MMM", { locale: es })} - {appointment.appointment_time.slice(0, 5)}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(appointment.status)} className="text-xs">
                        {getStatusText(appointment.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Consultas recientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Consultas Recientes
              </CardTitle>
              <CardDescription>
                Últimas {recentConsultations.length} consultas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentConsultations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay consultas registradas
                </p>
              ) : (
                <div className="space-y-3">
                  {recentConsultations.map((consultation) => (
                    <div key={consultation.id} className="p-2 border rounded space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{consultation.diagnosis}</p>
                        <Badge variant={getStatusBadgeVariant(consultation.payment_status)} className="text-xs">
                          {getStatusText(consultation.payment_status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(consultation.consultation_date), "d MMM yyyy", { locale: es })}
                      </p>
                      <p className="text-xs">{consultation.treatment_performed}</p>
                      {consultation.cost && (
                        <p className="text-xs font-medium">
                          ${consultation.cost.toLocaleString()}
                        </p>
                      )}
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

export default PatientDetail;
