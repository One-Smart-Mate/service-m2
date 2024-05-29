import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PriorityEntity } from './entities/priority.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { CreatePriorityDTO } from './dto/create.priority.dto';
import { CompanyService } from '../company/company.service';
import { stringConstants } from 'src/utils/string.constant';

@Injectable()
export class PriorityService {
  constructor(
    @InjectRepository(PriorityEntity)
    private readonly priorityRepository: Repository<PriorityEntity>,
    private readonly companyService: CompanyService,
  ) {}

  findCompanyPriorities = async (id: number) => {
    try {
      const existCompanyPriorities = await this.priorityRepository.existsBy({
        siteId: id,
      });

      if (!existCompanyPriorities) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.COMPANY);
      }

      return await this.priorityRepository.findBy({ siteId: id });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createPriorityDTO: CreatePriorityDTO) => {
    try {
      const foundCompany = await this.companyService.findCompanyById(
        createPriorityDTO.siteId,
      );

      if (!foundCompany) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.COMPANY);
      }

      createPriorityDTO.siteCode = stringConstants.hardCodedSiteCode;
      createPriorityDTO.createdAt = new Date();

      return await this.priorityRepository.save(createPriorityDTO);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
