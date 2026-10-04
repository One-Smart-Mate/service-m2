import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IncidentService } from '../modules/incident/incident.service';
import { CustomLoggerService } from '../common/logger/logger.service';
import { WhatsappService } from '../modules/whatsapp/whatsapp.service';
import { stringConstants } from '../utils/string.constant';
import {
  sanitizeForLogging,
  sanitizeTextForLogging,
} from '../common/logger/log-sanitizer';

@Injectable()
export class IncidentInterceptor implements NestInterceptor {
  constructor(
    private readonly incidentService: IncidentService,
    private readonly logger: CustomLoggerService,
    private readonly whatsappService: WhatsappService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const request = context.switchToHttp().getRequest();

        // Early return conditions - skip incident registration for these cases
        if (request.method === 'GET' && error.status === 404) {
          return throwError(() => error);
        }
        if (
          (error.message === stringConstants.incorrectAuth ||
            error.message === stringConstants.inactiveStatus) &&
          error.status === 400
        ) {
          return throwError(() => error);
        }

        // Process the incident in the background without blocking the error response
        this.processIncident(error, context).catch((incidentError) => {
          this.logger.logException(
            'IncidentInterceptor',
            'processIncident',
            incidentError,
          );
        });

        // Always re-throw the original error to maintain the error flow
        return throwError(() => error);
      }),
    );
  }

  private async processIncident(
    error: any,
    context: ExecutionContext,
  ): Promise<void> {
    try {
      const request = context.switchToHttp().getRequest();
      const controller = context.getClass().name;
      const method = context.getHandler().name;
      const timestamp = new Date().toISOString();

      const user = request.user;
      const userId = user?.id || 0;
      const userName = user?.name || 'SYSTEM';

      const userAgent = request.headers['user-agent'] || '';
      let platform: 'browser' | 'android' | 'ios' = 'browser';

      if (userAgent.toLowerCase().includes('android')) {
        platform = 'android';
      } else if (
        userAgent.toLowerCase().includes('iphone') ||
        userAgent.toLowerCase().includes('ios')
      ) {
        platform = 'ios';
      }

      const errorDetails = {
        timestamp,
        controller: controller,
        method: method,
        url: sanitizeTextForLogging(request.url),
        httpMethod: request.method,
        body: sanitizeForLogging(request.body),
        query: sanitizeForLogging(request.query),
        params: sanitizeForLogging(request.params),
        userAgent: userAgent,
        ip: request.ip || request.connection?.remoteAddress,
        headers: {
          authorization: request.headers.authorization
            ? '[PRESENT]'
            : '[NOT PRESENT]',
          'content-type': request.headers['content-type'],
          accept: request.headers['accept'],
        },
        user: {
          id: userId,
          name: userName,
          email: sanitizeForLogging({ email: user?.email || 'N/A' }).email,
        },
        error: {
          name: error.name,
          message: sanitizeTextForLogging(error.message),
          status: error.status,
          statusCode: error.statusCode,
          stack: sanitizeTextForLogging(error.stack),
        },
      };

      const description = `COMPLETE ERROR DETAILS:
🕐 TIMESTAMP: ${errorDetails.timestamp}
🎯 CONTROLLER: ${errorDetails.controller}
⚙️ METHOD: ${errorDetails.method}
🌐 URL: ${errorDetails.httpMethod} ${errorDetails.url}
🖥️ PLATFORM: ${platform}
👤 USER: ${errorDetails.user.name} (ID: ${errorDetails.user.id}, Email: ${errorDetails.user.email})
📍 IP: ${errorDetails.ip}

📥 REQUEST BODY:
${JSON.stringify(errorDetails.body, null, 2)}

🔍 QUERY PARAMS:
${JSON.stringify(errorDetails.query, null, 2)}

📋 URL PARAMS:
${JSON.stringify(errorDetails.params, null, 2)}

🌐 HEADERS:
${JSON.stringify(errorDetails.headers, null, 2)}

❌ ERROR DETAILS:
Name: ${errorDetails.error.name}
Message: ${errorDetails.error.message}
Status: ${errorDetails.error.status || errorDetails.error.statusCode || 'N/A'}

📜 STACK TRACE:
${errorDetails.error.stack}

🔧 USER AGENT:
${errorDetails.userAgent}
══════════════════════════════════`;

      await this.incidentService.create(
        {
          platform,
          description,
        },
        userId,
        userName,
      );

      this.logger.logProcess('INCIDENT AUTO-REGISTERED WITH FULL DETAILS', {
        controller,
        method,
        userId,
        userName,
        platform,
        errorMessage: error.message,
        url: request.url,
      });

      try {
        // k

        this.logger.logProcess('WHATSAPP NOTIFICATION SENT', {
          controller,
          method,
          userName,
        });
      } catch (whatsappError) {
        this.logger.logException(
          'IncidentInterceptor',
          'whatsappNotification',
          whatsappError,
        );
      }
    } catch (incidentError) {
      this.logger.logException(
        'IncidentInterceptor',
        'registerIncident',
        incidentError,
      );
    }
  }
}
