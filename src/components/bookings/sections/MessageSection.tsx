
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { BookingFormData } from "@/types/booking";

interface MessageSectionProps {
  formData: Partial<BookingFormData>;
  setFormData: (data: Partial<BookingFormData>) => void;
}

export const MessageSection = ({ formData, setFormData }: MessageSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>Mensaje Personal al Host</span>
        </CardTitle>
        <CardDescription>
          Cuéntale al host sobre ti y por qué quieres vivir esta experiencia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          value={formData.request_message || ''}
          onChange={(e) => setFormData({ ...formData, request_message: e.target.value })}
          placeholder="Cuéntale al host sobre ti: ¿Por qué quieres correr esta carrera? ¿Qué esperas de la experiencia? ¿Cuál es tu experiencia en running? ¿Tienes alguna pregunta específica?"
          className="min-h-[120px]"
          maxLength={500}
          required
        />
        <p className="text-sm text-gray-500 mt-2">
          {(formData.request_message || '').length}/500 caracteres
        </p>
        <div className="mt-3 text-sm text-gray-600">
          <p className="font-medium mb-1">Sugerencias de qué incluir:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Tu experiencia en running y por qué te apasiona</li>
            <li>Motivación específica para esta carrera</li>
            <li>Qué esperas aprender de la experiencia local</li>
            <li>Preguntas sobre la carrera o la zona</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
