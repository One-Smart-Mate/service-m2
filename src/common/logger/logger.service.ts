import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CustomLoggerService {
  private readonly logger = new Logger();

  
  private readonly colors = {
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    reset: '\x1b[0m'
  };

  logRequest(path: string, body: any) {
    this.logger.log(`${this.colors.yellow}[REQUEST]${this.colors.reset} ${path} ${JSON.stringify(body)}`);
  }

  logFirebase(message: string) {
    this.logger.log(`${this.colors.cyan}[FIREBASE]${this.colors.reset} ${message}`);
  }

  logException(controller: string, method: string, error: any) {
    this.logger.error(
      `${this.colors.red}[EXCEPTION]${this.colors.yellow}[${controller}_${method}]${this.colors.reset} ${error.message}`,
      error.stack
    );
  }

  logEmail(content: string, info?: any) {
    this.logger.log(`${this.colors.green}[EMAIL]${this.colors.reset} ${content} ${info ? JSON.stringify(info) : ''}`);
  }

  logProcess(content: string, info?: any) {
    this.logger.log(`${this.colors.magenta}[PROCESS]${this.colors.reset} ${content} ${info ? JSON.stringify(info) : ''}`);
  }
} 