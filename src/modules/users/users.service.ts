import { Not, Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly siteService: SiteService,
    private readonly roleService: RolesService,
    private readonly mailService: MailService,
    private readonly firebaseService: FirebaseService,
  ) {}

  sendCodeToEmail = async (email: string) => {
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

      await this.mailService.sendResetPasswordCode(user, resetCode);
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
      relations: ['site'],
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
        where: { site: { id: siteId } },
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  getSiteUsersTokens = async (siteId: number) => {
    try {
      const users = await this.userRepository.find({
        where: { site: { id: siteId } },
        select: ['appToken'],
      });

      const tokens = users.map((user) => user.appToken);

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
        where: { site: { id: siteId }, id: Not(userId) },
        select: ['appToken'],
      });

      const tokens = users.map((user) => user.appToken);

      return tokens;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findAllUsers = async () => {
    try {
      const users = await this.userRepository.find({
        relations: ['userRoles', 'userRoles.role', 'site'],
      });

      const transformedUsers = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.userRoles.map((userRole) => ({
          id: userRole.role.id,
          name: userRole.role.name,
        })),
        site: { id: user.site.id, name: user.site.name, logo: user.site.logo },
      }));

      return transformedUsers;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findSiteUsers = async (siteId: number) => {
    try {
      const users = await this.userRepository.find({
        where: { site: { id: siteId } },
        relations: ['userRoles', 'userRoles.role', 'site'],
      });

      const transformedUsers = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.userRoles.map((userRole) => ({
          id: userRole.role.id,
          name: userRole.role.name,
        })),
        site: { id: user.site.id, name: user.site.name, logo: user.site.logo },
      }));

      return transformedUsers;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createUserDTO: CreateUserDTO) => {
    try {
      const emailExists = await this.userRepository.existsBy({
        email: createUserDTO.email,
      });
      if (emailExists) {
        throw new ValidationException(ValidationExceptionType.DUPLICATED_USER);
      }

      const site = await this.siteService.findById(createUserDTO.siteId);
      const roles = await this.roleService.findRolesByIds(createUserDTO.roles);

      if (!site) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      } else if (roles.length === 0) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.ROLES);
      }
      const currentSiteUsers = await this.userRepository.findBy({
        site: { id: createUserDTO.siteId },
      });
      if (currentSiteUsers.length === site.userQuantity) {
        throw new ValidationException(
          ValidationExceptionType.USER_QUANTITY_EXCEEDED,
        );
      }

      const user = await this.userRepository.create({
        name: createUserDTO.name,
        email: createUserDTO.email,
        password: await bcryptjs.hash(
          createUserDTO.password,
          stringConstants.SALT_ROUNDS,
        ),
        site: site,
        appVersion: process.env.APP_ENV,
        siteCode: site.siteCode,
        uploadCardDataWithDataNet: createUserDTO.uploadCardDataWithDataNet,
        uploadCardEvidenceWithDataNet:
          createUserDTO.uploadCardEvidenceWithDataNet,
        createdAt: new Date(),
      });

      await this.userRepository.save(user);

      return await this.roleService.assignUserRoles(user, roles);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  updateUser = async (updateUserDTO: UpdateUserDTO) => {
    try {
      const [user, emailIsNotUnique, site, roles] = await Promise.all([
        this.userRepository.findOne({
          where: { id: updateUserDTO.id },
          relations: ['site'],
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

      if (site.id !== user.site.id) {
        const currentSiteUsers = await this.userRepository.find({
          where: { site: { id: updateUserDTO.siteId } },
        });
        if (currentSiteUsers.length === site.userQuantity) {
          throw new ValidationException(
            ValidationExceptionType.USER_QUANTITY_EXCEEDED,
          );
        }
      }

      user.name = updateUserDTO.name;
      user.email = updateUserDTO.email;
      if (updateUserDTO.password) {
        user.password = await bcryptjs.hash(
          updateUserDTO.password,
          stringConstants.SALT_ROUNDS,
        );
      }
      user.site = site;
      user.appVersion = process.env.APP_ENV;
      user.siteCode = site.siteCode;
      user.uploadCardDataWithDataNet = updateUserDTO.uploadCardDataWithDataNet;
      user.uploadCardEvidenceWithDataNet =
        updateUserDTO.uploadCardEvidenceWithDataNet;
      user.updatedAt = new Date();

      await this.userRepository.save(user);

      return await this.roleService.updateUserRoles(user, roles);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findOneById = async (userId: number) => {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['site', 'userRoles', 'userRoles.role'],
      });
      if (user) {
        const transformedUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.userRoles.map((userRoles) => userRoles.role.id),
          siteId: user.site.id,
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

      user.appToken = setAppTokenDTO.appToken;

      return await this.userRepository.save(user);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  sendMessage = async (token: string) => {
    try {
      await this.firebaseService.sendNewMessage(token);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
