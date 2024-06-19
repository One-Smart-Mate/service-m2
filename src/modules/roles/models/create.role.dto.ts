import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateRoleDTO {
    @ApiProperty({ description: 'Name of the role', type: String })
    @IsString()
    name: string;

    createdAt?: Date
}