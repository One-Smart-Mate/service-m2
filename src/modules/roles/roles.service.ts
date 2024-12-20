import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from './entities/role.entity';
import { In, Not, Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { UserRoleEntity } from './entities/user-role.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateRoleDTO } from './models/create.role.dto';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import { UpdateRoleDTO } from './models/update.role.dto';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { UsersAndRolesDTO } from '../file-upload/dto/users.and.roles.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly rolesRepository: Repository<RoleEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
  ) {}

  findAll = async () => {
    try {
      return await this.rolesRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findRolesByIds = async (rolesIds: number[]) => {
    try {
      return await this.rolesRepository.findBy({ id: In(rolesIds) });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  getRolesMap = async (): Promise<Map<string, RoleEntity>> => {
    try {
      const roles = await this.rolesRepository.find();
      const rolesMap = new Map<string, RoleEntity>();

      roles.forEach((role) => {
        rolesMap.set(role.name.toLowerCase(), role);
      });

      return rolesMap;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  assignRoleToImportedUsers = async (usersAndSites: UsersAndRolesDTO[]) => {
    try {
      return await this.userRoleRepository.save(usersAndSites);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  assignUserRoles = async (
    user: UserEntity,
    roleEntities: RoleEntity[],
  ): Promise<UserEntity> => {
    try {
      const userRoles = roleEntities.map((role) => {
        const userRole = new UserRoleEntity();
        userRole.user = user;
        userRole.role = role;
        return userRole;
      });

      await this.userRoleRepository.save(userRoles);

      return user;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  updateUserRoles = async (
    user: UserEntity,
    newRoleEntities: RoleEntity[],
  ): Promise<UserEntity> => {
    try {
      const currentUserRoles = await this.userRoleRepository.find({
        where: { user: { email: user.email } },
        relations: ['role'],
      });
      const currentRoleIds = new Set(currentUserRoles.map((ur) => ur.role.id));
      const newRoleIds = new Set(newRoleEntities.map((role) => role.id));

      const rolesToRemove = currentUserRoles.filter(
        (ur) => !newRoleIds.has(ur.role.id),
      );
      if (rolesToRemove.length > 0) {
        await this.userRoleRepository.remove(rolesToRemove);
      }

      const rolesToAdd = newRoleEntities.filter(
        (role) => !currentRoleIds.has(role.id),
      );
      if (rolesToAdd.length > 0) {
        const newUserRoles = rolesToAdd.map((role) => {
          const userRole = new UserRoleEntity();
          userRole.user = user;
          userRole.role = role;
          return userRole;
        });
        await this.userRoleRepository.save(newUserRoles);
      }

      return user;
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  };

  create = async (createRoleDTO: CreateRoleDTO) => {
    try {
      const roleExists = await this.rolesRepository.existsBy({
        name: createRoleDTO.name,
      });

      if (roleExists) {
        throw new ValidationException(ValidationExceptionType.DUPLICATE_ROLE);
      }

      createRoleDTO.createdAt = new Date();

      return await this.rolesRepository.save(createRoleDTO);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateRoleDTO: UpdateRoleDTO) => {
    try {
      const role = await this.rolesRepository.findOneBy({
        id: updateRoleDTO.id,
      });

      if (!role) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.ROLES);
      }

      const isDuplicateRole = await this.rolesRepository.exists({
        where: { name: updateRoleDTO.name, id: Not(updateRoleDTO.id) },
      });

      if (isDuplicateRole) {
        throw new ValidationException(ValidationExceptionType.DUPLICATE_ROLE);
      }

      role.name = updateRoleDTO.name;

      return await this.rolesRepository.save(role);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findOneById = async (roleId: number) => {
    try {
      return await this.rolesRepository.findOneBy({ id: roleId });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
