import { AppRole } from '@prisma/client';
import { authorizedRole } from '../auth';

describe('auth', () => {
  it('reject no userRole', () => {
    expect(authorizedRole(undefined, [])).toEqual(false);
  });

  it('superadmin has all access', () => {
    for (const role of Object.values(AppRole)) {
      expect(authorizedRole(AppRole.SUPERADMIN, [role])).toEqual(true);
    }
  });

  it('admin does not have access if superadmin required', () => {
    for (const role of Object.values(AppRole)) {
      expect(authorizedRole(AppRole.ADMIN, [role])).toEqual(
        role !== AppRole.SUPERADMIN
      );
    }
  });

  it('user only has access if user role is sufficient', () => {
    for (const role of Object.values(AppRole)) {
      expect(authorizedRole(AppRole.USER, [role])).toEqual(
        role === AppRole.USER
      );
    }
  });

  it('if user is specified allows all roles', () => {
    for (const role of Object.values(AppRole)) {
      expect(authorizedRole(role, [AppRole.USER, AppRole.SUPERADMIN])).toEqual(
        true
      );
    }
  });
});
