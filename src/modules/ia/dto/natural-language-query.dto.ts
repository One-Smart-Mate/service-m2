import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NaturalLanguageQueryDto {
  @ApiProperty({
    example: 'Muestra las tarjetas abiertas por sitio',
    description:
      'Pregunta de negocio que se convertira en una consulta de solo lectura',
    minLength: 3,
    maxLength: 1000,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  query: string;
}
