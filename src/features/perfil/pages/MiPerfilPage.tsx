import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastContext } from '../../../shared/ui/ToastContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../../auth/AuthContext';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useActualizarUsuario } from '../../usuarios/api/usuarios.facade';
import { useSubirFotoPropia, useEliminarFotoPropia } from '../../barberos';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { mapApiError } from '../../../shared/lib/mapApiError';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import { ShieldCheck, ExternalLink, Scissors } from 'lucide-react';
import RoleBadge from '../../../shared/ui/atoms/RoleBadge';
import {
  miPerfilSchema,
  type MiPerfilFormValues,
} from '../schemas/perfil.schema';


export const MiPerfilPage: React.FC = () => {
  const { usuarioDb, refrescarPerfil, roles } = useAuth();
  const esPersonalAdministrativo = roles.includes('SUPERADMIN') || roles.includes('ADMINISTRADOR');
  const esBarberoActivo = Boolean(usuarioDb?.barbero && usuarioDb.barbero.estado === 'ACTIVO');
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editando, setEditando] = useState(false);
  const { showToast } = useToastContext();
  const confirm = useConfirm();
  const [errorFoto, setErrorFoto] = useState('');

  const actualizarUsuarioMutation = useActualizarUsuario();
  const subirFotoMutation = useSubirFotoPropia();
  const eliminarFotoMutation = useEliminarFotoPropia();

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

  useEffect(() => {
    void refrescarPerfil();
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
      await actualizarUsuarioMutation.mutateAsync({
        id: usuarioDb.id,
        datos: {
          nombre: data.nombre,
          apellido: data.apellido,
          ...(usuarioDb.barbero && { telefono: data.telefono }),
        },
      });
      await refrescarPerfil();
      showToast('success', '¡Información actualizada correctamente!');
      setEditando(false);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleSeleccionarFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorFoto('');
    if (file.size > 5 * 1024 * 1024) {
      setErrorFoto('La imagen supera el límite permitido de 5 MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setErrorFoto('Formato no válido. Solo se admiten imágenes JPG, PNG o WEBP.');
      return;
    }
    try {
      await subirFotoMutation.mutateAsync(file);
      await refrescarPerfil();
      showToast('success', '¡Foto de perfil actualizada correctamente!');
    } catch (err: unknown) {
      setErrorFoto(mapApiError(err));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEliminarFoto = async () => {
    const ok = await confirm({
      title: '¿Eliminar foto de perfil?',
      message: '¿Seguro que deseas eliminar tu foto de perfil del catálogo?',
      variant: 'danger',
      confirmLabel: 'Eliminar',
    });
    if (!ok) return;

    setErrorFoto('');
    try {
      await eliminarFotoMutation.mutateAsync();
      await refrescarPerfil();
      showToast('success', 'Foto de perfil eliminada correctamente.');
    } catch (err: unknown) {
      setErrorFoto(mapApiError(err));
    }
  };

  const handleGestionAvanzada = async () => {
    if (!usuarioDb) return;
    const ok = await confirm({
      title: 'Salir de Mi Perfil',
      message:
        'Vas a entrar al editor avanzado de tu cuenta. Podrás cambiar tus roles y privilegios. ¿Deseas continuar?',
      variant: 'warning',
      confirmLabel: 'Continuar',
      cancelLabel: 'Cancelar',
    });
    if (!ok) return;
    void navigate(`/usuarios/${usuarioDb.id}/editar`, { state: { from: '/mi-perfil' } });
  };

  return (
    <div className="container py-4" style={{ maxWidth: '960px' }}>
      <div className="mb-4">
        <h1 className="h2 fw-bold mb-1">Mi Perfil</h1>
        <p className="text-muted">
          Consulta y gestiona tu información personal y perfil de acceso con Google.
        </p>
      </div>

      <div className="row g-4">
        {/* Columna Izquierda: Resumen de Usuario (en tablet y móvil arriba) */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 text-center p-3 p-md-4 card-surface mb-4">
            <div
              className="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex justify-content-center align-items-center mx-auto mb-3 fw-bold"
              style={{
                width: 'clamp(84px, 15vw, 105px)',
                height: 'clamp(84px, 15vw, 105px)',
                fontSize: 'clamp(1.75rem, 4vw, 2.2rem)',
              }}
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
                  <RoleBadge key={rol} rol={rol} className="px-2 py-1" />
                ))}
            </div>

            {usuarioDb?.barbero && (
              <div className="alert alert-info py-2 px-3 small text-start mb-0">
                <strong>Comisión asignada:</strong> {usuarioDb.barbero.porcentajeComision}%
              </div>
            )}
          </div>

          {usuarioDb?.barbero && (
            <div className="card shadow-sm border-0 p-3 p-md-4 card-surface">
              <h5 className="fw-bold mb-3">Información de Barbero</h5>
              <div className="mb-2">
                <span className="text-muted small d-block">Teléfono</span>
                <span className="fw-semibold">{usuarioDb.barbero.telefono || 'Sin registrar'}</span>
              </div>
              <hr />
              <div className="mb-2">
                <span className="text-muted small d-block">Comisión asignada</span>
                <span className="fw-semibold">{usuarioDb.barbero.porcentajeComision}%</span>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Solo puede modificarla un administrador.
                </div>
              </div>
              <hr />
              <div>
                <span className="text-muted small d-block">Visibilidad en catálogo</span>
                <span className={`badge ${usuarioDb.barbero.estado === 'ACTIVO' ? 'bg-success' : 'bg-warning'}`}>
                  {usuarioDb.barbero.estado}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Formularios */}
        <div className="col-12 col-lg-8">
          {usuarioDb?.barbero && (
            <div className="card shadow-sm border-0 p-3 p-md-4 card-surface mb-4 text-center">
              <h5 className="fw-bold mb-3">Foto Profesional (Catálogo)</h5>

              {errorFoto && <div className="alert alert-danger py-2 small">{errorFoto}</div>}

              <div className="d-inline-block position-relative mb-3 mx-auto">
                {obtenerUrlFoto(usuarioDb.barbero.fotoUrl) ? (
                  <img
                    src={obtenerUrlFoto(usuarioDb.barbero.fotoUrl)!}
                    alt="Foto de Barbero"
                    className="rounded-circle shadow-sm border border-3 border-primary"
                    style={{
                      width: 'clamp(84px, 15vw, 110px)',
                      height: 'clamp(84px, 15vw, 110px)',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-surface-app d-flex align-items-center justify-content-center mx-auto shadow-sm border border-2 border-secondary"
                    style={{
                      width: 'clamp(84px, 15vw, 110px)',
                      height: 'clamp(84px, 15vw, 110px)',
                    }}
                  >
                    <span className="text-surface-muted fw-bold" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.2rem)' }}>
                      {usuarioDb.nombre.charAt(0)}{usuarioDb.apellido.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-surface-muted small mb-3">
                Esta es la imagen visible para los clientes en el catálogo.
              </p>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/webp"
                onChange={handleSeleccionarFoto}
                style={{ display: 'none' }}
              />

              <div className="d-flex justify-content-center gap-2">
                <Button
                  type="button"
                  variant="outline-primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={subirFotoMutation.isPending}
                  loadingText="Subiendo..."
                  disabled={eliminarFotoMutation.isPending}
                >
                  {usuarioDb.barbero.fotoUrl ? 'Cambiar Foto' : 'Subir Foto'}
                </Button>

                {usuarioDb.barbero.fotoUrl && (
                  <Button
                    type="button"
                    variant="outline-danger"
                    size="sm"
                    onClick={handleEliminarFoto}
                    isLoading={eliminarFotoMutation.isPending}
                    loadingText="Eliminando..."
                    disabled={subirFotoMutation.isPending}
                  >
                    Eliminar
                  </Button>
                )}
              </div>
              <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                Formatos: JPG, PNG o WEBP. Máx. 5 MB.
              </div>
            </div>
          )}

          {/* Tarjeta de Datos Personales */}
          <div className="card shadow-sm border-0 p-3 p-md-4 card-surface mb-4">
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

            {actualizarUsuarioMutation.error && (
              <ErrorMessage message={mapApiError(actualizarUsuarioMutation.error)} />
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

                  <div className="col-12 col-sm-6">
                    <label htmlFor="emailPerfil" className="form-label small fw-semibold">
                      Correo Electrónico <span className="text-muted small fw-normal">(Identidad global)</span>
                    </label>
                    <input
                      id="emailPerfil"
                      type="email"
                      className="form-control bg-body-secondary text-secondary"
                      disabled
                      readOnly
                      {...registerDatos('email')}
                    />
                    <div className="form-text small text-muted">
                      El correo electrónico no es editable a nivel de sede.
                    </div>
                  </div>

                  {usuarioDb?.barbero && (
                    <div className="col-12 col-sm-6">
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

                  <div className="col-12 d-grid d-sm-flex justify-content-sm-end gap-2 mt-3">
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
                <div className="col-12 col-sm-6">
                  <span className="text-muted small d-block">Nombre</span>
                  <span className="fw-semibold">{usuarioDb?.nombre}</span>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted small d-block">Apellido</span>
                  <span className="fw-semibold">{usuarioDb?.apellido}</span>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted small d-block">Correo Electrónico</span>
                  <span className="fw-semibold">{usuarioDb?.email}</span>
                </div>
                {usuarioDb?.barbero && (
                  <div className="col-12 col-sm-6">
                    <span className="text-muted small d-block">Teléfono de Contacto</span>
                    <span className="fw-semibold">
                      {usuarioDb.barbero.telefono || 'Sin registrar'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tarjeta de Seguridad y Autenticación con Google */}
          <div className="card shadow-sm border-0 p-3 p-md-4 card-surface mb-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <ShieldCheck size={20} className="text-success" />
              Seguridad y Autenticación
            </h5>
            <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h6 className="fw-semibold mb-1">Cuenta protegida con Google OAuth 2.0</h6>
              <p className="text-surface-muted small mb-3">
                Tu sesión y acceso a la plataforma están vinculados directamente a tu cuenta de Google (<strong>{usuarioDb?.email}</strong>). La contraseña, los métodos de recuperación y la verificación en dos pasos (2FA) están administrados de forma centralizada por Google.
              </p>
              <a
                href="https://myaccount.google.com/security"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-1"
              >
                Administrar seguridad en Google <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {esPersonalAdministrativo && (
            <div className="card shadow-sm border card-surface mt-4">
              <div className="card-body p-3 p-md-4">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <Scissors size={20} className="text-primary" />
                    <h5 className="fw-bold mb-0">Gestión de Roles y Perfil de Barbero</h5>
                  </div>
                  <span className={`badge ${esBarberoActivo ? 'bg-success' : 'bg-secondary-subtle text-secondary-emphasis border'}`}>
                    {esBarberoActivo ? 'Perfil Barbero Activo' : 'Sin perfil de barbero'}
                  </span>
                </div>
                <p className="card-text text-surface-muted small mb-3">
                  {esBarberoActivo
                    ? 'Tienes el perfil de Barbero habilitado para atender citas, configurar tus horarios y asociarte a servicios del catálogo.'
                    : 'Como parte del equipo administrativo, puedes activar tu perfil de Barbero para atender clientes en la barbería, configurar tus turnos y aparecer en el catálogo.'}
                </p>
                <button
                  type="button"
                  onClick={handleGestionAvanzada}
                  className="btn btn-outline-primary w-100 w-sm-auto d-inline-flex align-items-center justify-content-center gap-2"
                >
                  <Scissors size={15} />
                  {esBarberoActivo ? 'Gestionar roles / Editar perfil de Barbero' : 'Gestionar roles / Habilitar perfil de Barbero'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiPerfilPage;
