
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cleanPhoneNumber, formatUruguayanPhone } from '@/lib/validation';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const PhoneInput = ({ value, onChange, placeholder = "Ej: 098 123 456", className }: PhoneInputProps) => {
  const [displayValue, setDisplayValue] = useState(formatUruguayanPhone(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const cleaned = cleanPhoneNumber(inputValue);
    
    // Limitar a 9 dígitos para Uruguay
    if (cleaned.length <= 9) {
      const formatted = formatUruguayanPhone(cleaned);
      setDisplayValue(formatted);
      onChange(cleaned); // Siempre enviar el valor limpio
    }
  };

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      maxLength={11} // XXX XXX XXX (9 dígitos + 2 espacios)
    />
  );
};
