import { z } from 'zod';

const fechaExiste = (valor: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [anio, mes, dia] = valor.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia, 12);
  return (
    fecha.getFullYear() === anio &&
    fecha.getMonth() === mes - 1 &&
    fecha.getDate() === dia
  );
};

const minutos = (hora: string) => {
  const [horas, minutosHora] = hora.split(':').map(Number);
  return horas * 60 + minutosHora;
};

export const noDisponibilidadSchema = z
  .object({
    fecha: z.string(),
    horaInicio: z.string(),
    horaFin: z.string(),
  })
  .superRefine((periodo, context) => {
    if (!fechaExiste(periodo.fecha)) {
      context.addIssue({
        code: 'custom',
        path: ['fecha'],
        message: 'Selecciona una fecha válida.',
      });
    }

    if (!periodo.horaInicio) {
      context.addIssue({
        code: 'custom',
        path: ['horaInicio'],
        message: 'Indica la hora de inicio.',
      });
    }

    if (!periodo.horaFin) {
      context.addIssue({
        code: 'custom',
        path: ['horaFin'],
        message: 'Indica la hora de finalización.',
      });
    }

    if (periodo.horaInicio && periodo.horaFin) {
      const inicio = minutos(periodo.horaInicio);
      const fin = minutos(periodo.horaFin);

      if (periodo.horaInicio >= periodo.horaFin) {
        context.addIssue({
          code: 'custom',
          path: ['horaFin'],
          message: 'La hora final debe ser posterior a la hora inicial.',
        });
      } else if (
        periodo.horaInicio.slice(3) !== '00' ||
        periodo.horaFin.slice(3) !== '00' ||
        inicio < 9 * 60 ||
        fin > 20 * 60 ||
        (fin - inicio) % 60 !== 0
      ) {
        context.addIssue({
          code: 'custom',
          path: ['horaFin'],
          message: 'Usa horas en punto entre 09:00 y 20:00, en bloques completos de una hora.',
        });
      }
    }
  });

export type NoDisponibilidadFormValues = z.infer<typeof noDisponibilidadSchema>;
