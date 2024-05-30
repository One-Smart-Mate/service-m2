import { Injectable } from '@nestjs/common';
import { CreateCardTypeDto } from './dto/create.cardTypes.dto';
import { UpdateCardTypeDto } from './dto/update.cardTypes.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CardTypesEntity } from './entities/cardTypes.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class CardTypesService {
  constructor(
    @InjectRepository(CardTypesEntity)
    private readonly cardTypesRepository: Repository<CardTypesEntity>,
  ) {}

  findCompanyCardTypes = async (companyId: number) => {
    try {
      const existCompanyCardTypes = await this.cardTypesRepository.existsBy({
        siteId: companyId,
      });

      if (!existCompanyCardTypes) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.COMPANY);
      }

      return await this.cardTypesRepository.findBy({ siteId: companyId });
    } catch (exception) {
      console.log(exception);
      HandleException.exception(exception);
    }
  };
}
