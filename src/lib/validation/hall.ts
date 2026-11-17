/**
 * GEMORIA — hall form validation.
 *
 * The same schema runs in the browser-facing form and in the Server Action, so a
 * hand-crafted POST cannot smuggle in a field the form never offered. Messages are
 * Persian and addressed to the curator, not to a developer: nobody editing a gallery
 * should have to read "expected string, received undefined".
 */
import { z } from 'zod';

const text = (max: number) => z.string().trim().max(max);

/** Slugs are shared with specimens, so the rule lives in one place. */
export const SLUG_PATTERN = /^[\p{Script=Arabic}\p{L}\d-]+$/u;

export const hallFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'نام تالار باید دست‌کم دو نویسه باشد.')
    .max(80, 'نام تالار بیش از ۸۰ نویسه است.'),
  slug: z
    .string()
    .trim()
    .min(2, 'نشانی یکتا لازم است.')
    .max(90, 'نشانی یکتا بیش از ۹۰ نویسه است.')
    .regex(SLUG_PATTERN, 'نشانی یکتا فقط می‌تواند حروف، ارقام و خط تیره داشته باشد.'),
  latinName: text(80).default(''),
  summary: z
    .string()
    .trim()
    .min(10, 'معرفی کوتاه باید دست‌کم ده نویسه باشد.')
    .max(400, 'معرفی کوتاه بیش از ۴۰۰ نویسه است.'),
  description: text(4000).optional().default(''),
  imageAlt: text(200).optional().default(''),
  seoTitle: text(70).optional().default(''),
  seoDescription: text(160).optional().default(''),
  coverImageKey: text(200).optional().default(''),
  sortOrder: z
    .string()
    .trim()
    .optional()
    .default('0')
    .transform((input) => Number(input))
    .refine((value) => Number.isInteger(value) && value >= 0 && value <= 99, {
      message: 'ترتیب نمایش باید عددی میان ۰ و ۹۹ باشد.',
    }),
  isFeatured: z
    .union([z.literal('on'), z.literal('true'), z.literal('false'), z.boolean(), z.null(), z.undefined()])
    .transform((input) => input === 'on' || input === 'true' || input === true),
});

export type HallFormInput = z.infer<typeof hallFormSchema>;
