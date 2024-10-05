import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import { SiteIdDTO } from './dto/site.id.dto';
import { RolesService } from '../roles/roles.service';
import { CreateUsersDTO } from './dto/create.users.dto';
import { UsersService } from '../users/users.service';
import { SiteService } from '../site/site.service';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { UsersAndSitesDTO } from './dto/users.and.sites.dto';
import { generateRandomCode } from 'src/utils/general.functions';
import * as bcryptjs from 'bcryptjs';
import { stringConstants } from 'src/utils/string.constant';
import { UsersAndRolesDTO } from './dto/users.and.roles.dto';
import { RoleEntity } from '../roles/entities/role.entity';

@Injectable()
export class FileUploadService {
  constructor(
    private readonly roleService: RolesService,
    private readonly userService: UsersService,
    private readonly siteService: SiteService,
  ) {}
  importUsers = async (file: Express.Multer.File, siteIdDTO: SiteIdDTO) => {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      return await this.validateAndTransformUsersData(
        jsonData,
        Number(siteIdDTO.siteId),
      );
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  private validateAndTransformUsersData = async (data: any, siteId: number) => {
    const existingEmailsInFile = new Set();
    const usersToCreate: CreateUsersDTO[] = [];
    const usersAndSites: UsersAndSitesDTO[] = [];
    const usersAndRoles: UsersAndRolesDTO[] = [];
    const randomPassword = generateRandomCode(8);
    const currentDate = new Date();

    const [
      hashedPassword,
      site,
      rolesMap,
      existingUsersInSite,
      existingUsersMap,
    ] = await Promise.all([
      bcryptjs.hash(randomPassword, stringConstants.SALT_ROUNDS),
      this.siteService.findById(siteId),
      this.roleService.getRolesMap(),
      this.userService.getExistingUsersInSite(data, siteId),
      this.userService.getExistingUsersMap(data),
    ]);

    if (!site) {
      throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE);
    }

    const existingEmailsInSite = new Set(
      existingUsersInSite.map((user) => user.email),
    );

    const roleAssignments = new Map<string, RoleEntity>();

    data.forEach((record, index) => {
      const { Name, Email, Role } = record;

      if (!Name || !Email || !Role) {
        throw new ValidationException(
          ValidationExceptionType.MISSING_FIELDS,
          String(index + 2),
        );
      }

      const normalizedEmail = Email.toLowerCase();

      if (existingEmailsInFile.has(normalizedEmail)) {
        throw new ValidationException(
          ValidationExceptionType.DUPLICATED_EMAIL,
          String(index + 2),
        );
      } else {
        existingEmailsInFile.add(normalizedEmail);
      }

      if (existingEmailsInSite.has(normalizedEmail)) {
        throw new ValidationException(
          ValidationExceptionType.DUPLICATED_USER_AT_IMPORTATION,
          String(index + 2),
        );
      }

      const role = rolesMap.get(Role.toLowerCase());
      if (!role) {
        throw new ValidationException(
          ValidationExceptionType.INVALID_ROLE,
          String(index + 2),
        );
      }

      roleAssignments.set(normalizedEmail, role);

      const existingUser = existingUsersMap.get(normalizedEmail);

      if (existingUser) {
        usersAndSites.push({
          user: existingUser,
          site: site,
          createdAt: currentDate,
        });
      } else {
        usersToCreate.push({
          name: Name,
          email: normalizedEmail,
          password: hashedPassword,
          createdAt: currentDate,
          appVersion: process.env.APP_ENV,
        });
      }
    });

    const savedUsers =
      await this.userService.saveImportedNewUsers(usersToCreate);

    savedUsers.forEach((newUser) => {
      usersAndSites.push({
        user: newUser,
        site: site,
        createdAt: currentDate,
      });

      const role = roleAssignments.get(newUser.email);
      if (role) {
        usersAndRoles.push({
          user: newUser,
          role: role,
          createdAt: currentDate,
        });
      }
    });

    await this.userService.assignSiteToImportedUsers(usersAndSites);
    await this.roleService.assignRoleToImportedUsers(usersAndRoles);

    return {
      usersToCreate,
      usersAndSites,
    };
  };
}
