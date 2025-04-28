import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltTypesEntity } from './entities/ciltTypes.entity';
import { CiltTypesService } from './ciltTypes.service';
import { CiltTypesController } from './ciltTypes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CiltTypesEntity])],
  controllers: [CiltTypesController],
  providers: [CiltTypesService],
  exports: [CiltTypesService],
})
export class CiltTypesModule {} 