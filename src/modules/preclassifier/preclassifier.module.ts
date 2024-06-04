import { Module } from '@nestjs/common';
import { PreclassifierService } from './preclassifier.service';
import { PreclassifierController } from './preclassifier.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreclassifierEntity } from './entities/preclassifier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PreclassifierEntity])],
  controllers: [PreclassifierController],
  providers: [PreclassifierService],
})
export class PreclassifierModule {}
