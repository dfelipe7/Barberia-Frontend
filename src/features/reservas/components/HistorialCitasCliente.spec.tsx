import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import { HistorialCitasCliente } from './HistorialCitasCliente';
import type { ReservaClienteDTO } from '../api/reservas.dto';

const formatearFechaMock = (f: string) => f;
const formatearPrecioMock = (p: number) => `$ ${p}`;
const mapearEstadoMock = (e: string) => (e === 'COMPLETED' ? 'Completada' : e === 'CANCELLED' ? 'Cancelada' : e);

const mockCitas: ReservaClienteDTO[] = [
  {
    id: 1,
    fecha: '2026-11-01',
    hora: '10:00',
    horaFin: '10:45',
    estado: 'COMPLETED',
    precio: 35000,
    servicio: { id: 10, nombre: 'Corte Clásico' },
    barbero: { id: 2, nombre: 'Carlos', apellido: 'Gómez' },
  },
  {
    id: 2,
    fecha: '2026-10-25',
    hora: '14:00',
    horaFin: '14:30',
    estado: 'CANCELLED',
    precio: 25000,
    servicio: { id: 11, nombre: 'Barba Express' },
    barbero: { id: 3, nombre: 'Mateo', apellido: 'López' },
  },
  {
    id: 3,
    fecha: '2026-10-10',
    hora: '16:00',
    horaFin: '16:45',
    estado: 'COMPLETED',
    precio: 40000,
    servicio: { id: 12, nombre: 'Afeitado Clásico' },
    barbero: { id: 2, nombre: 'Carlos', apellido: 'Gómez' },
  },
  {
    id: 4,
    fecha: '2026-09-30',
    hora: '11:00',
    horaFin: '11:45',
    estado: 'COMPLETED',
    precio: 35000,
    servicio: { id: 10, nombre: 'Corte Clásico' },
    barbero: { id: 2, nombre: 'Carlos', apellido: 'Gómez' },
  },
  {
    id: 5,
    fecha: '2026-09-15',
    hora: '15:00',
    horaFin: '15:45',
    estado: 'COMPLETED',
    precio: 35000,
    servicio: { id: 10, nombre: 'Corte Clásico' },
    barbero: { id: 2, nombre: 'Carlos', apellido: 'Gómez' },
  },
  {
    id: 6,
    fecha: '2026-09-01',
    hora: '17:00',
    horaFin: '17:45',
    estado: 'COMPLETED',
    precio: 35000,
    servicio: { id: 10, nombre: 'Corte Clásico' },
    barbero: { id: 2, nombre: 'Carlos', apellido: 'Gómez' },
  },
];

describe('HistorialCitasCliente', () => {
  afterEach(() => {
    cleanup();
  });

  it('retorna null si no hay citas anteriores', () => {
    const { container } = render(
      <MemoryRouter>
        <HistorialCitasCliente
          citas={[]}
          formatearFecha={formatearFechaMock}
          formatearPrecio={formatearPrecioMock}
          mapearEstado={mapearEstadoMock}
        />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza la lista de citas compactas con servicios y precios', () => {
    render(
      <MemoryRouter>
        <HistorialCitasCliente
          citas={mockCitas}
          formatearFecha={formatearFechaMock}
          formatearPrecio={formatearPrecioMock}
          mapearEstado={mapearEstadoMock}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Historial de Citas Anteriores')).toBeInTheDocument();
    expect(screen.getAllByText('Corte Clásico').length).toBeGreaterThan(0);
    expect(screen.getByText('Barba Express')).toBeInTheDocument();
    expect(screen.getAllByText('$ 35000').length).toBeGreaterThan(0);
  });

  it('permite filtrar por estado usando las píldoras de filtro', () => {
    render(
      <MemoryRouter>
        <HistorialCitasCliente
          citas={mockCitas}
          formatearFecha={formatearFechaMock}
          formatearPrecio={formatearPrecioMock}
          mapearEstado={mapearEstadoMock}
        />
      </MemoryRouter>
    );

    // Clic en píldora Canceladas
    const botonCanceladas = screen.getByRole('tab', { name: /Canceladas/i });
    fireEvent.click(botonCanceladas);

    // Solo debe mostrarse la cita cancelada
    expect(screen.getByText('Barba Express')).toBeInTheDocument();
    expect(screen.queryByText('Afeitado Clásico')).not.toBeInTheDocument();
  });

  it('soporta paginación cuando hay más de 5 citas', () => {
    render(
      <MemoryRouter>
        <HistorialCitasCliente
          citas={mockCitas}
          formatearFecha={formatearFechaMock}
          formatearPrecio={formatearPrecioMock}
          mapearEstado={mapearEstadoMock}
        />
      </MemoryRouter>
    );

    // Con 6 citas y 5 por página, hay paginación
    expect(screen.getByText(/Mostrando/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Siguiente/i })).toBeInTheDocument();

    // Avanzar a la siguiente página
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

    // En la página 2 debe estar la 6ta cita (#6)
    expect(screen.getByText('#6')).toBeInTheDocument();
  });

  it('muestra el nombre del servicio y el barbero claramente separados', () => {
    render(
      <MemoryRouter>
        <HistorialCitasCliente
          citas={mockCitas}
          formatearFecha={formatearFechaMock}
          formatearPrecio={formatearPrecioMock}
          mapearEstado={mapearEstadoMock}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Barbero:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Carlos Gómez').length).toBeGreaterThan(0);
  });
});
