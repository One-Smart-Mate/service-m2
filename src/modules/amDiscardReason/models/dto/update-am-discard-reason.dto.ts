import { PartialType } from '@nestjs/mapped-types';
import { CreateAmDiscardReasonDto } from './create-am-discard-reason.dto';

export class UpdateAmDiscardReasonDto extends PartialType(
  CreateAmDiscardReasonDto,
) {} 