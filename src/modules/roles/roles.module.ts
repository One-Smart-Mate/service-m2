import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from './entities/role.entity';
import { UserRoleEntity } from './entities/user-role.entity';

@Module({ imports: [TypeOrmModule.forFeature([RoleEntity, UserRoleEntity])] })
export class RolesModule {}
