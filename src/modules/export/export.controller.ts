import { Controller, Get, Param, Res } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { CardService } from '../card/card.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SiteService } from '../site/site.service';

@ApiBearerAuth()
@ApiTags('export')
@Controller('export')
export class ExportController {
  constructor(
    private readonly cardService: CardService,
    private readonly siteService: SiteService,
  ) {}

  @ApiTags('card-data')
  @Get('card-data/site/:siteId')
  async exportXLS(@Param('siteId') siteId: number, @Res() res: Response) {
    const cards = await this.cardService.findbySiteId(siteId);
    const cardTypes =
      await this.cardService.findSiteCardsGroupedByMethodology(siteId);
    const siteName = await this.siteService.getSiteNameById(siteId);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tarjetas de ' + siteName);

    worksheet.columns = [
      { header: 'Tarjeta N°', key: 'cardNumber', width: 15 },
      { header: 'Registrado por', key: 'creator', width: 30 },
      { header: 'Anomalía', key: 'anomaly', width: 45 },
      ...cardTypes.map((cardType) => {
        return {
          header: cardType.methodology,
          key: cardType.methodology.toLowerCase(),
          width: 20,
        };
      }),
      { header: 'Área', key: 'area', width: 30 },
      { header: 'Localización', key: 'location', width: 45 },
      { header: 'Máquina', key: 'machine', width: 30 },
      { header: 'Hecho en fecha', key: 'createdAt', width: 20 },
      { header: 'Prioridad', key: 'priority', width: 35 },
      { header: 'Descripción problema', key: 'comments', width: 45 },
      { header: 'Solución rápida', key: 'provisionalComments', width: 45 },
      { header: 'Responsable', key: 'userProvisionalSolution', width: 30 },
      { header: 'Fecha real', key: 'provisionalDate', width: 20 },
      { header: 'Medida final', key: 'definitiveComments', width: 45 },
      { header: 'Responsable', key: 'userDefinitiveSolution', width: 30 },
      { header: 'Fecha debida', key: 'dueDate', width: 20 },
      { header: 'Fecha real', key: 'definitiveDate', width: 20 },
    ];

    worksheet.columns.forEach((column, index) => {
      const cell = worksheet.getCell(1, index + 1);
      const cardType = cardTypes.find((ct) => ct.methodology === column.header);
      if (cardType) {
        cell.font = {
          name: 'Arial',
          size: 8,
          bold: true,
          color: { argb: 'black' },
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: cardType.color },
        };
      } else {
        cell.font = {
          name: 'Arial',
          size: 12,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '442778' },
        };
      }
    });

    cards.forEach((card) => {
      const rowData = {
        cardNumber: card.siteCardId,
        creator: card.creatorName,
        anomaly: `${card.preclassifierCode} - ${card.preclassifierDescription}`,
        area: card.areaName,
        location: card.cardLocation,
        machine: card.nodeName,
        createdAt: card.createdAt,
        priority: card.priorityCode
          ? `${card.priorityCode} - ${card.priorityDescription}`
          : '',
        comments: card.commentsAtCardCreation,
        provisionalComments: card.commentsAtCardProvisionalSolution,
        userProvisionalSolution: card.userProvisionalSolutionName,
        provisionalDate: card.cardProvisionalSolutionDate,
        definitiveComments: card.commentsAtCardDefinitiveSolution,
        userDefinitiveSolution: card.userDefinitiveSolutionName,
        dueDate: card.cardDueDate,
        definitiveDate: card.cardDefinitiveSolutionDate,
      };

      cardTypes.forEach((cardType) => {
        if (cardType.methodology === card.cardTypeName) {
          rowData[cardType.methodology.toLowerCase()] = 'x';
        } else {
          rowData[cardType.methodology.toLowerCase()] = '-';
        }
      });

      const newRow = worksheet.addRow(rowData);

      newRow.eachCell((cell) => {
        if (cell.value === 'x') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: card.cardTypeColor },
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.font = { name: 'Arial', size: 9, color: { argb: 'black' } };
        } else if (cell.value === '-') {
          cell.font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.font = { name: 'Arial', size: 9, color: { argb: '6A615A' } };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
    });

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.header('Content-Disposition', 'attachment; filename=Tablero.xlsx');
    res.type(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }

  @ApiTags("test-exports")
  @Get("test-exports")
  async testExports() {
    return 200;
  }
}
