import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServiciosCatalogo } from '../../servicios/api/servicios.facade';
import { reservasKeys } from '../api/reservas.keys';
import {
  useBuscarClientesAdministrativos,
  useCrearReservaAdministrativa,
  useDisponibilidadReserva,
} from '../api/reservas.facade';
import type { ClienteAdministrativoDTO } from '../api/reservas.dto';
import { reservasService } from '../api/reservas.service';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import BackLink from '../../../shared/ui/BackLink';

type TipoCliente = 'registrado' | 'invitado';

const fechaISO = (fecha: Date) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const formatearPrecio = (precio: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(precio);

export default function CrearReservaAdministrativaPage() {
  const { data: servicios = [], isLoading: cargandoServicios, error: errorServicios } = useServiciosCatalogo();
  const [servicioId, setServicioId] = useState<number | null>(null);
  const [barberoId, setBarberoId] = useState<number | null>(null);
  const [fecha, setFecha] = useState(() => fechaISO(new Date()));
  const [hora, setHora] = useState<string | null>(null);
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>('registrado');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [consultarClientes, setConsultarClientes] = useState(false);
  const [cliente, setCliente] = useState<ClienteAdministrativoDTO | null>(null);
  const [nombreInvitado, setNombreInvitado] = useState('');
  const [apellidoInvitado, setApellidoInvitado] = useState('');
  const [telefonoInvitado, setTelefonoInvitado] = useState('');
  const [emailInvitado, setEmailInvitado] = useState('');
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [creada, setCreada] = useState<Awaited<ReturnType<typeof reservasService.crearReservaAdministrativa>> | null>(null);
  const crearReserva = useCrearReservaAdministrativa();
  const emailInvitadoInvalido = Boolean(
    emailInvitado.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInvitado.trim()),
  );
  const servicioSeleccionado = servicios.find((servicio) => servicio.id === servicioId);
  const consultaBarberos = useQuery({
    queryKey: reservasKeys.barberosPorServicio(servicioId ?? 0),
    queryFn: () => reservasService.obtenerBarberosPorServicio(servicioId!),
    enabled: servicioId !== null,
    staleTime: 30_000,
  });
  const barberoSeleccionado = (consultaBarberos.data ?? []).find((barbero) => barbero.id === barberoId);
  const filtro = servicioSeleccionado && barberoSeleccionado && fecha
    ? { servicioId: servicioSeleccionado.id, barberoId: barberoSeleccionado.id, fecha }
    : undefined;
  const disponibilidad = useDisponibilidadReserva(filtro);
  const horasDisponibles = useMemo(
    () => disponibilidad.data?.slots.filter((slot) => slot.available) ?? [],
    [disponibilidad.data],
  );
  const clientes = useBuscarClientesAdministrativos(
    busquedaCliente.trim(),
    consultarClientes && busquedaCliente.trim().length >= 3,
  );

  const seleccionarServicio = (id: number) => {
    setServicioId(id);
    setBarberoId(null);
    setHora(null);
    setCreada(null);
    setErrorAccion(null);
  };

  const seleccionarBarbero = (id: number) => {
    setBarberoId(id);
    setHora(null);
    setCreada(null);
    setErrorAccion(null);
  };

  const cambiarFecha = (valor: string) => {
    setFecha(valor);
    setHora(null);
    setCreada(null);
  };

  const crear = async () => {
    if (!servicioSeleccionado || !barberoSeleccionado || !fecha || !hora) return;
    if (tipoCliente === 'registrado' && !cliente) {
      setErrorAccion('Busca y selecciona un cliente registrado.');
      return;
    }
    if (tipoCliente === 'invitado' && (!nombreInvitado.trim() || !telefonoInvitado.trim())) {
      setErrorAccion('El nombre y el teléfono son obligatorios para el cliente invitado.');
      return;
    }
    if (tipoCliente === 'invitado' && emailInvitadoInvalido) {
      setErrorAccion('Escribe un correo electrónico válido o deja el campo vacío.');
      return;
    }

    const datos = {
      servicioId: servicioSeleccionado.id,
      barberoId: barberoSeleccionado.id,
      fecha,
      hora,
      ...(tipoCliente === 'registrado' && cliente ? { clienteId: cliente.id } : {}),
      ...(tipoCliente === 'invitado' ? {
        nombre: nombreInvitado.trim(),
        apellido: apellidoInvitado.trim() || undefined,
        telefono: telefonoInvitado.trim(),
        ...(emailInvitado.trim() ? { email: emailInvitado.trim() } : {}),
      } : {}),
    };

    setErrorAccion(null);
    try {
      const resultado = await crearReserva.mutateAsync(datos);
      setCreada(resultado);
    } catch (error: unknown) {
      setErrorAccion(mapApiError(error));
    }
  };

  const minimo = fechaISO(new Date());
  const maximo = useMemo(() => {
    const limite = new Date();
    limite.setDate(limite.getDate() + 30);
    return fechaISO(limite);
  }, []);

  return (
    <main className="container-fluid p-3 p-md-4" style={{ maxWidth: 1180 }}>
      <header className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <span className="text-eyebrow d-block mb-2">GESTIÓN / RESERVAS</span>
          <h1 className="h2 fw-bold mb-1">Crear reserva para un cliente</h1>
          <p className="text-surface-muted mb-0">Selecciona servicio, barbero, fecha y una franja disponible.</p>
        </div>
        <BackLink to="/reservas">Volver a reservas</BackLink>
      </header>

      {creada ? (
        <div className="alert alert-success" role="status">
          <h2 className="h5 fw-bold">Reserva creada</h2>
          <p>{creada.mensaje} · Reserva #{creada.id}</p>
          <p className="mb-3">{creada.servicio.nombre} · {creada.fecha} · {creada.hora}–{creada.horaFin} · {formatearPrecio(creada.servicio.precio)}</p>
          <div className="d-flex flex-wrap gap-2">
            <Button type="button" onClick={() => {
              setCreada(null);
              setHora(null);
              setCliente(null);
            }}>Crear otra reserva</Button>
            <BackLink to="/reservas">Volver a reservas</BackLink>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <section className="card card-surface border-0 shadow-sm">
              <div className="card-body p-3 p-md-4">
                <h2 className="h5 fw-bold mb-3">1. Servicio y barbero</h2>
                <label className="form-label fw-semibold" htmlFor="reserva-servicio">Servicio</label>
                {cargandoServicios ? <p role="status" className="text-surface-muted">Cargando servicios...</p> : (
                  <select id="reserva-servicio" className="form-select mb-3" value={servicioId ?? ''} onChange={(event) => seleccionarServicio(Number(event.target.value))}>
                    <option value="">Selecciona un servicio</option>
                    {servicios.filter((servicio) => servicio.estado === 'ACTIVO').map((servicio) => (
                      <option key={servicio.id} value={servicio.id}>{servicio.nombre} · {formatearPrecio(servicio.precio)}</option>
                    ))}
                  </select>
                )}
                {errorServicios && <ErrorMessage message={mapApiError(errorServicios)} />}

                <label className="form-label fw-semibold" htmlFor="reserva-barbero">Barbero</label>
                <select id="reserva-barbero" className="form-select" value={barberoId ?? ''} disabled={!servicioId || consultaBarberos.isLoading || consultaBarberos.isError} onChange={(event) => seleccionarBarbero(Number(event.target.value))}>
                  <option value="">{consultaBarberos.isLoading ? 'Cargando barberos...' : 'Selecciona un barbero'}</option>
                  {(consultaBarberos.data ?? []).map((barbero) => (
                    <option key={barbero.id} value={barbero.id}>{barbero.nombre} {barbero.apellido}</option>
                  ))}
                </select>
                {consultaBarberos.isError && <div className="mt-2"><ErrorMessage message={mapApiError(consultaBarberos.error)} /></div>}
                {servicioSeleccionado && <p className="small text-surface-muted mt-2 mb-0">Duración: {servicioSeleccionado.duracionMinutos} minutos.</p>}
              </div>
            </section>

            <section className="card card-surface border-0 shadow-sm mt-3">
              <div className="card-body p-3 p-md-4">
                <h2 className="h5 fw-bold mb-3">2. Fecha y hora</h2>
                <label htmlFor="reserva-fecha-admin" className="form-label fw-semibold">Fecha (próximos 30 días)</label>
                <input id="reserva-fecha-admin" type="date" className="form-control mb-3" min={minimo} max={maximo} value={fecha} onChange={(event) => cambiarFecha(event.target.value)} />

                {!barberoSeleccionado ? <p className="small text-surface-muted mb-0">Selecciona primero un servicio y un barbero.</p> : disponibilidad.isLoading ? (
                  <p className="small text-surface-muted" role="status">Consultando disponibilidad...</p>
                ) : disponibilidad.isError ? (
                  <div><ErrorMessage message={mapApiError(disponibilidad.error)} /><Button className="mt-2" type="button" size="sm" variant="outline-warning" onClick={() => void disponibilidad.refetch()} isLoading={disponibilidad.isFetching}>Reintentar</Button></div>
                ) : horasDisponibles.length === 0 ? (
                  <p className="alert alert-light border mb-0">No hay horarios disponibles en esta fecha. Prueba otro día.</p>
                ) : (
                  <div className="d-flex flex-wrap gap-2" aria-label="Horarios disponibles">
                    {horasDisponibles.map((slot) => (
                      <button key={slot.startTime} type="button" className={`btn ${hora === slot.startTime ? 'btn-primary' : 'btn-outline-primary'}`} aria-pressed={hora === slot.startTime} onClick={() => setHora(slot.startTime)}>
                        {slot.startTime}–{slot.endTime}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="col-12 col-lg-5">
            <section className="card card-surface border-0 shadow-sm">
              <div className="card-body p-3 p-md-4">
                <h2 className="h5 fw-bold mb-3">3. Cliente</h2>
                <div className="btn-group w-100 mb-3" role="group" aria-label="Tipo de cliente">
                  <button type="button" className={`btn ${tipoCliente === 'registrado' ? 'btn-primary' : 'btn-outline-primary'}`} aria-pressed={tipoCliente === 'registrado'} onClick={() => { setTipoCliente('registrado'); setCliente(null); setErrorAccion(null); }}>Cliente registrado</button>
                  <button type="button" className={`btn ${tipoCliente === 'invitado' ? 'btn-primary' : 'btn-outline-primary'}`} aria-pressed={tipoCliente === 'invitado'} onClick={() => { setTipoCliente('invitado'); setCliente(null); setErrorAccion(null); }}>Invitado</button>
                </div>

                {tipoCliente === 'registrado' ? (
                  <>
                    <label htmlFor="buscar-cliente-reserva" className="form-label">Busca por nombre, teléfono o correo</label>
                    <div className="input-group mb-3">
                      <input id="buscar-cliente-reserva" className="form-control" maxLength={150} value={busquedaCliente} onChange={(event) => { setBusquedaCliente(event.target.value); setConsultarClientes(false); setCliente(null); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); setConsultarClientes(true); } }} />
                      <Button type="button" variant="outline-primary" disabled={busquedaCliente.trim().length < 3} onClick={() => setConsultarClientes(true)}>Buscar</Button>
                    </div>
                    {clientes.isFetching && <p className="small text-surface-muted" role="status">Buscando clientes...</p>}
                    {clientes.isError && <ErrorMessage message={mapApiError(clientes.error)} />}
                    {clientes.data && clientes.data.length === 0 && <p className="small text-surface-muted">No se encontraron clientes para esa búsqueda.</p>}
                    {!!clientes.data?.length && (
                      <div className="list-group mb-3" aria-label="Resultados de clientes">
                        {clientes.data.map((opcion) => (
                          <button key={opcion.id} type="button" className={`list-group-item list-group-item-action ${cliente?.id === opcion.id ? 'active' : ''}`} aria-pressed={cliente?.id === opcion.id} onClick={() => setCliente(opcion)}>
                            <span className="fw-semibold d-block">{opcion.nombre} {opcion.apellido ?? ''}</span>
                            <span className="small">{[opcion.email, opcion.telefono].filter(Boolean).join(' · ')}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {cliente && <p className="small text-success">Seleccionado: {cliente.nombre} {cliente.apellido ?? ''}</p>}
                  </>
                ) : (
                  <div className="row g-3">
                    <div className="col-12">
                      <label htmlFor="invitado-nombre-admin" className="form-label">Nombre <span className="text-surface-muted fw-normal">(máx. 100)</span></label>
                      <input id="invitado-nombre-admin" className="form-control" autoComplete="given-name" value={nombreInvitado} maxLength={100} onChange={(event) => setNombreInvitado(event.target.value)} />
                      <div className="form-text text-end">{nombreInvitado.length}/100</div>
                    </div>
                    <div className="col-12">
                      <label htmlFor="invitado-apellido-admin" className="form-label">Apellido <span className="text-surface-muted fw-normal">(máx. 100)</span></label>
                      <input id="invitado-apellido-admin" className="form-control" autoComplete="family-name" value={apellidoInvitado} maxLength={100} onChange={(event) => setApellidoInvitado(event.target.value)} />
                      <div className="form-text text-end">{apellidoInvitado.length}/100</div>
                    </div>
                    <div className="col-12">
                      <label htmlFor="invitado-telefono-admin" className="form-label">Teléfono <span className="text-surface-muted fw-normal">(máx. 20)</span></label>
                      <input id="invitado-telefono-admin" type="tel" className="form-control" autoComplete="tel" value={telefonoInvitado} maxLength={20} onChange={(event) => setTelefonoInvitado(event.target.value)} />
                      <div className="form-text text-end">{telefonoInvitado.length}/20</div>
                    </div>
                    <div className="col-12">
                      <label htmlFor="invitado-email-admin" className="form-label">Correo electrónico <span className="text-surface-muted fw-normal">(opcional · máx. 150)</span></label>
                      <input id="invitado-email-admin" type="email" className={'form-control' + (emailInvitadoInvalido ? ' is-invalid' : '')} autoComplete="email" value={emailInvitado} maxLength={150} aria-invalid={emailInvitadoInvalido} onChange={(event) => { setEmailInvitado(event.target.value); setErrorAccion(null); }} />
                      {emailInvitadoInvalido ? (
                        <div className="invalid-feedback d-block">Escribe un correo válido o deja el campo vacío.</div>
                      ) : (
                        <div className="form-text text-end">{emailInvitado.length}/150</div>
                      )}
                    </div>
                  </div>
                )}

                <hr />
                <h3 className="h6 fw-bold">Resumen</h3>
                <p className="small text-surface-muted mb-1">{servicioSeleccionado?.nombre ?? 'Sin servicio'} · {barberoSeleccionado ? `${barberoSeleccionado.nombre} ${barberoSeleccionado.apellido}` : 'Sin barbero'}</p>
                <p className="small text-surface-muted">{fecha}{hora ? ` · ${hora}` : ''}</p>
                {servicioSeleccionado && <p className="fw-semibold">{formatearPrecio(servicioSeleccionado.precio)}</p>}
                {errorAccion && <div className="mb-3"><ErrorMessage message={errorAccion} /></div>}
                <Button type="button" className="w-100" isLoading={crearReserva.isPending} loadingText="Creando reserva..." disabled={!servicioSeleccionado || !barberoSeleccionado || !hora || (tipoCliente === 'registrado' && !cliente) || (tipoCliente === 'invitado' && (!nombreInvitado.trim() || !telefonoInvitado.trim()))} onClick={() => void crear()}>
                  Crear reserva
                </Button>
              </div>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
