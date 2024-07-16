import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersController } from './users.controller';
import { RolesModule } from '../roles/roles.module';
import { SiteModule } from '../site/site.module';
import { MailModule } from '../mail/mail.module';


@Module({
  imports: [SiteModule, RolesModule, MailModule,TypeOrmModule.forFeature([UserEntity])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
