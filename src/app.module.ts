import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import typeOrmConfig from './config/type.orm.config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { PriorityModule } from './modules/priority/priority.module';
import { CardTypesModule } from './modules/cardTypes/cardTypes.module';
import { SiteModule } from './modules/site/site.module';
import { PreclassifierModule } from './modules/preclassifier/preclassifier.module';
import { RolesModule } from './modules/roles/roles.module';
import { LevelModule } from './modules/level/level.module';
import { CardModule } from './modules/card/card.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { StatusModule } from './modules/status/status.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { ExportModule } from './modules/export/export.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PositionModule } from './modules/position/position.module';
import { CiltMstrModule } from './modules/ciltMstr/ciltMstr.module';
import { CiltTypesModule } from './modules/ciltTypes/ciltTypes.module';
import { CiltSequencesFrequenciesModule } from './modules/ciltSequencesFrequenciesOLD/ciltSequencesFrequencies.module';
import { CiltSequencesModule } from './modules/ciltSequences/ciltSequences.module';
import { OplDetailsModule } from './modules/oplDetails/oplDetails.module';
import { OplMstrModule } from './modules/oplMstr/oplMstr.module';
import { RepositoryModule } from './modules/repositoryOLD/repository.module';
import { APP_INTERCEPTOR, APP_GUARD, APP_FILTER } from '@nestjs/core';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { IncidentInterceptor } from './interceptors/incident.interceptor';
import { CustomLoggerService } from './common/logger/logger.service';
import { CiltFrequenciesModule } from './modules/ciltFrequencies/ciltFrequencies.module';
import { CiltSequencesExecutionsModule } from './modules/CiltSequencesExecutions/ciltSequencesExecutions.module';
import { CiltSequencesExecutionsEvidencesModule } from './modules/CiltSequencesExecutionsEvidences/ciltSequencesExecutionsEvidences.module';
import { OplLevelsModule } from './modules/oplLevels/oplLevels.module';
import { CiltSecuencesScheduleModule } from './modules/ciltSecuencesSchedule/ciltSecuencesSchedule.module';
import { CiltMstrPositionLevelsModule } from './modules/ciltMstrPositionLevels/ciltMstrPositionLevels.module';
import { TaskModule } from './modules/task/task.module';
import { ScheduleModule } from '@nestjs/schedule';
import { IaModule } from './modules/ia/ia.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { AmDiscardReasonModule } from './modules/amDiscardReason/am-discard-reason.module';
import { OplTypesModule } from './modules/oplTypes/oplTypes.module';
import { AuthGuard } from './modules/auth/guard/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { HttpExceptionFilter } from './common/exceptions/http.exception.filter';
import { IncidentModule } from './modules/incident/incident.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    typeOrmConfig,
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    CompanyModule,
    PriorityModule,
    CardTypesModule,
    SiteModule,
    PreclassifierModule,
    RolesModule,
    LevelModule,
    CardModule,
    CurrencyModule,
    StatusModule,
    FileUploadModule,
    ExportModule,
    NotificationsModule,
    PositionModule,
    CiltMstrModule,
    CiltTypesModule,
    CiltFrequenciesModule,
    CiltSequencesModule,
    CiltSequencesFrequenciesModule,
    CiltSequencesExecutionsModule,
    CiltSequencesExecutionsEvidencesModule,
    OplMstrModule,
    OplDetailsModule,
    RepositoryModule,
    OplLevelsModule,
    CiltSecuencesScheduleModule,
    CiltMstrPositionLevelsModule,
    TaskModule,
    IaModule,
    WhatsappModule,
    AmDiscardReasonModule,
    OplTypesModule,
    IncidentModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CustomLoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IncidentInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
