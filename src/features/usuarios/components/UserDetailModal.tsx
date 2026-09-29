import React from 'react';
import Modal from '../../../shared/ui/Modal';
import Button from '../../../shared/ui/Button';
import type { UsuarioDetalle } from '../types/usuarios.types';

interface UserDetailModalProps {
  usuario: UsuarioDetalle | null;
  onClose: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ usuario, onClose }) => {
  if (!usuario) return null;

  return (
    <Modal
      isOpen={Boolean(usuario)}
      onClose={onClose}
      title="Ficha de Usuario"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className="text-center mb-4">
        <div
          className="bg-light rounded-circle d-inline-flex justify-content-center align-items-center mb-3 border shadow-sm"
          style={{ width: '80px', height: '80px' }}
        >
          <span className="fs-1 text-primary fw-bold">
            {usuario.nombre.charAt(0)}
            {usuario.apellido.charAt(0)}
          </span>
        </div>
        <h4 className="fw-bold mb-1">
          {usuario.nombre} {usuario.apellido}
        </h4>
        <span
          className={`badge ${
            usuario.estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary'
          }`}
        >
          {usuario.estado}
        </span>
      </div>

      <hr />

      <div className="mb-3">
        <strong className="text-muted small d-block">Correo Electrónico:</strong>
        <span className="fs-6">{usuario.email}</span>
      </div>

      {usuario.telefono && (
        <div className="mb-3">
          <strong className="text-muted small d-block">Teléfono:</strong>
          <span className="fs-6">{usuario.telefono}</span>
        </div>
      )}

      {usuario.porcentajeComision !== undefined && (
        <div className="mb-3">
          <strong className="text-muted small d-block">Comisión de Barbero:</strong>
          <span className="fs-6 fw-bold text-success">
            {usuario.porcentajeComision}%
          </span>
        </div>
      )}

      <div className="mb-2">
        <strong className="text-muted small d-block">Tipo de Perfil:</strong>
        <span className="badge bg-primary fs-6">{usuario.tipoPerfil}</span>
      </div>
    </Modal>
  );
};

export default UserDetailModal;
