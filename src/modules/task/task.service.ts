import {
  ciltLocalDateAt,
  DEFAULT_SITE_TIMEZONE,
} from '../../utils/cilt-timezone.utils';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SiteService } from '../site/site.service';
import { CiltMstrService } from '../ciltMstr/ciltMstr.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { CustomLoggerService } from '../../common/logger/logger.service';

@Injectable()
export class TaskService {
  private readonly processedDates = new Map<number, string>();
  private processing = false;

  constructor(
    private readonly siteService: SiteService,
    private readonly ciltMstrService: CiltMstrService,
    private readonly whatsappService: WhatsappService,
    private readonly logger: CustomLoggerService,
  ) {}

  @Cron('0 */5 * * * *', {
    name: 'dailySiteProcessingTask',
    timeZone: 'UTC',
  })
  async handleDailyTask() {
    if (this.processing) return;
    this.processing = true;
    const startTime = Date.now();
    let totalCiltsGenerated = 0;
    let processedSites = 0;
    let errorSites = 0;
    const currentDate = new Date();
    const dateString = ciltLocalDateAt(currentDate, DEFAULT_SITE_TIMEZONE); // Format: YYYY-MM-DD

    try {
      const sites = await this.siteService.findAll();
      if (!sites?.length) {
        this.logger.logProcess(`[CRON] No sites to process`);
        await this.sendTaskCompletionNotification(0, 0, 0, 0, dateString);
        return;
      }

      // Process each site sequentially
      for (const site of sites) {
        if (site.status !== 'A' || site.deletedAt) continue;
        try {
          const siteDate = ciltLocalDateAt(
            currentDate,
            site.timezone || DEFAULT_SITE_TIMEZONE,
          );
          if (this.processedDates.get(Number(site.id)) === siteDate) continue;
          this.logger.logProcess(
            `[SITE-${site.id}] Starting processing for ${siteDate}...`,
          );

          const cilts = await this.ciltMstrService.findCiltsBySiteId(
            site.id,
            siteDate,
          );
          const ciltCount = cilts.total || 0;

          totalCiltsGenerated += ciltCount;
          processedSites++;
          this.processedDates.set(Number(site.id), siteDate);

          this.logger.logProcess(
            `[SITE-${site.id}] Completed - CILTs generated: ${ciltCount}`,
          );
        } catch (error) {
          errorSites++;
          this.logger.logProcess(`[SITE-${site.id}] Error: ${error.message}`);
        }
      }

      if (!processedSites && !errorSites) return;
      const executionTime = Date.now() - startTime;
      this.logger.logProcess(
        `[CRON] Task completed - Sites processed: ${processedSites}, Errors: ${errorSites}, CILTs generated: ${totalCiltsGenerated}, Time: ${executionTime}ms`,
      );

      // Send WhatsApp notification with the summary
      await this.sendTaskCompletionNotification(
        processedSites,
        errorSites,
        totalCiltsGenerated,
        executionTime,
        dateString,
      );
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.logProcess(`[CRON] Critical error in task: ${error.message}`);

      // Send critical error notification
      await this.sendTaskErrorNotification(
        error.message,
        processedSites,
        totalCiltsGenerated,
        executionTime,
        dateString,
      );
    } finally {
      this.processing = false;
    }
  }

  private async sendTaskCompletionNotification(
    processedSites: number,
    errorSites: number,
    totalCilts: number,
    executionTime: number,
    processedDate: string,
  ) {
    try {
      const executionMinutes = Math.round(executionTime / 60000);
      const message =
        `🤖 *Daily CILT Task Completed*\n\n` +
        `📊 *Execution Summary:*\n` +
        `✅ Sites processed: ${processedSites}\n` +
        `❌ Sites with error: ${errorSites}\n` +
        `📋 Total CILTs generated: ${totalCilts}\n` +
        `📅 Processed date: ${processedDate}\n` +
        `⏱️ Execution time: ${executionMinutes} minutes\n` +
        `🕐 Executed at: ${new Date().toLocaleTimeString('es-MX')}`;

      // await this.whatsappService.sendIncidentNotification(message);
      this.logger.logProcess(
        `[WHATSAPP] Completion notification sent ${message}`,
      );
    } catch (error) {
      this.logger.logProcess(
        `[WHATSAPP] Error sending notification: ${error.message}`,
      );
    }
  }

  private async sendTaskErrorNotification(
    errorMessage: string,
    processedSites: number,
    totalCilts: number,
    executionTime: number,
    processedDate: string,
  ) {
    try {
      const executionMinutes = Math.round(executionTime / 60000);
      const message =
        `🚨 *Critical Error in CILT Task*\n\n` +
        `❌ *Error:* ${errorMessage}\n\n` +
        `📊 *State before error:*\n` +
        `✅ Sites processed: ${processedSites}\n` +
        `📋 CILTs generated: ${totalCilts}\n` +
        `📅 Processed date: ${processedDate}\n` +
        `⏱️ Execution time: ${executionMinutes} minutes\n` +
        `🕐 Executed at: ${new Date().toLocaleTimeString('es-MX')}\n\n` +
        `⚠️ Check logs for more details`;

      // await this.whatsappService.sendIncidentNotification(message);
      this.logger.logProcess(
        `[WHATSAPP] Critical error notification sent ${message}`,
      );
    } catch (error) {
      this.logger.logProcess(
        `[WHATSAPP] Error sending error notification: ${error.message}`,
      );
    }
  }
}
