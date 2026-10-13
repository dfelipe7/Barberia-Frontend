import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useCrearBarbero } from '../api/barberos.facade';
import { mapApiError } from '../../../shared/lib/mapApiError';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import { useToastContext } from '../../../shared/ui/ToastContext';
import {
  crearBarberoSchema,
  type CrearBarberoFormValues,
} from '../schemas/barbero.schema';

export const CrearBarberoPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { showToast } = useToastContext();
  const crearBarberoMutation = useCrearBarbero();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CrearBarberoFormValues>({
    resolver: zodResolver(crearBarberoSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      porcentajeComision: 50,
    },
  });

  const emailValue = watch('email');

  const onSubmit = async (data: CrearBarberoFormValues) => {
    const resumen = (
      <div className="d-flex flex-column gap-2 small">
        <div><strong>Nombre:</strong> {data.nombre} {data.apellido}</div>
        <div><strong>Email:</strong> {data.email}</div>
        <div><strong>Teléfono:</strong> {data.telefono}</div>
        <div><strong>Comisión:</strong> {data.porcentajeComision}%</div>
        <div className="text-warning-emphasis mt-2">
          Se creará el perfil del barbero en el sistema. El acceso se realizará mediante Google con este correo.
        </div>
      </div>
    );

    const ok = await confirm({
      title: 'Confirmar creación',
      message: resumen,
      variant: 'primary',
      confirmLabel: 'Crear Barbero',
      cancelLabel: 'Revisar datos',
    });
    if (!ok) return;

    try {
      await crearBarberoMutation.mutateAsync({
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        telefono: data.telefono,
        porcentajeComision: data.porcentajeComision,
      });

      showToast('success', `Barbero ${data.nombre} creado correctamente.`);
      navigate('/barberos', {
        state: { mensaje: `¡Barbero ${data.nombre} creado y registrado con éxito!` },
      });
    } catch (err: unknown) {
      showToast('danger', mapApiError(err));
    }
  };

  const errorMessage = crearBarberoMutation.error
  ? mapApiError(crearBarberoMutation.error)
  : null;

  return (
    <div className="container py-4" style={{ maxWidth: '680px' }}>
      <div className="mb-4">
        <Link to="/barberos" className="btn btn-outline-secondary btn-sm mb-3">
          &larr; Volver al Catálogo
        </Link>
        <h1 className="h2 fw-bold mb-1">Registrar Nuevo Barbero</h1>
        <p className="text-muted">
          Registra el perfil profesional del barbero para el sistema y el catálogo.
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
                placeholder="Ej. Mateo"
                {...register('nombre')}
              />
              {errors.nombre && (
                <div className="invalid-feedback">{errors.nombre.message}</div>
              )}
            </div>

            <div className="col-12 col-sm-6">
              <label htmlFor="apellido" className="form-label fw-semibold">
                Apellido <span className="text-danger">*</span>
              </label>
              <input
                id="apellido"
                type="text"
                className={`form-control ${errors.apellido ? 'is-invalid' : ''}`}
                placeholder="Ej. Morales"
                {...register('apellido')}
              />
              {errors.apellido && (
                <div className="invalid-feedback">{errors.apellido.message}</div>
              )}
            </div>

            <div className="col-12 col-sm-6">
              <label htmlFor="email" className="form-label fw-semibold">
                Correo Electrónico <span className="text-danger">*</span>
              </label>
              <input
                id="email"
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="mateo@barberia.com"
                {...register('email')}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email.message}</div>
              )}
            </div>

            <div className="col-12 col-sm-6">
              <label htmlFor="telefono" className="form-label fw-semibold">
                Teléfono de Contacto <span className="text-danger">*</span>
              </label>
              <input
                id="telefono"
                type="tel"
                className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                placeholder="+57 300 123 4567"
                {...register('telefono')}
              />
              {errors.telefono && (
                <div className="invalid-feedback">{errors.telefono.message}</div>
              )}
            </div>

            <div className="col-12 col-sm-6">
              <div className="alert alert-info d-flex align-items-center gap-2 py-2 px-3 rounded-3 small mb-0 h-100">
                <Info size={18} className="flex-shrink-0" />
                <span>
                  <strong>Autenticación con Google:</strong> El barbero accederá con su cuenta de Google ({emailValue || 'correo registrado'}).
                </span>
              </div>
            </div>

            <div className="col-12 col-sm-6">
              <label htmlFor="porcentajeComision" className="form-label fw-semibold">
                Porcentaje de Comisión (%) <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  id="porcentajeComision"
                  type="number"
                  min="0"
                  max="100"
                  className={`form-control ${errors.porcentajeComision ? 'is-invalid' : ''}`}
                  {...register('porcentajeComision', { valueAsNumber: true })}
                />
                <span className="input-group-text">%</span>
              </div>
              {errors.porcentajeComision && (
                <div className="invalid-feedback d-block">
                  {errors.porcentajeComision.message}
                </div>
              )}
            </div>

            <div className="col-12 mt-4 d-flex justify-content-end gap-2">
              <Link to="/barberos" className="btn btn-light">
                Cancelar
              </Link>
              <Button
                type="submit"
                variant="primary"
                isLoading={crearBarberoMutation.isPending}
                loadingText="Registrando..."
              >
                Registrar Barbero
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearBarberoPage;
