import { Injectable } from '@nestjs/common';
import { CreateCompanyDTO } from './dto/create-company.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyEntity } from './entities/company.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
  ) {}

  create = async (createCompanyDto: CreateCompanyDTO) => {
    try {
      const emailIsNotUnique = await this.companyRepository.findOne({
        where: { email: createCompanyDto.email },
      });
      const rfcIsNotUnique = await this.companyRepository.findOne({
        where: { rfc: createCompanyDto.rfc },
      });

      if (emailIsNotUnique || rfcIsNotUnique) {
        throw new ValidationException(ValidationExceptionType.DUPLICATE_RECORD);
      }

      createCompanyDto.createdAt = new Date();

      return await this.companyRepository.save(createCompanyDto);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
