import { Module } from '@nestjs/common';
import { PreclassifierService } from './preclassifier.service';
import { PreclassifierController } from './preclassifier.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreclassifierEntity } from './entities/preclassifier.entity';
import { CardTypesModule } from '../cardTypes/cardTypes.module';

@Module({
  imports: [CardTypesModule, TypeOrmModule.forFeature([PreclassifierEntity])],
  controllers: [PreclassifierController],
  providers: [PreclassifierService],
  exports: [PreclassifierService]
})
export class PreclassifierModule {}
