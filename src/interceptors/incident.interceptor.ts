import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IncidentService } from '../modules/incident/incident.service';
import { CustomLoggerService } from '../common/logger/logger.service';
import { WhatsappService } from '../modules/whatsapp/whatsapp.service';

@Injectable()
export class IncidentInterceptor implements NestInterceptor {
  constructor(
    private readonly incidentService: IncidentService,
    private readonly logger: CustomLoggerService,
    private readonly whatsappService: WhatsappService
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap({
        error: async (error) => {
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
            } else if (userAgent.toLowerCase().includes('iphone') || userAgent.toLowerCase().includes('ios')) {
              platform = 'ios';
            }

            const errorDetails = {
              timestamp,
              controller: controller,
              method: method,
              url: request.url,
              httpMethod: request.method,
              body: request.body,
              query: request.query,
              params: request.params,
              userAgent: userAgent,
              ip: request.ip || request.connection?.remoteAddress,
              headers: {
                authorization: request.headers.authorization ? '[PRESENT]' : '[NOT PRESENT]',
                'content-type': request.headers['content-type'],
                'accept': request.headers['accept'],
              },
              user: {
                id: userId,
                name: userName,
                email: user?.email || 'N/A'
              },
              error: {
                name: error.name,
                message: error.message,
                status: error.status,
                statusCode: error.statusCode,
                stack: error.stack
              }
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
                description
              },
              userId,
              userName
            );

            this.logger.logProcess('INCIDENT AUTO-REGISTERED WITH FULL DETAILS', {
              controller,
              method,
              userId,
              userName,
              platform,
              errorMessage: error.message,
              url: request.url
            });

            try {
              await this.whatsappService.sendIncidentNotification(description);
              
              this.logger.logProcess('WHATSAPP NOTIFICATION SENT', {
                controller,
                method,
                userName
              });
            } catch (whatsappError) {
              this.logger.logException('IncidentInterceptor', 'whatsappNotification', whatsappError);
            }

          } catch (incidentError) {
            this.logger.logException('IncidentInterceptor', 'registerIncident', incidentError);
          }
        }
      })
    );
  }
} 