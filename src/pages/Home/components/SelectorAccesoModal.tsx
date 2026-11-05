import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { User, Scissors, ArrowRight } from 'lucide-react';
import Modal from '../../../shared/ui/Modal';
import { obtenerNegocioSlugActivo } from '../../../shared/lib/http/axios';
import './SelectorAccesoModal.css';

interface SelectorAccesoModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug?: string;
}

export const SelectorAccesoModal: React.FC<SelectorAccesoModalProps> = ({ isOpen, onClose, slug: propSlug }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug: paramSlug } = useParams<{ slug?: string }>();
  const slug = propSlug || paramSlug || obtenerNegocioSlugActivo() || '';

  const rutaCliente = slug
    ? `/${slug}/cliente/iniciar-sesion?returnTo=${encodeURIComponent(location.pathname)}`
    : `/cliente/iniciar-sesion?returnTo=${encodeURIComponent(location.pathname)}`;

  const rutaPersonal = slug ? `/${slug}/login` : '/login';

  const handleSelect = (ruta: string) => {
    onClose();
    void navigate(ruta);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="¿Cómo deseas ingresar?" size="md">
      <div className="selector-acceso-grid">
        {/* Opción 1: Cliente */}
        <button
          type="button"
          className="selector-acceso-card"
          onClick={() => handleSelect(rutaCliente)}
        >
          <div>
            <div className="selector-acceso-card__icon">
              <User size={24} />
            </div>
            <h3 className="selector-acceso-card__title">Soy Cliente</h3>
            <p className="selector-acceso-card__desc">
              Inicia sesión con Google para consultar tus citas agendadas, reprogramar turnos o actualizar tus datos.
            </p>
          </div>
          <span className="selector-acceso-card__action">
            Ingresar como Cliente <ArrowRight size={15} />
          </span>
        </button>

        {/* Opción 2: Personal / Barbero */}
        <button
          type="button"
          className="selector-acceso-card selector-acceso-card--staff"
          onClick={() => handleSelect(rutaPersonal)}
        >
          <div>
            <div className="selector-acceso-card__icon">
              <Scissors size={24} />
            </div>
            <h3 className="selector-acceso-card__title">Soy del Equipo</h3>
            <p className="selector-acceso-card__desc">
              Acceso al panel de administración para barberos, recepcionistas y dueños de la barbería.
            </p>
          </div>
          <span className="selector-acceso-card__action">
            Panel de Personal <ArrowRight size={15} />
          </span>
        </button>
      </div>
    </Modal>
  );
};

