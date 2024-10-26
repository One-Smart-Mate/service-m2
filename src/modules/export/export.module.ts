import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { CardModule } from '../card/card.module';
import { SiteModule } from '../site/site.module';

@Module({
  imports: [CardModule, SiteModule],
  controllers: [ExportController],
})
export class ExportModule {}
