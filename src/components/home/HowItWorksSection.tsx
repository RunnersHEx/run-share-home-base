
const HowItWorksSection = () => {
  const steps = [
    {
      number: 1,
      title: "Busca y Solicita",
      description: "Explora carreras por ubicación y fecha. Envía una solicitud al host local que más te interese."
    },
    {
      number: 2,
      title: "Conecta y Planifica",
      description: "Una vez aceptado, coordina con tu host los detalles del viaje, entrenamiento y logística de carrera."
    },
    {
      number: 3,
      title: "Vive la Experiencia",
      description: "Disfruta del alojamiento, conocimiento local y la compañía de un fellow runner en tu carrera."
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            ¿Cómo <span className="text-runner-blue-600">Funciona</span>?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tres simples pasos para tu próxima aventura running
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-20 h-20 bg-runner-gradient rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                {step.number}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
