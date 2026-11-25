import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TabPoliticasReserva } from './TabPoliticasReserva';
import { politicasReservaApi } from '../services/politicasReservaApi';

describe('TabPoliticasReserva', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('carga y muestra las políticas operativas actuales', async () => {
    vi.spyOn(politicasReservaApi, 'obtenerPoliticas').mockResolvedValueOnce({
      reservaCancelacionAntelacionMinutos: 120,
      reservaNoShowToleranciaMinutos: 15,
      reservaMaxCitasDiariasCliente: 3,
    });

    render(<TabPoliticasReserva />);

    expect(screen.getByText(/cargando políticas operativas/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Políticas y Reglas de Agendamiento Online/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Máximo de citas por cliente al día/i)).toHaveValue(3);
    expect(screen.getByLabelText(/Antelación mínima para cancelar/i)).toHaveValue(120);
    expect(screen.getByLabelText(/Tolerancia de inasistencia/i)).toHaveValue(15);
  });

  it('muestra mensaje de error si falla la carga inicial', async () => {
    vi.spyOn(politicasReservaApi, 'obtenerPoliticas').mockRejectedValueOnce(new Error('Network failure'));

    render(<TabPoliticasReserva />);

    await waitFor(() => {
      const errorElements = screen.getAllByText(/Network failure/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  it('permite cambiar valores con botones preajustados y guardar', async () => {
    vi.spyOn(politicasReservaApi, 'obtenerPoliticas').mockResolvedValueOnce({
      reservaCancelacionAntelacionMinutos: 120,
      reservaNoShowToleranciaMinutos: 15,
      reservaMaxCitasDiariasCliente: 3,
    });
    const spyActualizar = vi.spyOn(politicasReservaApi, 'actualizarPoliticas').mockResolvedValueOnce({
      reservaCancelacionAntelacionMinutos: 60,
      reservaNoShowToleranciaMinutos: 20,
      reservaMaxCitasDiariasCliente: 2,
    });

    render(<TabPoliticasReserva />);

    await waitFor(() => {
      expect(screen.getByText(/Políticas y Reglas de Agendamiento Online/i)).toBeInTheDocument();
    });

    // Clic en preset de citas: 2 citas
    fireEvent.click(screen.getByText('2 citas'));

    // Clic en preset de cancelación: 1 hora
    fireEvent.click(screen.getByText('1 hora'));

    // Clic en preset de no show: 20 min
    fireEvent.click(screen.getByText('20 min'));

    fireEvent.click(screen.getByRole('button', { name: /Guardar Políticas de Reserva/i }));

    await waitFor(() => {
      expect(spyActualizar).toHaveBeenCalledWith({
        reservaCancelacionAntelacionMinutos: 60,
        reservaNoShowToleranciaMinutos: 20,
        reservaMaxCitasDiariasCliente: 2,
      });
      expect(screen.getByText(/Políticas operativas guardadas exitosamente/i)).toBeInTheDocument();
    });
  });

  it('permite escribir valores manuales y maneja error al guardar', async () => {
    vi.spyOn(politicasReservaApi, 'obtenerPoliticas').mockResolvedValueOnce({
      reservaCancelacionAntelacionMinutos: 120,
      reservaNoShowToleranciaMinutos: 15,
      reservaMaxCitasDiariasCliente: 3,
    });
    vi.spyOn(politicasReservaApi, 'actualizarPoliticas').mockRejectedValueOnce({
      response: { data: { message: 'Valor fuera de rango' } },
    });

    render(<TabPoliticasReserva />);

    await waitFor(() => {
      expect(screen.getByText(/Políticas y Reglas de Agendamiento Online/i)).toBeInTheDocument();
    });

    const inputCancelacion = screen.getByLabelText(/Antelación mínima para cancelar/i);
    fireEvent.change(inputCancelacion, { target: { value: '180' } });
    expect(inputCancelacion).toHaveValue(180);

    const inputNoShow = screen.getByLabelText(/Tolerancia de inasistencia/i);
    fireEvent.change(inputNoShow, { target: { value: '25' } });
    expect(inputNoShow).toHaveValue(25);

    fireEvent.click(screen.getByRole('button', { name: /Guardar Políticas de Reserva/i }));

    await waitFor(() => {
      const errorElements = screen.getAllByText(/Valor fuera de rango/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });
});
