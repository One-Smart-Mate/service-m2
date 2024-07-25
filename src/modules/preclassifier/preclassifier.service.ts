import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PreclassifierEntity } from './entities/preclassifier.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { CreatePreclassifierDTO } from './models/dto/create-preclassifier.dto';
import { CardTypesService } from '../cardTypes/cardTypes.service';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { UpdatePreclassifierDTO } from './models/dto/update-preclassifier.dto';
import { stringConstants } from 'src/utils/string.constant';

@Injectable()
export class PreclassifierService {
  constructor(
    @InjectRepository(PreclassifierEntity)
    private readonly preclassifiersRepository: Repository<PreclassifierEntity>,
    private readonly cardTypeService: CardTypesService,
  ) {}

  findCardTypesActivePreclassifiers = async (cardTypeId: number) => {
    try {
      return await this.preclassifiersRepository.findBy({
        cardTypeId: cardTypeId,
        status: stringConstants.A,
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findCardTypesPreclassifiers = async (cardTypeId: number) => {
    try {
      return await this.preclassifiersRepository.findBy({
        cardTypeId: cardTypeId,
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findSiteActivePreclassifiers = async (siteId: number) => {
    try {
      return await this.preclassifiersRepository.findBy({
        siteId: siteId,
        status: stringConstants.A,
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createPreclassifierDTO: CreatePreclassifierDTO) => {
    try {
      const existCardType = await this.cardTypeService.findById(
        createPreclassifierDTO.cardTypeId,
      );

      createPreclassifierDTO.siteId = existCardType.siteId;
      createPreclassifierDTO.siteCode = existCardType.siteCode;
      createPreclassifierDTO.createdAt = new Date();

      return await this.preclassifiersRepository.save(createPreclassifierDTO);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
  update = async (updatePreclassifierDTO: UpdatePreclassifierDTO) => {
    try {
      const preclassifier = await this.preclassifiersRepository.findOneBy({
        id: updatePreclassifierDTO.id,
      });
      if (!preclassifier) {
        throw new NotFoundCustomException(
          NotFoundCustomExceptionType.PRECLASSIFIER,
        );
      }

      preclassifier.preclassifierCode =
        updatePreclassifierDTO.preclassifierCode;
      preclassifier.preclassifierDescription =
        updatePreclassifierDTO.preclassifierDescription;
      preclassifier.status = updatePreclassifierDTO.status;
      if (updatePreclassifierDTO.status !== stringConstants.A) {
        preclassifier.deletedAt = new Date();
      }
      preclassifier.updatedAt = new Date();

      return await this.preclassifiersRepository.save(preclassifier);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (preclassifierId: number) => {
    try {
      return await this.preclassifiersRepository.findOneBy({
        id: preclassifierId,
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
