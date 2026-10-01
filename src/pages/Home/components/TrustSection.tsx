import React from 'react';
import { ScissorsIcon, ShieldCheckIcon, SparklesIcon } from './HomeIcons';

export const TrustSection: React.FC = () => {
  const hallmarks = [
    {
      icon: <ScissorsIcon size={22} />,
      title: 'Atención Profesional',
      description:
        'Técnica depurada y asesoría de imagen individualizada en cada corte y arreglo.',
    },
    {
      icon: <ShieldCheckIcon size={22} />,
      title: 'Estilo y Precisión',
      description:
        'Herramientas profesionales esterilizadas y productos de cuidado capilar de alta gama.',
    },
    {
      icon: <SparklesIcon size={22} />,
      title: 'Experiencia Personalizada',
      description:
        'Un ambiente contemporáneo, cómodo y exclusivo concebido para tu confort.',
    },
  ];

  return (
    <section className="kyrios-trust-section" aria-label="Valores y atributos de la marca">
      <div className="container">
        <div className="row g-4 justify-content-center">
          {hallmarks.map((item, index) => (
            <div key={index} className="col-12 col-md-4">
              <div className="kyrios-trust-item">
                <div className="kyrios-trust-icon-box" aria-hidden="true">
                  {item.icon}
                </div>
                <div>
                  <h3
                    className="kyrios-subtitle-display fs-5 text-white mb-1"
                    style={{ letterSpacing: '0.04em' }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-white-50 small mb-0" style={{ lineHeight: 1.6 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
