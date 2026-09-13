import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../../auth/AuthContext';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useActualizarUsuario, useCambiarContrasena } from '../api/usuarios.facade';
import {
  miPerfilSchema,
  type MiPerfilFormValues,
  cambiarContrasenaSchema,
  type CambiarContrasenaFormValues,
} from '../schemas/usuario.schema';

const COLORES_ROL: Record<string, string> = {
  SUPERADMIN: 'danger',
  ADMINISTRADOR: 'warning',
  BARBERO: 'info',
};

export const MiPerfilPage: React.FC = () => {
  const { usuarioDb, refrescarPerfil, roles } = useAuth();
  const [editando, setEditando] = useState(false);
  const [exitoDatos, setExitoDatos] = useState('');
  const [exitoClave, setExitoClave] = useState('');

  const actualizarUsuarioMutation = useActualizarUsuario();
  const cambiarContrasenaMutation = useCambiarContrasena();

  // Formulario de Datos Personales
  const {
    register: registerDatos,
    handleSubmit: handleSubmitDatos,
    setValue: setValueDatos,
    reset: resetDatos,
    formState: { errors: errorsDatos },
  } = useForm<MiPerfilFormValues>({
    resolver: zodResolver(miPerfilSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
    },
  });

  // Formulario de Contraseña
  const {
    register: registerClave,
    handleSubmit: handleSubmitClave,
    reset: resetClave,
    formState: { errors: errorsClave },
  } = useForm<CambiarContrasenaFormValues>({
    resolver: zodResolver(cambiarContrasenaSchema),
    defaultValues: {
      contrasenaActual: '',
      nuevaContrasena: '',
      confirmarContrasena: '',
    },
  });

  useEffect(() => {
    refrescarPerfil();
  }, [refrescarPerfil]);

  useEffect(() => {
    if (usuarioDb) {
      setValueDatos('nombre', usuarioDb.nombre);
      setValueDatos('apellido', usuarioDb.apellido);
      setValueDatos('email', usuarioDb.email);
      setValueDatos('telefono', usuarioDb.barbero?.telefono || '');
    }
  }, [usuarioDb, setValueDatos]);

  const onGuardarDatos = async (data: MiPerfilFormValues) => {
    if (!usuarioDb) return;
    try {
      setExitoDatos('');
      await actualizarUsuarioMutation.mutateAsync({
        id: usuarioDb.id,
        datos: {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          ...(usuarioDb.barbero && { telefono: data.telefono }),
        },
      });
      await refrescarPerfil();
      setExitoDatos('¡Información actualizada correctamente!');
      setEditando(false);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const onCambiarClave = async (data: CambiarContrasenaFormValues) => {
    try {
      setExitoClave('');
      await cambiarContrasenaMutation.mutateAsync({
        contrasenaActual: data.contrasenaActual,
        nuevaContrasena: data.nuevaContrasena,
      });
      setExitoClave('¡Contraseña actualizada exitosamente!');
      resetClave();
    } catch (err: unknown) {
      console.error(err);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: '840px' }}>
      <div className="mb-4">
        <h1 className="h2 fw-bold mb-1">Mi Perfil</h1>
        <p className="text-muted">
          Consulta y gestiona tu información personal, perfiles de seguridad y contraseña.
        </p>
      </div>

      <div className="row g-4">
        {/* Columna Izquierda: Resumen de Usuario */}
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 text-center p-4 bg-white h-100">
            <div
              className="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex justify-content-center align-items-center mx-auto mb-3 fw-bold"
              style={{ width: '84px', height: '84px', fontSize: '2rem' }}
            >
              {usuarioDb?.nombre?.charAt(0) || 'U'}
              {usuarioDb?.apellido?.charAt(0) || ''}
            </div>
            <h4 className="fw-bold mb-1">
              {usuarioDb?.nombre} {usuarioDb?.apellido}
            </h4>
            <p className="text-muted small mb-3">{usuarioDb?.email}</p>

            <div className="d-flex flex-wrap justify-content-center gap-1 mb-3">
              {roles
                .filter((r) => ['SUPERADMIN', 'ADMINISTRADOR', 'BARBERO'].includes(r))
                .map((rol) => (
                  <span
                    key={rol}
                    className={`badge bg-${COLORES_ROL[rol] || 'secondary'} px-2 py-1`}
                  >
                    {rol}
                  </span>
                ))}
            </div>

            {usuarioDb?.barbero && (
              <div className="alert alert-info py-2 px-3 small mt-auto text-start">
                <strong>Comisión asignada:</strong> {usuarioDb.barbero.porcentajeComision}%
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Formularios */}
        <div className="col-12 col-md-8">
          {/* Tarjeta de Datos Personales */}
          <div className="card shadow-sm border-0 p-4 bg-white mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">Datos Personales</h5>
              {!editando && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setEditando(true)}
                >
                  Editar Datos
                </Button>
              )}
            </div>

            {exitoDatos && (
              <div className="alert alert-success py-2 small">{exitoDatos}</div>
            )}

            {actualizarUsuarioMutation.error instanceof Error && (
              <ErrorMessage message={actualizarUsuarioMutation.error.message} />
            )}

            {editando ? (
              <form onSubmit={handleSubmitDatos(onGuardarDatos)}>
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label htmlFor="nombrePerfil" className="form-label small fw-semibold">
                      Nombre
                    </label>
                    <input
                      id="nombrePerfil"
                      type="text"
                      className={`form-control ${errorsDatos.nombre ? 'is-invalid' : ''}`}
                      {...registerDatos('nombre')}
                    />
                    {errorsDatos.nombre && (
                      <div className="invalid-feedback">{errorsDatos.nombre.message}</div>
                    )}
                  </div>

                  <div className="col-12 col-sm-6">
                    <label htmlFor="apellidoPerfil" className="form-label small fw-semibold">
                      Apellido
                    </label>
                    <input
                      id="apellidoPerfil"
                      type="text"
                      className={`form-control ${errorsDatos.apellido ? 'is-invalid' : ''}`}
                      {...registerDatos('apellido')}
                    />
                    {errorsDatos.apellido && (
                      <div className="invalid-feedback">{errorsDatos.apellido.message}</div>
                    )}
                  </div>

                  <div className="col-12">
                    <label htmlFor="emailPerfil" className="form-label small fw-semibold">
                      Correo Electrónico
                    </label>
                    <input
                      id="emailPerfil"
                      type="email"
                      className={`form-control ${errorsDatos.email ? 'is-invalid' : ''}`}
                      {...registerDatos('email')}
                    />
                    {errorsDatos.email && (
                      <div className="invalid-feedback">{errorsDatos.email.message}</div>
                    )}
                  </div>

                  {usuarioDb?.barbero && (
                    <div className="col-12">
                      <label htmlFor="telefonoPerfil" className="form-label small fw-semibold">
                        Teléfono
                      </label>
                      <input
                        id="telefonoPerfil"
                        type="tel"
                        className={`form-control ${errorsDatos.telefono ? 'is-invalid' : ''}`}
                        {...registerDatos('telefono')}
                      />
                      {errorsDatos.telefono && (
                        <div className="invalid-feedback">{errorsDatos.telefono.message}</div>
                      )}
                    </div>
                  )}

                  <div className="col-12 d-flex justify-content-end gap-2 mt-3">
                    <Button
                      type="button"
                      variant="light"
                      size="sm"
                      onClick={() => {
                        resetDatos();
                        setEditando(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={actualizarUsuarioMutation.isPending}
                      loadingText="Guardando..."
                    >
                      Guardar Cambios
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="row g-3">
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Nombre</span>
                  <span className="fw-semibold">{usuarioDb?.nombre}</span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Apellido</span>
                  <span className="fw-semibold">{usuarioDb?.apellido}</span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Correo Electrónico</span>
                  <span className="fw-semibold">{usuarioDb?.email}</span>
                </div>
                {usuarioDb?.barbero && (
                  <div className="col-sm-6">
                    <span className="text-muted small d-block">Teléfono de Contacto</span>
                    <span className="fw-semibold">
                      {usuarioDb.barbero.telefono || 'Sin registrar'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tarjeta de Cambio de Contraseña */}
          <div className="card shadow-sm border-0 p-4 bg-white">
            <h5 className="fw-bold mb-3">Seguridad y Contraseña</h5>

            {exitoClave && (
              <div className="alert alert-success py-2 small">{exitoClave}</div>
            )}

            {cambiarContrasenaMutation.error instanceof Error && (
              <ErrorMessage message={cambiarContrasenaMutation.error.message} />
            )}

            <form onSubmit={handleSubmitClave(onCambiarClave)}>
              <div className="row g-3">
                <div className="col-12">
                  <label htmlFor="contrasenaActual" className="form-label small fw-semibold">
                    Contraseña Actual <span className="text-danger">*</span>
                  </label>
                  <input
                    id="contrasenaActual"
                    type="password"
                    className={`form-control ${errorsClave.contrasenaActual ? 'is-invalid' : ''}`}
                    {...registerClave('contrasenaActual')}
                  />
                  {errorsClave.contrasenaActual && (
                    <div className="invalid-feedback">{errorsClave.contrasenaActual.message}</div>
                  )}
                </div>

                <div className="col-12 col-sm-6">
                  <label htmlFor="nuevaContrasena" className="form-label small fw-semibold">
                    Nueva Contraseña <span className="text-danger">*</span>
                  </label>
                  <input
                    id="nuevaContrasena"
                    type="password"
                    className={`form-control ${errorsClave.nuevaContrasena ? 'is-invalid' : ''}`}
                    {...registerClave('nuevaContrasena')}
                  />
                  {errorsClave.nuevaContrasena && (
                    <div className="invalid-feedback">{errorsClave.nuevaContrasena.message}</div>
                  )}
                </div>

                <div className="col-12 col-sm-6">
                  <label htmlFor="confirmarContrasena" className="form-label small fw-semibold">
                    Confirmar Nueva Contraseña <span className="text-danger">*</span>
                  </label>
                  <input
                    id="confirmarContrasena"
                    type="password"
                    className={`form-control ${errorsClave.confirmarContrasena ? 'is-invalid' : ''}`}
                    {...registerClave('confirmarContrasena')}
                  />
                  {errorsClave.confirmarContrasena && (
                    <div className="invalid-feedback">{errorsClave.confirmarContrasena.message}</div>
                  )}
                </div>

                <div className="col-12 d-flex justify-content-end mt-3">
                  <Button
                    type="submit"
                    variant="dark"
                    size="sm"
                    isLoading={cambiarContrasenaMutation.isPending}
                    loadingText="Actualizando..."
                  >
                    Actualizar Contraseña
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiPerfilPage;
