import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OplTypes } from './entities/oplTypes.entity';
import { OplTypesService } from './oplTypes.service';
import { OplTypesController } from './oplTypes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OplTypes])],
  controllers: [OplTypesController],
  providers: [OplTypesService],
  exports: [OplTypesService],
})
export class OplTypesModule {}