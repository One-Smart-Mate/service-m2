import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { stringConstants } from 'src/utils/string.constant';

export class UpdateStatusDTO {
  @ApiProperty({ description: 'Id', required: true })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Status',
    required: true,
    example: 'A or I',
    minimum: 1,
  })
  @IsNotEmpty()
  @IsString()
  @IsIn([stringConstants.activeStatus, stringConstants.inactiveStatus])
  status: string;
}
