import { ApiProperty } from '@nestjs/swagger';
import { PositionResponseDTO } from './position.response.dto';

export class UserWithPositionsResponseDTO {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ type: [PositionResponseDTO] })
  positions: PositionResponseDTO[];
} 