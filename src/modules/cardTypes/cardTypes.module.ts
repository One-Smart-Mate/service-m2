import { Module } from '@nestjs/common';
import { CardTypesService } from './cardTypes.service';
import { CardTypesController } from './cardTypes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardTypesEntity } from './entities/cardTypes.entity';
import { CompanyModule } from '../company/company.module';
import { UsersModule } from '../users/users.module';
import { SiteModule } from '../site/site.module';

@Module({
  imports: [SiteModule ,CompanyModule, UsersModule,TypeOrmModule.forFeature([CardTypesEntity])],
  controllers: [CardTypesController],
  providers: [CardTypesService],
  exports: [CardTypesService]
})
export class CardTypesModule {}
