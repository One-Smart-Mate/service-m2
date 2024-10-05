import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { SiteIdDTO } from './dto/site.id.dto';

@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}
  @Post('import-users')
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
