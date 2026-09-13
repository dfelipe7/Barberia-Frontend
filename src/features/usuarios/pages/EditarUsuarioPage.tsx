import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Spinner from '../../../shared/ui/Spinner';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useAuth } from '../../../auth/AuthContext';
import { useUsuario, useActualizarUsuario } from '../api/usuarios.facade';
import {
  editarUsuarioSchema,
  type EditarUsuarioFormValues,
} from '../schemas/usuario.schema';

export const EditarUsuarioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const usuarioId = Number(id);
  const navigate = useNavigate();
  const { roles, usuarioDb } = useAuth();
  const esSuperadmin = roles.includes('SUPERADMIN');

  const {
    data: usuario,
    isLoading: cargandoUsuario,
    error: errorUsuario,
  } = useUsuario(usuarioId);

  const actualizarUsuarioMutation = useActualizarUsuario();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditarUsuarioFormValues>({
    resolver: zodResolver(editarUsuarioSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      porcentajeComision: 50,
      esAdministrador: false,
      esBarbero: false,
    },
  });

  const esBarberoWatch = watch('esBarbero');

  useEffect(() => {
    if (usuario) {
      setValue('nombre', usuario.nombre);
      setValue('apellido', usuario.apellido);
      setValue('email', usuario.email);

      const barberoActivo = Boolean(usuario.barbero && usuario.barbero.estado === 'ACTIVO');
      setValue('esBarbero', barberoActivo);

      if (usuario.barbero) {
        setValue('telefono', usuario.barbero.telefono || '');
        setValue('porcentajeComision', usuario.barbero.porcentajeComision ?? 50);
      }

      const adminActivo = Boolean(
        usuario.administrador?.estado === 'ACTIVO' ||
          usuario.rol === 'ADMINISTRADOR' ||
          usuario.rol === 'SUPERADMIN'
      );
      setValue('esAdministrador', adminActivo);
    }
  }, [usuario, setValue]);

  // Protección si un administrador intenta editar a otro administrador sin ser superadmin
  const esAdminObjetivo = Boolean(
    usuario?.administrador?.estado === 'ACTIVO' || usuario?.rol === 'ADMINISTRADOR'
  );
  if (!esSuperadmin && esAdminObjetivo && usuarioDb?.id !== usuarioId) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          No tienes permisos para editar el perfil de otro administrador.
        </div>
        <Link to="/usuarios" className="btn btn-outline-secondary">
          &larr; Volver a Usuarios
        </Link>
      </div>
    );
  }

  if (cargandoUsuario) {
    return <Spinner mensaje="Cargando datos del usuario..." />;
  }

  if (errorUsuario || !usuario) {
    return (
      <div className="container py-4">
        <ErrorMessage
          message={errorUsuario?.message || 'No fue posible encontrar el usuario solicitado.'}
        />
        <Link to="/usuarios" className="btn btn-outline-secondary">
          &larr; Volver
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: EditarUsuarioFormValues) => {
    try {
      await actualizarUsuarioMutation.mutateAsync({
        id: usuarioId,
        datos: {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          ...(data.esBarbero && {
            telefono: data.telefono,
            porcentajeComision: data.porcentajeComision,
          }),
          esAdministrador: data.esAdministrador,
          esBarbero: data.esBarbero,
        },
      });

      navigate('/usuarios', {
        state: { mensaje: `Usuario ${data.nombre} actualizado correctamente.` },
      });
    } catch (err: unknown) {
      console.error('Error al actualizar usuario:', err);
    }
  };

  const errorMessage =
    actualizarUsuarioMutation.error instanceof Error
      ? actualizarUsuarioMutation.error.message
      : null;

  return (
    <div className="container py-4" style={{ maxWidth: '680px' }}>
      <div className="mb-4">
        <Link to="/usuarios" className="btn btn-outline-secondary btn-sm mb-3">
          &larr; Volver a Usuarios
        </Link>
        <h1 className="h2 fw-bold mb-1">
          Editar Usuario: {usuario.nombre} {usuario.apellido}
        </h1>
        <p className="text-muted">
          Actualiza los datos de la cuenta, perfiles y comisiones asociadas.
        </p>
      </div>

      {errorMessage && <ErrorMessage message={errorMessage} />}

      <div className="card shadow-sm border-0 p-4 bg-white rounded">
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
                {...register('email')}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email.message}</div>
              )}
            </div>

            {/* Configuración de Roles / Perfiles */}
            <div className="col-12 pt-2">
              <h5 className="fw-bold mb-3 border-bottom pb-2">Perfiles del Sistema</h5>
              <div className="d-flex flex-column gap-2">
                {esSuperadmin && (
                  <div className="form-check">
                    <input
                      id="esAdministrador"
                      type="checkbox"
                      className="form-check-input"
                      {...register('esAdministrador')}
                    />
                    <label htmlFor="esAdministrador" className="form-check-label fw-semibold">
                      Rol Administrador (Acceso a módulos de gestión y panel)
                    </label>
                  </div>
                )}

                <div className="form-check">
                  <input
                    id="esBarbero"
                    type="checkbox"
                    className="form-check-input"
                    {...register('esBarbero')}
                  />
                  <label htmlFor="esBarbero" className="form-check-label fw-semibold">
                    Perfil Barbero (Habilitado para atender citas y catálogo)
                  </label>
                </div>
              </div>
            </div>

            {/* Campos condicionales de Barbero */}
            {esBarberoWatch && (
              <div className="col-12 p-3 bg-light rounded border">
                <h6 className="fw-bold text-info mb-3">Datos del Perfil de Barbero</h6>
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label htmlFor="telefono" className="form-label fw-semibold">
                      Teléfono de Contacto
                    </label>
                    <input
                      id="telefono"
                      type="tel"
                      className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                      placeholder="+57 300 000 0000"
                      {...register('telefono')}
                    />
                    {errors.telefono && (
                      <div className="invalid-feedback">{errors.telefono.message}</div>
                    )}
                  </div>

                  <div className="col-12 col-sm-6">
                    <label htmlFor="porcentajeComision" className="form-label fw-semibold">
                      Comisión (%)
                    </label>
                    <div className="input-group">
                      <input
                        id="porcentajeComision"
                        type="number"
                        min="0"
                        max="100"
                        className={`form-control ${
                          errors.porcentajeComision ? 'is-invalid' : ''
                        }`}
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
                </div>
              </div>
            )}

            <div className="col-12 mt-4 d-flex justify-content-end gap-2">
              <Link to="/usuarios" className="btn btn-light">
                Cancelar
              </Link>
              <Button
                type="submit"
                variant="primary"
                isLoading={actualizarUsuarioMutation.isPending}
                loadingText="Guardando cambios..."
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarUsuarioPage;
