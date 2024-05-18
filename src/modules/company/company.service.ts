import { Injectable } from '@nestjs/common';
import { CreateCompanyDTO } from './models/dto/create.company.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyEntity } from './entities/company.entity';
import { Not, Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { UpdateCompanyDTO } from './models/dto/update.company.dto';
import { UpdateStatusDTO } from './models/dto/update.status.dto';
import { stringConstants } from 'src/utils/string.constant';

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

  findAllCompanies = async () => {
    try {
      return await this.companyRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findCompanyById = async (id: number) => {
    try {
      const companyExists = await this.companyRepository.existsBy({ id: id });

      if (!companyExists) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.COMPANY);
      }

      return await this.companyRepository.findBy({ id: id });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateCompanyDTO: UpdateCompanyDTO) => {
    try {
      const company = await this.companyRepository.findOne({
        where: { id: updateCompanyDTO.id },
      });

      if (!company) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.COMPANY);
      }

      company.name = updateCompanyDTO.name;
      company.address = updateCompanyDTO.address;
      company.cellular = updateCompanyDTO.cellular;
      company.contact = updateCompanyDTO.contact;
      company.email = updateCompanyDTO.email;
      company.extension = updateCompanyDTO.extension;
      company.logo = updateCompanyDTO.logo;
      company.phone = updateCompanyDTO.phone;
      company.position = updateCompanyDTO.position;
      company.rfc = updateCompanyDTO.rfc;
      company.status = updateCompanyDTO.status;
      company.updatedAt = new Date();

      const emailIsNotUnique = await this.companyRepository.findOne({
        where: { id: Not(company.id), email: company.email },
      });
      const rfcIsNotUnique = await this.companyRepository.findOne({
        where: { id: Not(company.id), rfc: company.rfc },
      });

      if (emailIsNotUnique || rfcIsNotUnique) {
        throw new ValidationException(ValidationExceptionType.DUPLICATE_RECORD);
      }

      return await this.companyRepository.save(company);
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  };

  updateStatus = async (updateStatusDTO: UpdateStatusDTO) => {
    try {
      const company = await this.companyRepository.findOne({
        where: { id: updateStatusDTO.id },
      });

      if (!company) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.COMPANY);
      }

      company.status = updateStatusDTO.status;
      company.updatedAt = new Date();

      if (updateStatusDTO.status === stringConstants.inactiveStatus) {
        company.deletedAt = new Date();
      }

      return await this.companyRepository.save(company);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
