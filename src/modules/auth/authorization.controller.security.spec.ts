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
import { CardTypesController } from '../cardTypes/cardTypes.controller';
import { CiltFrequenciesController } from '../ciltFrequencies/ciltFrequencies.controller';
import { CiltMstrController } from '../ciltMstr/ciltMstr.controller';
import { CiltMstrPositionLevelsController } from '../ciltMstrPositionLevels/ciltMstrPositionLevels.controller';
import { CiltSequencesController } from '../ciltSequences/ciltSequences.controller';
import { CiltSequencesFrequenciesController } from '../ciltSequencesFrequenciesOLD/ciltSequencesFrequencies.controller';
import { CiltSecuencesScheduleController } from '../ciltSecuencesSchedule/ciltSecuencesSchedule.controller';
import { CiltTypesController } from '../ciltTypes/ciltTypes.controller';
import { CompanyController } from '../company/company.controller';
import { FileUploadController } from '../file-upload/file-upload.controller';
import { IncidentController } from '../incident/incident.controller';
import { MailController } from '../mail/mail.controller';
import { NotificationsController } from '../notifications/notifications.controller';
import { OplDetailsController } from '../oplDetails/oplDetails.controller';
import { OplLevelsController } from '../oplLevels/oplLevels.controller';
import { OplMstrController } from '../oplMstr/oplMstr.controller';
import { OplTypesController } from '../oplTypes/oplTypes.controller';
import { LevelController } from '../level/level.controller';
import { PreclassifierController } from '../preclassifier/preclassifier.controller';
import { PriorityController } from '../priority/priority.controller';
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
    CiltSequencesFrequenciesController,
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
    [OplTypesController.prototype.findAll, [PLATFORM_ADMIN_ROLE]],
    [OplMstrController.prototype.findAll, [PLATFORM_ADMIN_ROLE]],
    [OplDetailsController.prototype.findAll, [PLATFORM_ADMIN_ROLE]],
    [CardTypesController.prototype.create, [...SITE_ADMIN_ROLES]],
    [CardTypesController.prototype.update, [...SITE_ADMIN_ROLES]],
    [PreclassifierController.prototype.create, [...SITE_ADMIN_ROLES]],
    [PreclassifierController.prototype.update, [...SITE_ADMIN_ROLES]],
    [PriorityController.prototype.create, [...SITE_ADMIN_ROLES]],
    [PriorityController.prototype.update, [...SITE_ADMIN_ROLES]],
    [LevelController.prototype.create, [...SITE_ADMIN_ROLES]],
    [LevelController.prototype.update, [...SITE_ADMIN_ROLES]],
    [LevelController.prototype.moveLevel, [...SITE_ADMIN_ROLES]],
    [LevelController.prototype.cloneLevel, [...SITE_ADMIN_ROLES]],
    [CiltFrequenciesController.prototype.create, [...SITE_ADMIN_ROLES]],
    [CiltFrequenciesController.prototype.update, [...SITE_ADMIN_ROLES]],
    [CiltTypesController.prototype.create, [...SITE_ADMIN_ROLES]],
    [CiltTypesController.prototype.update, [...SITE_ADMIN_ROLES]],
    [CiltMstrController.prototype.create, [...SITE_ADMIN_ROLES]],
    [CiltMstrController.prototype.update, [...SITE_ADMIN_ROLES]],
    [CiltMstrController.prototype.delete, [...SITE_ADMIN_ROLES]],
    [CiltSequencesController.prototype.create, [...SITE_ADMIN_ROLES]],
    [CiltSequencesController.prototype.update, [...SITE_ADMIN_ROLES]],
    [CiltSequencesController.prototype.delete, [...SITE_ADMIN_ROLES]],
    [CiltSecuencesScheduleController.prototype.create, [...SITE_ADMIN_ROLES]],
    [CiltSecuencesScheduleController.prototype.update, [...SITE_ADMIN_ROLES]],
    [CiltSecuencesScheduleController.prototype.delete, [...SITE_ADMIN_ROLES]],
    [CiltMstrPositionLevelsController.prototype.create, [...SITE_ADMIN_ROLES]],
    [CiltMstrPositionLevelsController.prototype.update, [...SITE_ADMIN_ROLES]],
    [CiltMstrPositionLevelsController.prototype.delete, [...SITE_ADMIN_ROLES]],
    [OplTypesController.prototype.create, [...SITE_ADMIN_ROLES]],
    [OplTypesController.prototype.update, [...SITE_ADMIN_ROLES]],
    [OplTypesController.prototype.delete, [...SITE_ADMIN_ROLES]],
    [OplMstrController.prototype.create, [...SITE_ADMIN_ROLES]],
    [OplMstrController.prototype.update, [...SITE_ADMIN_ROLES]],
    [OplMstrController.prototype.delete, [...SITE_ADMIN_ROLES]],
    [OplDetailsController.prototype.create, [...SITE_ADMIN_ROLES]],
    [OplDetailsController.prototype.update, [...SITE_ADMIN_ROLES]],
    [OplDetailsController.prototype.delete, [...SITE_ADMIN_ROLES]],
    [OplLevelsController.prototype.create, [...SITE_ADMIN_ROLES]],
    [OplLevelsController.prototype.remove, [...SITE_ADMIN_ROLES]],
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
    {
      handler: OplMstrController.prototype.findByCreatorId,
      selfAccess: {
        source: 'params',
        requestKey: 'creatorId',
        roles: SITE_ADMIN_ROLES,
      },
      resourceAccess: {
        resource: 'user',
        lookup: 'id',
        source: 'params',
        requestKey: 'creatorId',
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
