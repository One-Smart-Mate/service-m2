import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiltMstrController } from './ciltMstr.controller';
import { CiltMstrService } from './ciltMstr.service';
import { CiltMstrEntity } from './entities/ciltMstr.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CiltMstrEntity])],
  controllers: [CiltMstrController],
  providers: [CiltMstrService],
  exports: [CiltMstrService],
})
export class CiltMstrModule {}
