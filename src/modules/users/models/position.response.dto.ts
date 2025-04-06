// users/dto/position-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PositionResponseDTO {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty() description: string;
  @ApiProperty() route: string;
  @ApiProperty() levelId: number;
  @ApiProperty() levelName: string;
  @ApiProperty() areaId: number;
  @ApiProperty() areaName: string;
  @ApiProperty() siteId: number;
  @ApiProperty() siteName: string;
  @ApiProperty() siteType: string;
  @ApiProperty() status: string;
}
