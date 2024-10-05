import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { SiteModule } from '../site/site.module';

@Module({
  imports: [RolesModule, UsersModule, SiteModule],
  providers: [FileUploadService],
  controllers: [FileUploadController],
})
export class FileUploadModule {}
