/**
 * GEMORIA — application-wide constants.
 *
 * Kept deliberately small. Anything that a museum editor should be able to change
 * lives in the database (`app_settings`) from Phase 1 onward; this file holds only
 * facts that are true for a given build.
 */

/** Must match `version` in package.json — asserted by `tests/config.test.ts`. */
export const APP_VERSION = '0.1.0';

/** The implementation phase this build belongs to. Displayed in the dashboard. */
export const APP_PHASE = {
  number: 0,
  name: 'بنیاد و اسکلت',
  status: 'in-progress',
} as const;

/** The only locale enabled in Phase 0. */
export const ENABLED_LOCALES = ['fa'] as const;
export type EnabledLocale = (typeof ENABLED_LOCALES)[number];

/** Languages the architecture already accommodates. */
export const PLANNED_LOCALES = [
  { code: 'fa', label: 'فارسی', direction: 'rtl', enabled: true },
  { code: 'en', label: 'English', direction: 'ltr', enabled: false },
  { code: 'ar', label: 'العربية', direction: 'rtl', enabled: false },
] as const;

export const DEFAULT_LOCALE: EnabledLocale = 'fa';
export const DEFAULT_DIRECTION = 'rtl';
