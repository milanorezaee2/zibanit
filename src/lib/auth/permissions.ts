/**
 * GEMORIA — authorisation.
 *
 * A role is a name for a set of permissions; the server checks the permission, not
 * the role. That indirection exists for one reason: when the museum hires a
 * "curator who may edit specimens but not publish them", the change is one line in
 * this table and no page has to learn a new word.
 *
 * These are the *keys* the dashboard navigation already declares
 * (`src/config/admin-navigation.ts`), so the menu and the enforcement cannot drift
 * apart — a menu entry that is visible but rejected is a bug this file prevents by
 * construction, and an action that is reachable but unchecked is caught by the
 * tests in `tests/auth/permissions.test.ts`.
 *
 * Least privilege is the default: `viewer` may read the dashboard and nothing else.
 */

export const PERMISSIONS = [
  'dashboard.read',
  'specimen.read',
  'specimen.write',
  'specimen.publish',
  'hall.read',
  'hall.write',
  'article.read',
  'article.write',
  'taxonomy.read',
  'taxonomy.write',
  'geography.read',
  'curation.write',
  'media.read',
  'media.write',
  'user.manage',
  'audit.read',
  'settings.write',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type Role = 'super_admin' | 'curator' | 'editor' | 'media_manager' | 'seo_manager' | 'viewer';

const READ_ONLY: readonly Permission[] = [
  'dashboard.read',
  'specimen.read',
  'hall.read',
  'article.read',
  'taxonomy.read',
  'geography.read',
  'media.read',
];

/**
 * Fail closed. An unknown role gets nothing at all — not the read-only set. A role
 * that is not in this table is a bug or a tampered row, and neither is a reason to
 * grant an audience.
 */
const NO_PERMISSIONS: readonly Permission[] = [];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  super_admin: PERMISSIONS,
  curator: [
    ...READ_ONLY,
    'specimen.write',
    'specimen.publish',
    'hall.write',
    'taxonomy.write',
    'media.write',
    'article.write',
    'audit.read',
  ],
  editor: [...READ_ONLY, 'specimen.write', 'article.write'],
  media_manager: [...READ_ONLY, 'media.write'],
  seo_manager: [...READ_ONLY, 'settings.write', 'curation.write'],
  viewer: READ_ONLY,
};

export function permissionsFor(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? NO_PERMISSIONS;
}

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return permissionsFor(role).includes(permission);
}

export function canAny(role: Role | null | undefined, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => can(role, permission));
}

/** The permission a write to a given area requires. Used by navigation and forms. */
export const WRITE_PERMISSION = {
  specimens: 'specimen.write',
  publish: 'specimen.publish',
  halls: 'hall.write',
  articles: 'article.write',
  taxonomy: 'taxonomy.write',
  media: 'media.write',
  users: 'user.manage',
  settings: 'settings.write',
} as const satisfies Record<string, Permission>;
