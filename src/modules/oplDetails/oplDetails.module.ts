import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OplDetailsEntity } from './entities/oplDetails.entity';
import { OplDetailsService } from './oplDetails.service';
import { OplDetailsController } from './oplDetails.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OplDetailsEntity])],
  controllers: [OplDetailsController],
  providers: [OplDetailsService],
  exports: [OplDetailsService],
})
export class OplDetailsModule {} 