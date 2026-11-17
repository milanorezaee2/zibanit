/**
 * The authorisation matrix.
 *
 * These assertions are the contract the dashboard relies on: a viewer cannot
 * write, an editor cannot publish, and only a super administrator may manage
 * users. They are pure functions, so they run in milliseconds — which is precisely
 * why they should exist rather than be discovered in production.
 */
import { describe, expect, it } from 'vitest';
import { PERMISSIONS, can, canAny, permissionsFor, type Role } from '@/lib/auth/permissions';
import { adminNav } from '@/config/admin-navigation';

const ROLES: Role[] = ['super_admin', 'curator', 'editor', 'media_manager', 'seo_manager', 'viewer'];

describe('permissions', () => {
  it('gives every role a permission set drawn from the known vocabulary', () => {
    for (const role of ROLES) {
      const granted = permissionsFor(role);
      expect(granted.length).toBeGreaterThan(0);
      for (const permission of granted) {
        expect(PERMISSIONS).toContain(permission);
      }
    }
  });

  it('refuses every permission to an unknown or absent role', () => {
    expect(can(null, 'dashboard.read')).toBe(false);
    expect(can(undefined, 'dashboard.read')).toBe(false);
    expect(can('intruder' as Role, 'dashboard.read')).toBe(false);
    expect(canAny(null, ['dashboard.read', 'specimen.write'])).toBe(false);
  });

  it('never lets a read-only role write anything', () => {
    const writes = PERMISSIONS.filter((permission) => permission.endsWith('.write'));
    for (const permission of writes) {
      expect(can('viewer', permission), `viewer must not hold ${permission}`).toBe(false);
    }
  });

  it('separates writing a specimen from publishing it', () => {
    expect(can('editor', 'specimen.write')).toBe(true);
    expect(can('editor', 'specimen.publish')).toBe(false);
    expect(can('curator', 'specimen.publish')).toBe(true);
  });

  it('reserves user management and settings for the roles that own them', () => {
    expect(can('curator', 'user.manage')).toBe(false);
    expect(can('super_admin', 'user.manage')).toBe(true);
    expect(can('seo_manager', 'settings.write')).toBe(true);
    expect(can('editor', 'settings.write')).toBe(false);
  });

  it('covers every permission the dashboard navigation declares', () => {
    const declared = adminNav.flatMap((group) => group.items.map((item) => item.permission));
    for (const permission of declared) {
      expect(PERMISSIONS, `navigation declares «${permission}»`).toContain(permission);
    }
  });

  it('gives the super administrator the whole vocabulary', () => {
    expect(permissionsFor('super_admin')).toEqual(PERMISSIONS);
  });
});
