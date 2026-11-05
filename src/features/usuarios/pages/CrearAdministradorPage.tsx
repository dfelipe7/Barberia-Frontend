import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useCrearAdministrador } from '../api/usuarios.facade';
import { mapApiError } from '../../../shared/lib/mapApiError';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import { useToastContext } from '../../../shared/ui/ToastContext';
import {
  crearAdministradorSchema,
  type CrearAdministradorFormValues,
} from '../schemas/usuario.schema';

export const CrearAdministradorPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { showToast } = useToastContext();
  const crearAdminMutation = useCrearAdministrador();

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
    },
  });

  const emailValue = watch('email');

  const onSubmit = async (data: CrearAdministradorFormValues) => {
    const resumen = (
      <div className="d-flex flex-column gap-2 small">
        <div><strong>Nombre:</strong> {data.nombre} {data.apellido || ''}</div>
        <div><strong>Email:</strong> {data.email}</div>
        <div className="text-warning-emphasis mt-2">
          Se creará una cuenta con privilegios de administración. El acceso se realizará mediante Google con este correo.
        </div>
      </div>
    );

    const ok = await confirm({
      title: 'Confirmar creación',
      message: resumen,
      variant: 'primary',
      confirmLabel: 'Crear Administrador',
      cancelLabel: 'Revisar datos',
    });
    if (!ok) return;

    try {
      await crearAdminMutation.mutateAsync({
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
      });

      showToast('success', `Administrador ${data.nombre} creado correctamente.`);
      void navigate('/usuarios', {
        state: { mensaje: `¡Administrador ${data.nombre} creado con éxito!` },
      });
    } catch (err: unknown) {
      showToast('danger', mapApiError(err));
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

            <div className="col-12">
              <div className="alert alert-info d-flex align-items-center gap-2 py-2 px-3 rounded-3 small mb-0">
                <Info size={18} className="flex-shrink-0" />
                <span>
                  <strong>Autenticación con Google:</strong> El administrador no requiere contraseña. Podrá iniciar sesión directamente usando su cuenta de Google ({emailValue || 'correo ingresado'}).
                </span>
              </div>
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
