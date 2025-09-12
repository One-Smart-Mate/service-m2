import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { 
  ApiBearerAuth, 
  ApiTags, 
  ApiOperation, 
  ApiConsumes, 
  ApiBody, 
  ApiResponse,
  ApiProperty
} from '@nestjs/swagger';
import { FileUploadService } from './file-upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import { SiteIdDTO } from './dto/site.id.dto';

// DTO para documentación de Swagger
class FileUploadBodyDTO {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Archivo Excel (.xlsx) with data to import'
  })
  file: Express.Multer.File;

  @ApiProperty({
    description: 'Site ID where the users will be imported',
    example: '1'
  })
  siteId: string;
}

@ApiTags('File Upload')
@ApiBearerAuth()
@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}
  @Post('import-users')
  @ApiOperation({
    summary: 'Import users from Excel file',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Excel file with user data and site ID',
    type: FileUploadBodyDTO,
  })
  @ApiResponse({
    status: 200,
    description: 'Users imported successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Import successful'
        },
        data: {
          type: 'object',
          properties: {
            totalProcessed: {
              type: 'number',
              example: 4
            },
            successfullyCreated: {
              type: 'number',
              example: 3
            },
            processedUsers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  name: { type: 'string' },
                  reason: { type: 'string' },
                  registered: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or incorrect data',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Invalid file type. Only .xlsx files are allowed.' },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Token required'
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found'
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB size limit
      },
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype !==
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ) {
          return cb(
            new ValidationException(ValidationExceptionType.INVALID_FILE_TYPE),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadFile(
    @Body() siteIdDTO: SiteIdDTO,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new ValidationException(ValidationExceptionType.NO_FILE_UPLOADED);
    }

    return this.fileUploadService.importUsers(file, siteIdDTO);
  }
}
