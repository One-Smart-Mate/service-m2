import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OplDetails } from './entities/oplDetails.entity';
import { OplDetailsService } from './oplDetails.service';
import { OplDetailsController } from './oplDetails.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OplDetails])],
  controllers: [OplDetailsController],
  providers: [OplDetailsService],
  exports: [OplDetailsService],
})
export class OplDetailsModule {} 