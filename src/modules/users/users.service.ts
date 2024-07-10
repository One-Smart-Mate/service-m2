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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly siteService: SiteService,
    private readonly roleService: RolesService,
  ) {}

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

  findSiteUsers = async (siteId: number) => {
    try {
      return await this.userRepository.find({
        where: { site: { id: siteId } },
      });
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
      const user = await this.userRepository.findOneBy({
        id: updateUserDTO.id,
      });

      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      const emailIsNotUnique = await this.userRepository.exists({
        where: { email: updateUserDTO.email, id: Not(updateUserDTO.id) },
      });
      if (emailIsNotUnique) {
        throw new ValidationException(ValidationExceptionType.DUPLICATED_USER);
      }

      const site = await this.siteService.findById(updateUserDTO.siteId);
      const roles = await this.roleService.findRolesByIds(updateUserDTO.roles);

      console.log(roles);
      if (!site) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
      } else if (roles.length === 0) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.ROLES);
      }

      user.name = updateUserDTO.name;
      user.email = updateUserDTO.email;
      if (updateUserDTO.password)
        user.password = await bcryptjs.hash(
          updateUserDTO.password,
          stringConstants.SALT_ROUNDS,
        );
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
          roles: user.userRoles.map((role) => role.id),
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
}
