
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MessageSquare, Trophy } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      icon: Search,
      number: 1,
      title: "Busca y Solicita",
      description: "Explora carreras por ubicación, fecha, modalidad y distancia. Envía una solicitud al host local que más te interese."
    },
    {
      icon: MessageSquare,
      number: 2,
      title: "Conecta y Planifica",
      description: "Una vez aceptado, coordina con tu host los detalles de la carrera y logística"
    },
    {
      icon: Trophy,
      number: 3,
      title: "Vive la Experiencia",
      description: "Disfruta del alojamiento, conocimiento local y la compañía de otro friki runner que mejore tu experiencia y rendimiento"
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            ¿Cómo <span className="text-runner-blue-600">Funciona</span>?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tres simples pasos para tu próxima aventura running
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="runner-card text-center relative overflow-hidden">
                <div className="absolute top-4 right-4 w-8 h-8 bg-runner-gradient rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{step.number}</span>
                </div>
                <CardHeader>
                  <div className="w-16 h-16 bg-runner-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
