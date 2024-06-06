import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants/jwt.constant';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from '../roles/entities/role.entity';
import { UserRoleEntity } from '../roles/entities/user-role.entity';
import { SiteModule } from '../site/site.module';

@Module({
  imports: [
    UsersModule,
    SiteModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '18h' },
    }),
    TypeOrmModule.forFeature([RoleEntity, UserRoleEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
