import React from 'react';
import Modal from '../../../shared/ui/Modal';
import Button from '../../../shared/ui/Button';
import { Package } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductosEnDesarrolloModal: React.FC<Props> = ({ isOpen, onClose }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Productos"
    size="sm"
    footer={<Button variant="primary" onClick={onClose}>Entendido</Button>}
  >
    <div className="text-center py-3">
      <div className="mb-3 text-primary d-flex justify-content-center" aria-hidden="true">
        <Package size={48} />
      </div>
      <h5 className="fw-bold mb-2">Sección en desarrollo</h5>
      <p className="text-surface-muted mb-0 small">
        Muy pronto podrás comprar productos exclusivos de Kyrios Studio
        directamente desde aquí. Mientras tanto, consulta en nuestra sede.
      </p>
    </div>
  </Modal>
);

export default ProductosEnDesarrolloModal;
