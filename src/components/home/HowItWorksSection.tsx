
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageCircle, Medal } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      icon: Users,
      title: "Conéctate",
      description: "Encuentra tu match perfecto entre runners locales y viajeros"
    },
    {
      icon: MessageCircle,
      title: "Coordina",
      description: "Planifica juntos la experiencia perfecta de carrera"
    },
    {
      icon: Medal,
      title: "Corre & Disfruta",
      description: "Vive la carrera como local con tips exclusivos"
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            ¿Cómo <span className="text-runner-blue-600">funciona</span>?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tres pasos simples para vivir experiencias de carreras únicas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="runner-card text-center relative">
                <CardHeader>
                  <div className="w-16 h-16 bg-runner-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-runner-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                    {index + 1}
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
