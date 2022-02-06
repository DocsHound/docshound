import { AppRole } from '@prisma/client';
import { AuthChecker } from 'type-graphql';
import { GraphQLContext } from 'types';
import { logger } from 'logging';

export const authorizedRole = (
  userRole: AppRole | undefined,
  sufficientRoles: Array<AppRole>
) => {
  if (userRole === undefined) return false;

  // Superadmin authorized for all.
  if (userRole === AppRole.SUPERADMIN) return true;
  // Admin also authorized as USER.
  if (userRole === AppRole.ADMIN && sufficientRoles.includes(AppRole.USER))
    return true;
  // Sufficient roles must include our user role.
  return sufficientRoles.includes(userRole);
};

export const authChecker: AuthChecker<GraphQLContext, AppRole> = (
  { context, info },
  sufficientRoles
) => {
  const opName = `${info.path.typename} ${info.path.key}`;

  if (
    // Server admin --> we're calling from a different trusted server.
    !context.serverAdmin &&
    !authorizedRole(context.user?.role, sufficientRoles)
  ) {
    logger.error(
      `endpoint "${opName}" requires one of ${sufficientRoles} roles, but user ${context.user?.id} has role ${context.user?.role}`
    );
    return false;
  }

  return true;
};
