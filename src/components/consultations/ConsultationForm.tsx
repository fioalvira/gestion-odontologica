
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

const consultationSchema = z.object({
  consultation_date: z.string().min(1, 'La fecha es requerida'),
  diagnosis: z.string().min(1, 'El diagnóstico es requerido'),
  treatment_performed: z.string().min(1, 'El tratamiento es requerido'),
  observations: z.string().optional(),
  next_appointment: z.string().optional(),
});

type ConsultationForm = z.infer<typeof consultationSchema>;

interface ConsultationFormProps {
  patientId: string;
  onSuccess: () => void;
}

interface ImageUpload {
  file: File;
  preview: string;
  type: 'before' | 'after' | 'xray' | 'other';
  description: string;
}

export const ConsultationForm = ({ patientId, onSuccess }: ConsultationFormProps) => {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImageUpload[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<ConsultationForm>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      consultation_date: new Date().toISOString().split('T')[0],
      diagnosis: '',
      treatment_performed: '',
      observations: '',
      next_appointment: '',
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        setImages(prev => [...prev, {
          file,
          preview,
          type: 'other',
          description: '',
        }]);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const updateImageData = (index: number, field: 'type' | 'description', value: string) => {
    setImages(prev => {
      const newImages = [...prev];
      newImages[index] = { ...newImages[index], [field]: value };
      return newImages;
    });
  };

  const uploadImages = async (consultationId: string) => {
    const uploadPromises = images.map(async (imageData) => {
      const fileExt = imageData.file.name.split('.').pop();
      const fileName = `${consultationId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('consultation-images')
        .upload(fileName, imageData.file);

      if (uploadError) {
        console.error('Error al subir imagen:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('consultation-images')
        .getPublicUrl(fileName);

      return {
        consultation_id: consultationId,
        image_url: publicUrl,
        description: imageData.description || null,
        image_type: imageData.type,
      };
    });

    const imageRecords = await Promise.all(uploadPromises);
    const validImageRecords = imageRecords.filter(record => record !== null);

    if (validImageRecords.length > 0) {
      const { error: imagesError } = await supabase
        .from('consultation_images')
        .insert(validImageRecords);

      if (imagesError) {
        console.error('Error al guardar registros de imágenes:', imagesError);
      }
    }
  };

  const onSubmit = async (data: ConsultationForm) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes estar autenticado para crear consultas',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const consultationData = {
        patient_id: patientId,
        consultation_date: data.consultation_date,
        diagnosis: data.diagnosis,
        treatment_performed: data.treatment_performed,
        observations: data.observations || null,
        next_appointment: data.next_appointment || null,
        created_by: user.id,
      };

      const { data: consultation, error } = await supabase
        .from('consultations')
        .insert([consultationData])
        .select()
        .single();

      if (error) throw error;

      // Subir imágenes si existen
      if (images.length > 0) {
        await uploadImages(consultation.id);
      }

      toast({
        title: 'Consulta registrada',
        description: 'La consulta ha sido registrada correctamente',
      });

      onSuccess();
    } catch (error) {
      console.error('Error al crear consulta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar la consulta',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="consultation_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Consulta *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="diagnosis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Diagnóstico *</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Caries dental en molar superior derecho" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="treatment_performed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tratamiento Realizado *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe detalladamente el tratamiento realizado..."
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observaciones</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observaciones adicionales, recomendaciones..."
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="next_appointment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Próxima Cita</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sección de imágenes */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Imágenes</label>
            <p className="text-xs text-muted-foreground mb-3">
              Sube imágenes relacionadas con la consulta (radiografías, antes/después, etc.)
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir Imágenes
              </Button>
            </div>
          </div>

          {images.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {images.map((image, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-3">
                  <div className="relative">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Select
                      value={image.type}
                      onValueChange={(value) => updateImageData(index, 'type', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="before">Antes</SelectItem>
                        <SelectItem value="after">Después</SelectItem>
                        <SelectItem value="xray">Radiografía</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Descripción (opcional)"
                      value={image.description}
                      onChange={(e) => updateImageData(index, 'description', e.target.value)}
                      className="h-8"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Guardar Consulta
          </Button>
        </div>
      </form>
    </Form>
  );
};
