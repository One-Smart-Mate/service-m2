import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsArray, IsString, ArrayNotEmpty } from 'class-validator';
import { stringConstants } from 'src/utils/string.constant';

export class SendCustomNotificationDTO {
  @ApiProperty({
    description: stringConstants.siteIdDescription, 
    example: stringConstants.siteIdExample, 
  })
  @IsNotEmpty()
  @IsNumber()
  siteId: number;

  @ApiProperty({
    description: stringConstants.userIdsDescription, 
    example: stringConstants.userIdsExample, 
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  userIds: number[];

  @ApiProperty({
    description: stringConstants.titleDescription, 
    example: stringConstants.titleExample, 
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: stringConstants.descriptionDescription, 
    example: stringConstants.descriptionExample, 
  })
  @IsNotEmpty()
  @IsString()
  description: string;
}
