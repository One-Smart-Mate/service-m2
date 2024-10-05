import { IsString } from 'class-validator';

export class SiteIdDTO {
  @IsString()
  siteId: string;
}
