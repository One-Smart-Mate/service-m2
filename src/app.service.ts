import { Injectable } from '@nestjs/common';
import { stringConstants } from './utils/string.constant';

@Injectable()
export class AppService {
  getAppInfo(): { app_version: string } {
    console.log("ENV")
    console.log(process.env)
    return {
      app_version: process.env.APP_ENV,
    };
  }
}
