
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, Trophy, Heart } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: MapPin,
      title: "Conocimiento Local",
      description: "Hosts locales que conocen cada detalle de la carrera, de la zona, alrededores, rutas de entrenamiento, mejores restaurantes..."
    },
    {
      icon: Users,
      title: "Comunidad Runner",
      description: "Conecta con corredores que entienden tus rutinas, horarios y la pasión por el running"
    },
    {
      icon: Trophy,
      title: "Precio Justo",
      description: "Sistema de puntos que apoya un modelo de turismo activo más ecológico, responsable y auténtico que fomenta valores como la hospitalidad, la generosidad y la conexión humana"
    },
    {
      icon: Heart,
      title: "Experiencia Auténtica",
      description: "Entre corredores nos entendemos. Esto va más allá de compartir alojamiento. Es compartir pasión, consejos, nervios y metas"
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            ¿Por qué elegir <span className="text-runner-blue-600">Runners Home Exchange</span>?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Más que alojamiento, una experiencia completa para corredores apasionados
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="runner-card text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-runner-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-16">
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
            Viajes solo o acompañado, sabes que te espera alguien que habla tu mismo idioma: el del running
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
