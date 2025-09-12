import { Injectable } from '@nestjs/common';
import { stringConstants } from './utils/string.constant';

@Injectable()
export class AppService {
  getAppInfo() {
    return {
      date: new Date().toISOString(),
      app_version: process.env.APP_VERSION || "env not found",
      deploy_env: process.env.DEPLOY_ENV || "deploy env not found",
    };
  }
}
