import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class UpdateAppRequestDTO {

    @ApiProperty({ description: 'app version' })
    @IsString()
    appVersion: string;

    @ApiProperty({ description: 'title' })
    @IsString()
    title: string;

    @ApiProperty({ description: 'description' })
    @IsString()
    description: string;

    constructor(appVersion: string, title: string, description: string) {
      this.appVersion = appVersion;
      this.title = title;
      this.description = description;
    }

  }
  