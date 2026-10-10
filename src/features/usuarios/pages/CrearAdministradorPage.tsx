import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useCrearAdministrador } from '../api/usuarios.facade';
import { mapApiError } from '../../../shared/lib/mapApiError';
import { PasswordRequirementsChecklist } from '../../../shared/components/PasswordRequirementsChecklist';
import {
  crearAdministradorSchema,
  type CrearAdministradorFormValues,
} from '../schemas/usuario.schema';

export const CrearAdministradorPage: React.FC = () => {
  const navigate = useNavigate();
  const crearAdminMutation = useCrearAdministrador();
  const [showPasswordPopover, setShowPasswordPopover] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CrearAdministradorFormValues>({
    resolver: zodResolver(crearAdministradorSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      password: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: CrearAdministradorFormValues) => {
    try {
      await crearAdminMutation.mutateAsync({
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        password: data.password,
      });

      navigate('/usuarios', {
        state: { mensaje: `¡Administrador ${data.nombre} creado con éxito!` },
      });
    } catch (err: unknown) {
      console.error('Error al crear administrador:', err);
    }
  };

  const errorMessage = crearAdminMutation.error ? mapApiError(crearAdminMutation.error) : null;

  return (
    <div className="container py-4" style={{ maxWidth: '640px' }}>
      <div className="mb-4">
        <Link to="/usuarios" className="btn btn-outline-secondary btn-sm mb-3">
          &larr; Volver a Usuarios
        </Link>
        <h1 className="h2 fw-bold mb-1">Crear Administrador</h1>
        <p className="text-muted">
          Registra una nueva cuenta de administrador con acceso de gestión al sistema.
        </p>
      </div>

      {errorMessage && <ErrorMessage message={errorMessage} />}

      <div className="card shadow-sm border-0 p-4 card-surface rounded">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <label htmlFor="nombre" className="form-label fw-semibold">
                Nombre <span className="text-danger">*</span>
              </label>
              <input
                id="nombre"
                type="text"
                className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                placeholder="Ej. Carlos"
                {...register('nombre')}
              />
              {errors.nombre && (
                <div className="invalid-feedback">{errors.nombre.message}</div>
              )}
            </div>

            <div className="col-12 col-sm-6">
              <label htmlFor="apellido" className="form-label fw-semibold">
                Apellido
              </label>
              <input
                id="apellido"
                type="text"
                className={`form-control ${errors.apellido ? 'is-invalid' : ''}`}
                placeholder="Ej. Gómez"
                {...register('apellido')}
              />
              {errors.apellido && (
                <div className="invalid-feedback">{errors.apellido.message}</div>
              )}
            </div>

            <div className="col-12">
              <label htmlFor="email" className="form-label fw-semibold">
                Correo Electrónico <span className="text-danger">*</span>
              </label>
              <input
                id="email"
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="carlos@barberia.com"
                {...register('email')}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email.message}</div>
              )}
            </div>

            <div className="col-12 position-relative">
              <label htmlFor="password" className="form-label fw-semibold">
                Contraseña Temporal <span className="text-danger">*</span>
              </label>
              <input
                id="password"
                type="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Ej. AdminBarberia2026*"
                {...register('password')}
                onFocus={() => setShowPasswordPopover(true)}
                onBlur={() => setShowPasswordPopover(false)}
              />
              {errors.password && (
                <div className="invalid-feedback">{errors.password.message}</div>
              )}
              <PasswordRequirementsChecklist
                password={passwordValue}
                isVisible={showPasswordPopover}
              />
            </div>

            <div className="col-12 mt-4 d-flex justify-content-end gap-2">
              <Link to="/usuarios" className="btn btn-light">
                Cancelar
              </Link>
              <Button
                type="submit"
                variant="primary"
                isLoading={crearAdminMutation.isPending}
                loadingText="Creando..."
              >
                Crear Administrador
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearAdministradorPage;
