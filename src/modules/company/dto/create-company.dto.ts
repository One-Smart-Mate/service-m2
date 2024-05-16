import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

export class CreateCompanyDTO {
    @ApiProperty({ description: 'Name of the company', required: true })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ description: 'RFC of the company', required: true })
    @IsNotEmpty()
    @IsString()
    rfc: string;

    @ApiProperty({ description: 'Address of the company', required: true })
    @IsNotEmpty()
    @IsString()
    address: string;

    @ApiProperty({ description: 'Contact person', required: true })
    @IsNotEmpty()
    @IsString()
    contact: string;

    @ApiProperty({ description: 'Position of the contact person', required: true })
    @IsNotEmpty()
    @IsString()
    position: string;

    @ApiProperty({ description: 'Phone number of the company', required: true })
    @IsNotEmpty()
    @IsString()
    phone: string;

    @ApiProperty({ description: 'Phone extension (Optional)', required: false })
    @IsOptional()
    @IsString()
    extension?: string;

    @ApiProperty({ description: 'Celular number of the contact person (Optional)', required: false })
    @IsOptional()
    @IsString()
    cellular?: string;

    @ApiProperty({ description: 'Email address of the company', required: true })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'URL of the company logo', required: true, example: 'url' })
    @IsNotEmpty()
    @IsUrl()
    logo: string;

    createdAt?: Date
}
