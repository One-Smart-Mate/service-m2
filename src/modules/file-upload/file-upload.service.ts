import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
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
import { MailService } from '../mail/mail.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { CustomLoggerService } from 'src/common/logger/logger.service';
import {
  ImportedUserRow,
  parseUserImportWorkbook,
} from './xlsx-import.parser';
import { digestFastPassword } from '../auth/fast-password.crypto';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor(
    private readonly roleService: RolesService,
    private readonly userService: UsersService,
    private readonly siteService: SiteService,
    private readonly mailService: MailService,
    private readonly whatsappService: WhatsappService,
    private readonly customLogger: CustomLoggerService,
  ) {}

  private async sendFastPasswordWhatsAppMessage(
    phoneNumber: string | number,
    fastPassword: string,
    language?: string | null,
  ): Promise<void> {
    try {
      if (phoneNumber && fastPassword) {
        // Convert phoneNumber to string if it's a number
        const phoneNumberStr = String(phoneNumber);

        // Ensure language is valid, default to ES if null, undefined, or invalid
        const validLanguage =
          language === stringConstants.LANG_EN
            ? stringConstants.LANG_EN
            : stringConstants.LANG_ES;

        await this.whatsappService.sendAuthenticationMessages([
          {
            phoneNumber: phoneNumberStr,
            code: fastPassword,
            language: validLanguage,
          },
        ]);
        this.customLogger.log(
          `WhatsApp authentication message sent successfully in language: ${validLanguage}`,
        );
      }
    } catch (error) {
      this.customLogger.error(
        `Failed to send WhatsApp authentication message: ${error.message}`,
      );
    }
  }

  importUsers = async (
    file: Express.Multer.File,
    siteIdDTO: SiteIdDTO,
    requesterId: number,
  ) => {
    try {
      const siteId = Number(siteIdDTO.siteId);
      if (!Number.isSafeInteger(siteId) || siteId <= 0) {
        throw new BadRequestException('Invalid siteId');
      }

      const accessibleSiteIds =
        await this.userService.getAccessibleSiteIds(requesterId);
      if (accessibleSiteIds !== null && !accessibleSiteIds.includes(siteId)) {
        throw new ForbiddenException('Site access denied');
      }

      const jsonData = await parseUserImportWorkbook(file.buffer);

      const result = await this.validateAndTransformUsersData(jsonData, siteId);

      return {
        message:
          result.successfullyCreated > 0
            ? stringConstants.successImport
            : stringConstants.allUsersAlreadyExist,
        data: result,
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  private validateAndTransformUsersData = async (
    data: ImportedUserRow[],
    siteId: number,
  ) => {
    const existingEmailsInFile = new Set();
    const usersToCreate: CreateUsersDTO[] = [];
    const usersAndSites: UsersAndSitesDTO[] = [];
    const usersAndRoles: UsersAndRolesDTO[] = [];
    const randomPassword = generateRandomCode(8);
    const currentDate = new Date();
    const processedUsers: {
      email: string;
      name: string;
      reason: string;
      registered: boolean;
    }[] = [];
    const importedFastPasswords = new Map<string, string>();
    const importedFastPasswordDigests = new Set<string>();

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

    for (const record of data) {
      // Support both PhoneNumber and Celular column names for compatibility
      const { Name, Email, Role, PhoneNumber, Celular, Translation } = record;
      const phoneNumber = PhoneNumber || Celular; // Use PhoneNumber if available, otherwise use Celular

      if (!Name || !Email || !Role) {
        processedUsers.push({
          email: Email || stringConstants.emailIsMissing,
          name: Name || '',
          reason: '',
          registered: false,
        });
        continue;
      }

      const normalizedEmail = Email.toLowerCase();

      if (existingEmailsInFile.has(normalizedEmail)) {
        processedUsers.push({
          email: normalizedEmail,
          name: Name,
          reason: stringConstants.duplicatedEmailAtRow,
          registered: false,
        });
        continue;
      } else {
        existingEmailsInFile.add(normalizedEmail);
      }

      if (existingEmailsInSite.has(normalizedEmail)) {
        processedUsers.push({
          email: normalizedEmail,
          name: Name,
          reason: stringConstants.duplicatedEmailAtRow,
          registered: false,
        });
        continue;
      }

      const role = rolesMap.get(Role.toLowerCase());
      if (!role) {
        processedUsers.push({
          email: normalizedEmail,
          name: Name,
          reason: '',
          registered: false,
        });
        continue;
      }

      roleAssignments.set(normalizedEmail, role);

      const existingUser = existingUsersMap.get(normalizedEmail);

      if (existingUser) {
        usersAndSites.push({
          user: existingUser,
          site: site,
          createdAt: currentDate,
        });
        processedUsers.push({
          email: normalizedEmail,
          name: Name,
          reason: '',
          registered: true,
        });
      } else {
        let fastPassword =
          await this.userService.generateUniqueFastPassword(siteId);
        let fastPasswordDigest = digestFastPassword(fastPassword);
        while (importedFastPasswordDigests.has(fastPasswordDigest)) {
          fastPassword =
            await this.userService.generateUniqueFastPassword(siteId);
          fastPasswordDigest = digestFastPassword(fastPassword);
        }
        importedFastPasswordDigests.add(fastPasswordDigest);
        usersToCreate.push({
          name: Name,
          email: normalizedEmail,
          password: hashedPassword,
          fastPasswordDigest,
          siteId: siteId,
          createdAt: currentDate,
          appVersion: process.env.APP_ENV,
          siteCode: site.siteCode,
          phoneNumber: phoneNumber || null,
          translation: Translation || stringConstants.LANG_ES,
        });
        importedFastPasswords.set(normalizedEmail, fastPassword);
        processedUsers.push({
          email: normalizedEmail,
          name: Name,
          reason: '',
          registered: true,
        });
      }
    }

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

    const appUrl = process.env.URL_WEB;
    for (const newUser of savedUsers) {
      try {
        await this.mailService.sendWelcomeEmail(
          newUser,
          appUrl,
          newUser.translation || stringConstants.LANG_ES,
        );
      } catch (error) {
        this.logger.error(`Failed to send welcome email: ${error.message}`);
      }

      // Send fastPassword via WhatsApp if phone number is provided
      const fastPassword = importedFastPasswords.get(newUser.email);
      if (newUser.phoneNumber && fastPassword) {
        try {
          await this.sendFastPasswordWhatsAppMessage(
            newUser.phoneNumber,
            fastPassword,
            newUser.translation || stringConstants.LANG_ES,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send WhatsApp authentication message: ${error.message}`,
          );
        }
      }
    }

    return {
      totalProcessed: data.length,
      successfullyCreated: savedUsers.length,
      processedUsers,
    };
  };
}
