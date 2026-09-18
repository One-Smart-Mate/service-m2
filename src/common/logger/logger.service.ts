import { Injectable, Logger } from '@nestjs/common';
import { sanitizeForLogging, sanitizeTextForLogging } from './log-sanitizer';

@Injectable()
export class CustomLoggerService extends Logger {
  private readonly colors = {
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    reset: '\x1b[0m',
  };

  log(message: any, ...optionalParams: any[]) {
    super.log(
      this.sanitizeArgument(message),
      ...optionalParams.map((param) => this.sanitizeArgument(param)),
    );
  }

  error(message: any, ...optionalParams: any[]) {
    super.error(
      this.sanitizeArgument(message),
      ...optionalParams.map((param) => this.sanitizeArgument(param)),
    );
  }

  warn(message: any, ...optionalParams: any[]) {
    super.warn(
      this.sanitizeArgument(message),
      ...optionalParams.map((param) => this.sanitizeArgument(param)),
    );
  }

  debug(message: any, ...optionalParams: any[]) {
    super.debug(
      this.sanitizeArgument(message),
      ...optionalParams.map((param) => this.sanitizeArgument(param)),
    );
  }

  verbose(message: any, ...optionalParams: any[]) {
    super.verbose(
      this.sanitizeArgument(message),
      ...optionalParams.map((param) => this.sanitizeArgument(param)),
    );
  }

  private sanitizeArgument(value: any) {
    return typeof value === 'string'
      ? sanitizeTextForLogging(value)
      : sanitizeForLogging(value);
  }

  logRequest(path: string, body: any) {
    this.log(
      `${this.colors.yellow}[REQUEST]${this.colors.reset} ${sanitizeTextForLogging(path)} ${JSON.stringify(sanitizeForLogging(body))}`,
    );
  }

  logFirebase(message: string) {
    this.log(
      `${this.colors.cyan}[FIREBASE]${this.colors.reset} ${sanitizeTextForLogging(message)}`,
    );
  }

  logException(context: string, method: string, error: any) {
    this.error(
      `Error in ${context}.${method}: ${sanitizeTextForLogging(error?.message)}`,
      sanitizeTextForLogging(error?.stack),
      context,
    );
  }

  logWhatsapp(content: string, info?: any) {
    this.log(
      `${this.colors.blue}[WHATSAPP]${this.colors.reset} ${sanitizeTextForLogging(content)} ${info ? JSON.stringify(sanitizeForLogging(info)) : ''}`,
    );
  }

  logEmail(content: string, info?: any) {
    this.log(
      `${this.colors.green}[EMAIL]${this.colors.reset} ${sanitizeTextForLogging(content)} ${info ? JSON.stringify(sanitizeForLogging(info)) : ''}`,
    );
  }

  logProcess(content: string, info?: any) {
    this.log(
      `${this.colors.magenta}[PROCESS]${this.colors.reset} ${sanitizeTextForLogging(content)} ${info ? JSON.stringify(sanitizeForLogging(info)) : ''}`,
    );
  }

  logIA(message: string) {
    this.log(`[IA] ${sanitizeTextForLogging(message)}`);
  }
}
