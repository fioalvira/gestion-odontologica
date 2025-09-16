
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BackButtonProps {
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  to?: string;
}

export const BackButton = ({ variant = 'ghost', size = 'sm', className, to }: BackButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (to) {
      navigate(to);
      return;
    }

    // Lógica específica según la ruta actual
    const currentPath = location.pathname;
    
    if (currentPath.includes('/pacientes/') && currentPath.includes('/historial')) {
      // Si estamos en el historial de un paciente, volver al detalle del paciente
      const patientId = currentPath.split('/')[2];
      navigate(`/pacientes/${patientId}`);
    } else if (currentPath.includes('/pacientes/') && currentPath.includes('/editar')) {
      // Si estamos editando un paciente, volver al detalle del paciente
      const patientId = currentPath.split('/')[2];
      navigate(`/pacientes/${patientId}`);
    } else if (currentPath.includes('/pacientes/') && !currentPath.includes('/nuevo')) {
      // Si estamos en el detalle de un paciente, volver a la lista de pacientes
      navigate('/pacientes');
    } else if (currentPath === '/pacientes/nuevo') {
      // Si estamos creando un paciente, volver a la lista de pacientes
      navigate('/pacientes');
    } else if (currentPath === '/pacientes') {
      // Si estamos en la lista de pacientes, volver al inicio
      navigate('/');
    } else if (currentPath === '/historial') {
      // Si estamos en el historial general, volver al inicio
      navigate('/');
    } else if (currentPath === '/calendario') {
      // Si estamos en el calendario, volver al inicio
      navigate('/');
    } else {
      // Por defecto, ir al inicio
      navigate('/');
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleBack} className={className}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      Atrás
    </Button>
  );
};
