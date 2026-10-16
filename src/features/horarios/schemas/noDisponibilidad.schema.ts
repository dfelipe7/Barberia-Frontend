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

    if (
      periodo.horaInicio &&
      periodo.horaFin &&
      periodo.horaInicio >= periodo.horaFin
    ) {
      context.addIssue({
        code: 'custom',
        path: ['horaFin'],
        message: 'La hora final debe ser posterior a la hora inicial.',
      });
    }
  });

export type NoDisponibilidadFormValues = z.infer<typeof noDisponibilidadSchema>;
