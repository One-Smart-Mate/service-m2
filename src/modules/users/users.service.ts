import { In, Not, Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { CreateUserDTO } from './models/create.user.dto';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import { SiteService } from '../site/site.service';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { RolesService } from '../roles/roles.service';
import * as bcryptjs from 'bcryptjs';
import { stringConstants } from 'src/utils/string.constant';
import { UpdateUserDTO } from './models/update.user.dto';
import { MailService } from '../mail/mail.service';
import { generateRandomCode } from 'src/utils/general.functions';
import { SendCodeDTO } from './models/send.code.dto';
import { ResetPasswordDTO } from './models/reset.password.dto';
import { SetAppTokenDTO } from './models/set.app.token.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationDTO } from '../firebase/models/firebase.request.dto';
import { UserHasSitesEntity } from './entities/user.has.sites.entity';
import { CreateUsersDTO } from '../file-upload/dto/create.users.dto';
import { UsersAndSitesDTO } from '../file-upload/dto/users.and.sites.dto';
import { UsersPositionsEntity } from '../users/entities/users.positions.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserHasSitesEntity)
    private readonly userHasSiteRepository: Repository<UserHasSitesEntity>,
    private readonly siteService: SiteService,
    private readonly roleService: RolesService,
    private readonly mailService: MailService,
    private readonly firebaseService: FirebaseService,
    @InjectRepository(UsersPositionsEntity)
    private readonly usersPositionsRepository: Repository<UsersPositionsEntity>,
  ) {}

  findUsersByPositionId = async (positionId: number) => {
    try {
      const users = await this.userRepository.find({
        where: { usersPositions: { position: { id: positionId } } },
        relations: { userRoles: { role: true }, usersPositions: { position: true } },
      });

      const transformedUsers = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.userRoles.map((userRole) => ({
          id: userRole.role.id,
          name: userRole.role.name,
        })),
        positions: user.usersPositions.map((usersPosition) => ({
          id: usersPosition.position.id,
          name: usersPosition.position.name,
        })),
      }));

      return transformedUsers;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  
  sendCodeToEmail = async (email: string, translation: typeof stringConstants.LANG_ES | typeof stringConstants.LANG_EN = stringConstants.LANG_ES) => {
    try {
      if (!email) {
        throw new ValidationException(ValidationExceptionType.EMAIL_MISSING);
      }

      const user = await this.userRepository.findOneBy({ email });

      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const resetCode = generateRandomCode(6);
      user.resetCode = await await bcryptjs.hash(
        resetCode,
        stringConstants.SALT_ROUNDS,
      );
      user.resetCodeExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await this.userRepository.save(user);

      await this.mailService.sendResetPasswordCode(user, resetCode, translation);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  verifyResetCode = async (sendCodeDTO: SendCodeDTO) => {
    try {
      const user = await this.userRepository.findOne({
        where: { email: sendCodeDTO.email },
      });

      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const isCodeValid = await bcryptjs.compare(
        sendCodeDTO.resetCode,
        user.resetCode,
      );

      if (!isCodeValid) {
        throw new ValidationException(ValidationExceptionType.WRONG_RESET_CODE);
      }

      if (new Date() > user.resetCodeExpiration) {
        throw new ValidationException(
          ValidationExceptionType.RESETCODE_EXPIRED,
        );
      }
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  resetPassword = async (resetPasswordDTO: ResetPasswordDTO) => {
    try {
      const user = await this.userRepository.findOne({
        where: { email: resetPasswordDTO.email },
      });

      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const isCodeValid = await bcryptjs.compare(
        resetPasswordDTO.resetCode,
        user.resetCode,
      );

      if (!isCodeValid) {
        throw new ValidationException(ValidationExceptionType.WRONG_RESET_CODE);
      }

      user.password = await await bcryptjs.hash(
        resetPasswordDTO.newPassword,
        stringConstants.SALT_ROUNDS,
      );
      user.resetCode = null;
      user.resetCodeExpiration = null;
      user.updatedAt = new Date();
      await this.userRepository.save(user);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findOneByEmail = (email: string) => {
    return this.userRepository.findOne({
      where: { email: email },
      relations: { userHasSites: { site: true } },
    });
  };
  
  update = async (user: UserEntity) => {
    const exists = await this.userRepository.existsBy({ email: user.email });
    if (!exists) {
      throw new BadRequestException('The user does not exist');
    }
    return this.userRepository.save(user);
  };

  getUserRoles = async (userId: number): Promise<string[]> => {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userRoles', 'userRoles.role'],
    });

    return user.userRoles.map((userRole) => userRole.role.name);
  };

  findById = async (userId: number) => {
    return await this.userRepository.findOneBy({ id: userId });
  };

  findSiteUsersResponsibleData = async (siteId: number) => {
    try {
      return await this.userRepository.find({
        where: { userHasSites: { site: { id: siteId } } },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  getSiteUsersTokens = async (siteId: number) => {
    try {
      const users = await this.userRepository.find({
        where: { userHasSites: { site: { id: siteId } } },
        select: ['android_token', 'ios_token', 'web_token'],
      });

      const tokens = users.flatMap(user => [
        user.android_token ? { token: user.android_token, type: stringConstants.OS_ANDROID } : null,
        user.ios_token ? { token: user.ios_token, type: stringConstants.OS_IOS } : null,
        user.web_token ? { token: user.web_token, type: stringConstants.OS_WEB } : null
      ].filter(item => item !== null));

      return tokens;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  getSiteUsersTokensExcludingOwnerUser = async (
    siteId: number,
    userId: number,
  ) => {
    try {
      const users = await this.userRepository.find({
        where: {
          userHasSites: { site: { id: siteId } },
          id: Not(userId),
        },
        select: ['android_token', 'ios_token', 'web_token'],
      });

      const tokens = users.flatMap(user => [
        user.android_token ? { token: user.android_token, type: stringConstants.OS_ANDROID } : null,
        user.ios_token ? { token: user.ios_token, type: stringConstants.OS_IOS } : null,
        user.web_token ? { token: user.web_token, type: stringConstants.OS_WEB } : null
      ].filter(item => item !== null));
  
      return tokens;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  
  getUserToken = async (userId: number) => {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['android_token', 'ios_token', 'web_token'],
      });

      if (!user) {
        return [];
      }

      const tokens = [
        user.android_token ? { token: user.android_token, type: stringConstants.OS_ANDROID } : null,
        user.ios_token ? { token: user.ios_token, type: stringConstants.OS_IOS } : null,
        user.web_token ? { token: user.web_token, type: stringConstants.OS_WEB } : null
      ].filter(item => item !== null);

      return tokens;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findAllUsers = async () => {
    try {
      const users = await this.userRepository.find({
        relations: { userRoles: { role: true }, userHasSites: { site: true } },
      });

      const transformedUsers = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.userRoles.map((userRole) => ({
          id: userRole.role.id,
          name: userRole.role.name,
        })),
        sites: user.userHasSites.map((userHasSite) => ({
          id: userHasSite.site.id,
          name: userHasSite.site.name,
          logo: userHasSite.site.logo,
        })),
      }));

      return transformedUsers;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findSiteUsers = async (siteId: number) => {
    try {
      const users = await this.userRepository.find({
        where: { userHasSites: { site: { id: siteId } } },
        relations: { userRoles: { role: true }, userHasSites: { site: true } },
      });

      const transformedUsers = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.userRoles.map((userRole) => ({
          id: userRole.role.id,
          name: userRole.role.name,
        })),
        sites: user.userHasSites.map((userHasSite) => ({
          id: userHasSite.site.id,
          name: userHasSite.site.name,
          logo: userHasSite.site.logo,
        })),
      }));

      return transformedUsers;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createUserDTO: CreateUserDTO) => {
    try {
      const userAlreadyExistInSite = await this.userRepository.existsBy({
        email: createUserDTO.email,
        userHasSites: { site: { id: createUserDTO.siteId } },
      });

      if (userAlreadyExistInSite) {
        throw new ValidationException(ValidationExceptionType.DUPLICATED_USER);
      }

      const [site, roles] = await Promise.all([
        this.siteService.findById(createUserDTO.siteId),
        this.roleService.findRolesByIds(createUserDTO.roles),
      ]);

      if (!site) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      } else if (roles.length === 0) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.ROLES);
      }

      const user = await this.userRepository.findOne({
        where: { email: createUserDTO.email },
      });

      const userSite = new UserHasSitesEntity();
      userSite.site = site;

      if (!user) {
        const createUser = await this.userRepository.create({
          name: createUserDTO.name,
          email: createUserDTO.email,
          password: await bcryptjs.hash(
            createUserDTO.password,
            stringConstants.SALT_ROUNDS,
          ),
          appVersion: process.env.APP_ENV,
          siteCode: site.siteCode,
          uploadCardDataWithDataNet: createUserDTO.uploadCardDataWithDataNet,
          uploadCardEvidenceWithDataNet:
            createUserDTO.uploadCardEvidenceWithDataNet,
          createdAt: new Date(),
        });

        await this.userRepository.save(createUser);
        await this.roleService.assignUserRoles(createUser, roles);
        userSite.user = createUser;
      } else {
        userSite.user = user;
      }
      const appUrl = process.env.URL_WEB;

      await this.mailService.sendWelcomeEmail(userSite.user, appUrl, createUserDTO.translation);

      return await this.userHasSiteRepository.save(userSite);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  
  updateUser = async (updateUserDTO: UpdateUserDTO) => {
    try {
      const [user, emailIsNotUnique, site, roles] = await Promise.all([
        this.userRepository.findOne({
          where: { id: updateUserDTO.id },
          relations: { userHasSites: { site: true } },
        }),
        this.userRepository.exists({
          where: { email: updateUserDTO.email, id: Not(updateUserDTO.id) },
        }),
        this.siteService.findById(updateUserDTO.siteId),
        this.roleService.findRolesByIds(updateUserDTO.roles),
      ]);
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }
      if (emailIsNotUnique) {
        throw new ValidationException(ValidationExceptionType.DUPLICATED_USER);
      }
      if (!site) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      }
      if (roles.length === 0) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.ROLES);
      }

      user.name = updateUserDTO.name;
      user.email = updateUserDTO.email;
      if (updateUserDTO.password) {
        user.password = await bcryptjs.hash(
          updateUserDTO.password,
          stringConstants.SALT_ROUNDS,
        );
      }

      user.status = updateUserDTO.status;
      user.appVersion = process.env.APP_ENV;
      user.siteCode = site.siteCode;
      user.uploadCardDataWithDataNet = updateUserDTO.uploadCardDataWithDataNet;
      user.uploadCardEvidenceWithDataNet =
        updateUserDTO.uploadCardEvidenceWithDataNet;
      user.status = updateUserDTO.status;  
      user.updatedAt = new Date();

      await this.userRepository.save(user);

      if (updateUserDTO.status === stringConstants.inactiveStatus) {
        const tokens = await this.getUserToken(user.id);
        if (tokens && tokens.length > 0) {
          await this.firebaseService.sendMultipleMessage(
            new NotificationDTO(
              stringConstants.closeSessionTitle,
              stringConstants.closeSessionDescription,
              stringConstants.closeSessionType,
            ),
            tokens,
          );
        }
      }
      
      return await this.roleService.updateUserRoles(user, roles);
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  };

  findOneById = async (userId: number) => {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: { userRoles: { role: true }, userHasSites: { site: true } },
      });
      if (user) {
        const transformedUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.userRoles.map((userRoles) => userRoles.role.id),
          sites: user.userHasSites.map((userHasSite) => ({
            id: userHasSite.site.id,
            name: userHasSite.site.name,
            logo: userHasSite.site.logo,
          })),
          uploadCardDataWithDataNet: user.uploadCardDataWithDataNet,
          uploadCardEvidenceWithDataNet: user.uploadCardEvidenceWithDataNet,
          status: user.status,
        };
        return transformedUser;
      }
      return user;
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  };

  firebaseAppToken = async (setAppTokenDTO: SetAppTokenDTO) => { 
    try {
      const user = await this.userRepository.findOneBy({
        id: setAppTokenDTO.userId,
      });
  
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }
  
      switch (setAppTokenDTO.osName) {
        case stringConstants.OS_ANDROID:
          user.android_token = setAppTokenDTO.appToken;
          user.androidVersion = setAppTokenDTO.osVersion;
          break;
        case stringConstants.OS_IOS:
          user.ios_token = setAppTokenDTO.appToken;
          user.iosVersion = setAppTokenDTO.osVersion;
          break;
        case stringConstants.OS_WEB:
          user.web_token = setAppTokenDTO.appToken;
          user.webVersion = setAppTokenDTO.osVersion;
          break;
        default:
          throw new Error('OS no reconocido');
      }
  
      user.updatedAt = new Date();
  
      return await this.userRepository.save(user);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  logout = async (userId: number, osName: string) => {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }
  
      switch (osName) {
        case stringConstants.OS_ANDROID:
          user.android_token = null;
          break;
        case stringConstants.OS_IOS:
          user.ios_token = null;
          break;
        case stringConstants.OS_WEB:
          user.web_token = null;
          break;
        default:
          throw new Error('OS no reconocido');
      }
  
      user.updatedAt = new Date();
  
      return await this.userRepository.save(user);
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
  findSiteMechanics = async (siteId: number) => {
    try {
      return await this.userRepository.find({
        where: {
          userHasSites: { site: { id: siteId } },
          userRoles: { role: { name: stringConstants.mechanic } },
        },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  getExistingUsersInSite = async (data: any, siteId: number) => {
    const existingUsers = await this.userRepository.find({
      where: {
        email: In(data.map((user) => user.Email.toLowerCase())),
        userHasSites: { site: { id: siteId } },
      },
    });
    return existingUsers;
  };
  getExistingUsersMap = async (data: any): Promise<Map<string, UserEntity>> => {
    const existingUsers = await this.userRepository.find({
      where: {
        email: In(data.map((user) => user.Email.toLowerCase())),
      },
    });

    const userMap = new Map(existingUsers.map((user) => [user.email, user]));
    return userMap;
  };

  saveImportedNewUsers = async (users: CreateUsersDTO[]) => {
    try {
      return await this.userRepository.save(users);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  assignSiteToImportedUsers = async (usersAndSites: UsersAndSitesDTO[]) => {
    try {
      return await this.userHasSiteRepository.save(usersAndSites);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  async findUsersByRole(siteId: number, roleName: string) {
    try {
      const users = await this.userRepository.find({
        where: {
          userHasSites: { site: { id: siteId } },
          userRoles: { role: { name: roleName } },
        },
      });
  
      return users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  }
  findPositionsByUserId = async (userId: number) => {
    try {
      const userPositions = await this.usersPositionsRepository.find({
        where: { user: { id: userId } },
        relations: { position: true },
      });
  
      return userPositions.map(({ position }) => ({
        id: position.id,
        name: position.name,
        description: position.description,
        route: position.route,
        levelId: position.levelId,
        levelName: position.levelName,
        areaId: position.areaId,
        areaName: position.areaName,
        siteId: position.siteId,
        siteName: position.siteName,
        siteType: position.siteType,
        status: position.status,
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };  

  findUsersBySiteWithRoles = async (siteId: number) => {
    try {
      const users = await this.userRepository.find({
        where: { userHasSites: { site: { id: siteId } } },
        relations: { 
          userRoles: { role: true },
          userHasSites: { site: true }
        },
      });

      return users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.userRoles.map((userRole) => ({
          id: userRole.role.id,
          name: userRole.role.name
        })),
        sites: user.userHasSites.map((userHasSite) => ({
          id: userHasSite.site.id,
          name: userHasSite.site.name,
          logo: userHasSite.site.logo
        }))
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findUsersBySiteWithPositions = async (siteId: number) => {
    try {
      const users = await this.userRepository.find({
        where: { userHasSites: { site: { id: siteId } } },
        relations: { 
          usersPositions: { position: true }
        },
      });

      return users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        positions: user.usersPositions.map((userPosition) => ({
          id: userPosition.position.id,
          name: userPosition.position.name,
          description: userPosition.position.description,
          route: userPosition.position.route,
          levelId: userPosition.position.levelId,
          levelName: userPosition.position.levelName,
          areaId: userPosition.position.areaId,
          areaName: userPosition.position.areaName,
          siteId: userPosition.position.siteId,
          siteName: userPosition.position.siteName,
          siteType: userPosition.position.siteType,
          status: userPosition.position.status
        }))
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
