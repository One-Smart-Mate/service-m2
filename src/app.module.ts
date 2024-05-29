import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import typeOrmConfig from './config/type.orm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { PriorityModule } from './modules/priority/priority.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    typeOrmConfig,
    UsersModule,
    AuthModule,
    CompanyModule,
    PriorityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
