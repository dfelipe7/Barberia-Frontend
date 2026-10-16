import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Spinner from '../../../shared/ui/Spinner';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import ComisionSlider from '../../../shared/ui/molecules/ComisionSlider';
import { Lock } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext';
import { useUsuario, useActualizarUsuario } from '../api/usuarios.facade';
import { puedeGestionarEstado } from '../../../shared/lib/autorizacion/jerarquiaRoles';
import type { Rol } from '../../../shared/lib/autorizacion/roles';
import {
  editarUsuarioSchema,
  type EditarUsuarioFormValues,
} from '../schemas/usuario.schema';
import { mapApiError } from '../../../shared/lib/mapApiError';
import { useReturnToPrevious } from '../../../shared/lib/useReturnToPrevious';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import { useToastContext } from '../../../shared/ui/ToastContext';

export const EditarUsuarioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const usuarioId = Number(id);
  const goBack = useReturnToPrevious();
  const confirm = useConfirm();
  const { showToast } = useToastContext();
  const { roles, usuarioDb, refrescarPerfil } = useAuth();
  const editandoPropioPerfil = usuarioDb?.id === usuarioId;
  const rolActorPrincipal = (roles.includes('SUPERADMIN')
    ? 'SUPERADMIN'
    : roles.includes('ADMINISTRADOR')
    ? 'ADMINISTRADOR'
    : 'BARBERO') as Rol;
  const esSuperadmin = rolActorPrincipal === 'SUPERADMIN';

  const {
    data: usuario,
    isLoading: cargandoUsuario,
    error: errorUsuario,
  } = useUsuario(usuarioId);

  const esSuperadminObjetivo = usuario?.rol === 'SUPERADMIN';
  const esAdminObjetivo = Boolean(
    usuario?.administrador?.estado === 'ACTIVO' || usuario?.rol === 'ADMINISTRADOR'
  );
  const noPuedeRevocarAdmin =
    esSuperadminObjetivo || (editandoPropioPerfil && (esAdminObjetivo || esSuperadmin));

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
  const valorComision = watch('porcentajeComision');

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

  if (cargandoUsuario) {
    return <Spinner mensaje="Cargando datos del usuario..." />;
  }

  if (errorUsuario || !usuario) {
    return (
      <div className="container py-4">
        <ErrorMessage
          message={errorUsuario ? mapApiError(errorUsuario) : 'No fue posible encontrar el usuario solicitado.'}
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => goBack({ fallbackTo: '/usuarios' })}
        >
          &larr; Volver
        </button>
      </div>
    );
  }

  // Protección si un usuario intenta editar a otro de jerarquía igual o superior sin ser superadmin
  const rolObjetivo: Rol =
    usuario.administrador?.estado === 'ACTIVO' || usuario.rol === 'ADMINISTRADOR'
      ? 'ADMINISTRADOR'
      : 'BARBERO';
  if (!puedeGestionarEstado(rolActorPrincipal, rolObjetivo) && usuarioDb?.id !== usuarioId) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          No tienes permisos para editar el perfil de otro administrador.
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => goBack({ fallbackTo: '/usuarios' })}
        >
          &larr; Volver
        </button>
      </div>
    );
  }

  const onSubmit = async (data: EditarUsuarioFormValues) => {
    try {
      const teniaAdmin = Boolean(
        usuario?.administrador?.estado === 'ACTIVO' ||
          usuario?.rol === 'ADMINISTRADOR' ||
          usuario?.rol === 'SUPERADMIN'
      );
      const teniaBarbero = Boolean(usuario?.barbero && usuario.barbero.estado === 'ACTIVO');

      // Si desmarca rol de administrador (SUPERADMIN editando a otro admin) -> peligroso
      if (!noPuedeRevocarAdmin && teniaAdmin && !data.esAdministrador) {
        const ok = await confirm({
          title: `¿Revocar rol de Administrador de ${usuario?.nombre}?`,
          message: `El usuario perderá el acceso a las funciones de administración y configuración del sistema.`,
          variant: 'danger',
          confirmLabel: 'Revocar Rol',
        });
        if (!ok) return;
      }

      // Si desmarca perfil de barbero -> advertencia
      if (teniaBarbero && !data.esBarbero) {
        const ok = await confirm({
          title: `¿Desactivar perfil de Barbero de ${usuario?.nombre}?`,
          message: `El perfil de barbero será desactivado y no estará disponible para agendamiento de turnos.`,
          variant: 'warning',
          confirmLabel: 'Desactivar Perfil',
        });
        if (!ok) return;
      }

      // Confirmación general de guardado con resumen de datos modificados
      const resumen = (
        <div className="d-flex flex-column gap-2 small">
          <div><strong>Nombre:</strong> {data.nombre} {data.apellido}</div>
          <div><strong>Email:</strong> {data.email}</div>
          {data.esAdministrador && <div>✓ Rol Administrador activo</div>}
          {data.esBarbero && (
            <>
              <div>✓ Rol Barbero activo</div>
              <div><strong>Teléfono:</strong> {data.telefono}</div>
              <div><strong>Comisión:</strong> {data.porcentajeComision}%</div>
            </>
          )}
          {!data.esAdministrador && !data.esBarbero && (
            <div className="text-warning-emphasis mt-2">
              Este usuario quedará sin roles asignados.
            </div>
          )}
        </div>
      );

      const ok = await confirm({
        title: `Guardar cambios de ${usuario?.nombre}?`,
        message: resumen,
        variant: 'primary',
        confirmLabel: 'Guardar cambios',
        cancelLabel: 'Revisar',
      });
      if (!ok) return;

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
          esAdministrador: noPuedeRevocarAdmin ? true : data.esAdministrador,
          esBarbero: data.esBarbero,
        },
      });

      showToast('success', `Usuario ${data.nombre} actualizado correctamente.`);

      if (editandoPropioPerfil) {
        await refrescarPerfil();
      }

      goBack({
        fallbackTo: editandoPropioPerfil ? '/mi-perfil' : '/usuarios',
        state: { mensaje: `Usuario ${data.nombre} actualizado correctamente.` },
      });
    } catch (err: unknown) {
      showToast('danger', mapApiError(err));
      console.error('Error al actualizar usuario:', err);
    }
  };

  const errorMessage = actualizarUsuarioMutation.error
    ? mapApiError(actualizarUsuarioMutation.error)
    : null;

  return (
    <div className="container py-4" style={{ maxWidth: '680px' }}>
      <div className="mb-4">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm mb-3"
          onClick={() => goBack({ fallbackTo: editandoPropioPerfil ? '/mi-perfil' : '/usuarios' })}
        >
          &larr; Volver
        </button>
        <h1 className="h2 fw-bold mb-1">
          Editar Usuario: {usuario.nombre} {usuario.apellido}
        </h1>
        <p className="text-muted">
          Actualiza los datos de la cuenta, perfiles y comisiones asociadas.
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
                {(esSuperadmin || esAdminObjetivo) && (
                  <div className="form-check d-flex align-items-center gap-2 flex-wrap">
                    <input
                      id="esAdministrador"
                      type="checkbox"
                      className="form-check-input mt-0"
                      disabled={noPuedeRevocarAdmin}
                      {...register('esAdministrador')}
                    />
                    <label htmlFor="esAdministrador" className="form-check-label fw-semibold mb-0">
                      Rol Administrador (Acceso a módulos de gestión y panel)
                    </label>
                    {noPuedeRevocarAdmin && (
                      <span className="badge bg-secondary-subtle text-secondary-emphasis d-inline-flex align-items-center gap-1 small py-1 px-2">
                        <Lock size={12} />
                        {esSuperadminObjetivo ? 'Superadmin inmutable' : 'No puedes revocar tu propio rol'}
                      </span>
                    )}
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

                {errors.esBarbero && (
                  <div className="text-danger small mt-1">{errors.esBarbero.message}</div>
                )}
              </div>
            </div>

            {/* Campos condicionales de Barbero */}
            {esBarberoWatch && (
              <div className="col-12 p-3 bg-surface-card rounded border border-surface-card">
                <h6 className="fw-bold text-info mb-3">Datos del Perfil de Barbero</h6>
                <div className="row g-3">
                  <div className="col-12 col-sm-6 min-width-0">
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

                  <div className="col-12 col-sm-6 min-width-0">
                    <ComisionSlider
                      id="porcentajeComision"
                      valorActual={valorComision}
                      registerProps={register('porcentajeComision', { valueAsNumber: true })}
                      onChange={(n) => setValue('porcentajeComision', n, { shouldValidate: true })}
                      error={errors.porcentajeComision?.message}
                      disabled={actualizarUsuarioMutation.isPending}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="col-12 mt-4 d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => goBack({ fallbackTo: editandoPropioPerfil ? '/mi-perfil' : '/usuarios' })}
              >
                Cancelar
              </button>
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
