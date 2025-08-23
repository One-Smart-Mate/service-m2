import {
  BadRequestException,
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
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { SiteIdDTO } from './dto/site.id.dto';

// DTO para documentación de Swagger
class FileUploadBodyDTO {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Archivo Excel (.xlsx) con los datos de usuarios a importar'
  })
  file: Express.Multer.File;

  @ApiProperty({
    description: 'ID del sitio donde se importarán los usuarios',
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
    summary: 'Importar usuarios desde archivo Excel',
    description: `
    Importa usuarios masivamente desde un archivo Excel (.xlsx).
    
    **Estructura requerida del Excel:**
    - **Name** (requerido): Nombre completo del usuario
    - **Email** (requerido): Correo electrónico único
    - **Role** (requerido): Rol del usuario (debe existir en el sistema)
    - **PhoneNumber** (opcional): Teléfono para notificaciones WhatsApp
    - **Translation** (opcional): Idioma (ES/EN, por defecto ES)
    
    **Roles disponibles:** TH_sis_admin, mechanic, local_admin, local_sis_admin, operator, external_provider
    
    **Validaciones:**
    - Archivo debe ser .xlsx y menor a 5MB
    - Emails deben ser únicos
    - Roles deben existir en el sistema
    - Se generan contraseñas automáticamente
    - Se envían emails de bienvenida y WhatsApp (si aplica)
    `
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo Excel con datos de usuarios y ID del sitio',
    type: FileUploadBodyDTO,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuarios importados exitosamente',
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
    description: 'Archivo inválido o datos incorrectos',
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
    description: 'No autorizado - Token requerido'
  })
  @ApiResponse({
    status: 404,
    description: 'Sitio no encontrado'
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
