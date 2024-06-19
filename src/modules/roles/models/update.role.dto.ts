import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class UpdateRoleDTO {
  @ApiProperty({
    example: 1,
    description: 'The ID of the preclassifier.',
    type: 'number',
  })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Name of the role', type: String })
  @IsString()
  name: string;
}
