import { z } from 'zod';
import { CODIGOS_DIA, HORAS_INICIO_FRANJA } from '../api/horarios.dto';

const horarioDiaSchema = z.object({
  diaSemana: z.enum(CODIGOS_DIA),
  franjas: z.array(z.enum(HORAS_INICIO_FRANJA)),
});

export const horarioSemanalSchema = z
  .object({
    dias: z.array(horarioDiaSchema),
  })
  .superRefine(({ dias }, context) => {
    dias.forEach((dia, indice) => {
      if (new Set(dia.franjas).size !== dia.franjas.length) {
        context.addIssue({
          code: 'custom',
          path: ['dias', indice, 'franjas'],
          message: 'Una franja no puede seleccionarse más de una vez.',
        });
      }
    });
  });

export type HorarioSemanalFormValues = z.infer<typeof horarioSemanalSchema>;
