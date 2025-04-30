import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OplMstr } from './entities/oplMstr.entity';
import { OplMstrService } from './oplMstr.service';
import { OplMstrController } from './oplMstr.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OplMstr])],
  controllers: [OplMstrController],
  providers: [OplMstrService],
  exports: [OplMstrService],
})
export class OplMstrModule {} 