/**
 * GEMORIA — media registration validation.
 *
 * A storage key is a path, so it is treated as untrusted input: must be absolute
 * under the public root, must not contain a traversal segment, and must name a file.
 */
import { z } from 'zod';

export const mediaRegistrationSchema = z.object({
  storageKey: z
    .string()
    .trim()
    .min(3, 'مسیر فایل لازم است.')
    .max(200, 'مسیر فایل بیش از ۲۰۰ نویسه است.')
    .refine((value) => value.startsWith('/'), { message: 'مسیر باید با / آغاز شود.' })
    .refine((value) => !value.split('/').includes('..'), { message: 'مسیر نمی‌تواند «..» داشته باشد.' })
    .refine((value) => !/\s/.test(value), { message: 'مسیر فایل نمی‌تواند فاصله داشته باشد.' }),
  kind: z.enum(['image', 'video', 'model', 'panorama', 'document']),
  mimeType: z
    .string()
    .trim()
    .regex(/^[a-z]+\/[a-z0-9.+-]+$/i, 'نوع MIME معتبر نیست؛ مثلاً image/webp.'),
  width: z
    .string()
    .trim()
    .optional()
    .default('')
    .transform((value) => (value === '' ? null : Number(value)))
    .refine((value) => value === null || (Number.isInteger(value) && value > 0 && value <= 20000), {
      message: 'عرض باید عددی مثبت و کمتر از ۲۰۰۰۰ باشد.',
    }),
  height: z
    .string()
    .trim()
    .optional()
    .default('')
    .transform((value) => (value === '' ? null : Number(value)))
    .refine((value) => value === null || (Number.isInteger(value) && value > 0 && value <= 20000), {
      message: 'ارتفاع باید عددی مثبت و کمتر از ۲۰۰۰۰ باشد.',
    }),
  altText: z.string().trim().max(300, 'متن جانشین بیش از ۳۰۰ نویسه است.').optional().default(''),
});
