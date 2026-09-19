import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { SiteModule } from '../site/site.module';
import { MailModule } from '../mail/mail.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { UserImportPersistence } from './user-import.persistence';

@Module({
  imports: [RolesModule, UsersModule, SiteModule, MailModule, WhatsappModule],
  providers: [
    FileUploadService,
    CustomLoggerService,
    UserImportPersistence,
  ],
  controllers: [FileUploadController],
})
export class FileUploadModule {}
