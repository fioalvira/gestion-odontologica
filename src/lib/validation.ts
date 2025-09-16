
import { z } from 'zod';

// Validación para números de teléfono uruguayos (9 dígitos)
export const uruguayanPhoneSchema = z.string()
  .min(9, 'El número de teléfono debe tener 9 dígitos')
  .max(9, 'El número de teléfono debe tener 9 dígitos')
  .regex(/^\d{9}$/, 'El número de teléfono debe contener solo números');

// Función para formatear números de teléfono uruguayos
export const formatUruguayanPhone = (phone: string): string => {
  // Remover cualquier caracter que no sea número
  const cleaned = phone.replace(/\D/g, '');
  
  // Formatear como XXX XXX XXX
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`;
  }
  
  return cleaned;
};

// Función para limpiar el número de teléfono (solo números)
export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};
