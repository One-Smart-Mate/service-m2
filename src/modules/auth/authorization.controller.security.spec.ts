import {
  PLATFORM_ADMIN_ROLE,
  SITE_ADMIN_ROLES,
} from 'src/common/auth/roles.constants';
import { REQUIRED_ROLES_KEY } from 'src/common/decorators/roles.decorator';
import {
  SELF_OR_ROLES_KEY,
  SelfOrRolesOptions,
} from 'src/common/decorators/self-or-roles.decorator';
import {
  SITE_RESOURCE_ACCESS_KEY,
  SiteResourceAccessOptions,
} from 'src/common/decorators/site-resource-access.decorator';
import { CardController } from '../card/card.controller';
import { CompanyController } from '../company/company.controller';
import { FileUploadController } from '../file-upload/file-upload.controller';
import { IncidentController } from '../incident/incident.controller';
import { MailController } from '../mail/mail.controller';
import { NotificationsController } from '../notifications/notifications.controller';
import { RolesController } from '../roles/roles.controller';
import { SiteController } from '../site/site.controller';
import { UsersController } from '../users/users.controller';
import { WhatsappController } from '../whatsapp/whatsapp.controller';

describe('Administrative authorization metadata', () => {
  it.each([
    CompanyController,
    NotificationsController,
    IncidentController,
    MailController,
    WhatsappController,
  ])('limits %p to the platform administrator', (controller) => {
    expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, controller)).toEqual([
      PLATFORM_ADMIN_ROLE,
    ]);
  });

  it.each([
    [RolesController.prototype.create, [PLATFORM_ADMIN_ROLE]],
    [RolesController.prototype.update, [PLATFORM_ADMIN_ROLE]],
    [RolesController.prototype.findAllRoles, [...SITE_ADMIN_ROLES]],
    [SiteController.prototype.create, [PLATFORM_ADMIN_ROLE]],
    [SiteController.prototype.findAll, [PLATFORM_ADMIN_ROLE]],
    [UsersController.prototype.findAll, [PLATFORM_ADMIN_ROLE]],
    [UsersController.prototype.create, [...SITE_ADMIN_ROLES]],
    [UsersController.prototype.update, [...SITE_ADMIN_ROLES]],
    [FileUploadController.prototype.uploadFile, [...SITE_ADMIN_ROLES]],
  ])(
    'sets the expected roles on an administrative handler',
    (handler, roles) => {
      expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, handler)).toEqual(roles);
    },
  );

  const selfScopedHandlers: Array<{
    handler: object;
    selfAccess: SelfOrRolesOptions;
    resourceAccess: SiteResourceAccessOptions;
  }> = [
    {
      handler: UsersController.prototype.findOneById,
      selfAccess: {
        source: 'params',
        requestKey: 'userId',
        roles: SITE_ADMIN_ROLES,
      },
      resourceAccess: {
        resource: 'user',
        lookup: 'id',
        source: 'params',
        requestKey: 'userId',
      },
    },
    {
      handler: CardController.prototype.findUserCards,
      selfAccess: {
        source: 'params',
        requestKey: 'userId',
        roles: SITE_ADMIN_ROLES,
      },
      resourceAccess: {
        resource: 'user',
        lookup: 'id',
        source: 'params',
        requestKey: 'userId',
      },
    },
    {
      handler: CardController.prototype.findByResponsibleId,
      selfAccess: {
        source: 'params',
        requestKey: 'responsibleId',
        roles: SITE_ADMIN_ROLES,
      },
      resourceAccess: {
        resource: 'user',
        lookup: 'id',
        source: 'params',
        requestKey: 'responsibleId',
      },
    },
  ];

  it.each(selfScopedHandlers)(
    'combines self-or-admin and tenant authorization',
    ({ handler, selfAccess, resourceAccess }) => {
      expect(Reflect.getMetadata(SELF_OR_ROLES_KEY, handler)).toEqual(
        selfAccess,
      );
      expect(Reflect.getMetadata(SITE_RESOURCE_ACCESS_KEY, handler)).toEqual(
        resourceAccess,
      );
    },
  );
});
