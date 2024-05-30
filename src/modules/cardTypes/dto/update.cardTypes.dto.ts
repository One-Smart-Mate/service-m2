import { PartialType } from '@nestjs/swagger';
import { CreateCardTypeDto } from './create.cardTypes.dto';

export class UpdateCardTypeDto extends PartialType(CreateCardTypeDto) {}
