import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltTypes } from './entities/ciltTypes.entity';
import { CiltTypesService } from './ciltTypes.service';
import { CiltTypesController } from './ciltTypes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CiltTypes])],
  controllers: [CiltTypesController],
  providers: [CiltTypesService],
  exports: [CiltTypesService],
})
export class CiltTypesModule {} 