import { z } from 'zod';
import { CODIGOS_DIA } from '../api/horarios.dto';

const horarioDiaSchema = z.object({
  diaSemana: z.enum(CODIGOS_DIA),
  activo: z.boolean(),
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
});

export const horarioSemanalSchema = z
  .object({
    dias: z.array(horarioDiaSchema),
  })
  .superRefine(({ dias }, context) => {
    dias.forEach((dia, indice) => {
      if (!dia.activo) return;

      if (!dia.horaInicio || !dia.horaFin) {
        context.addIssue({
          code: 'custom',
          path: ['dias', indice, !dia.horaInicio ? 'horaInicio' : 'horaFin'],
          message: 'Completa la hora de inicio y de finalización.',
        });
        return;
      }

      if (dia.horaInicio >= dia.horaFin) {
        context.addIssue({
          code: 'custom',
          path: ['dias', indice, 'horaFin'],
          message: 'La hora de finalización debe ser posterior al inicio.',
        });
      }
    });
  });

export type HorarioSemanalFormValues = z.infer<typeof horarioSemanalSchema>;
