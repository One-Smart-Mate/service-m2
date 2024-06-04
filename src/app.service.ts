import { Injectable } from '@nestjs/common';
import { stringConstants } from './utils/string.constant';

@Injectable()
export class AppService {
  getHello(): {app_version: string, env: string} {
    return {
      app_version: stringConstants.tagVersion,
      env: process.env.APP_ENV
    };
  }
}
