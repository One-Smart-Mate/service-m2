import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OplMstr } from './entities/oplMstr.entity';
import { CreateOplMstrDTO } from './models/dto/createOplMstr.dto';
import { UpdateOplMstrDTO } from './models/dto/updateOplMstr.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { OplLevelsEntity } from '../oplLevels/entities/oplLevels.entity';
import { LevelEntity } from '../level/entities/level.entity';
import { OplDetailsEntity } from '../oplDetails/entities/oplDetails.entity';
import { In } from 'typeorm';

@Injectable()
export class OplMstrService {
  constructor(
    @InjectRepository(OplMstr)
    private readonly oplRepository: Repository<OplMstr>,
    @InjectRepository(OplLevelsEntity)
    private readonly oplLevelsRepository: Repository<OplLevelsEntity>,
    @InjectRepository(OplDetailsEntity)
    private readonly oplDetailsRepository: Repository<OplDetailsEntity>,
  ) {}

  findAll = async () => {
    try {
      const opls = await this.oplRepository.find();
      const oplIds = opls.map(opl => opl.id);
      const details = await this.oplDetailsRepository.find({
        where: { oplId: In(oplIds) },
        order: { order: 'ASC' }
      });

      return opls.map(opl => ({
        ...opl,
        details: details.filter(detail => detail.oplId === opl.id)
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByCreatorId = async (creatorId: number) => {
    try {
      const opls = await this.oplRepository.find({ where: { creatorId } });
      const oplIds = opls.map(opl => opl.id);
      const details = await this.oplDetailsRepository.find({
        where: { oplId: In(oplIds) },
        order: { order: 'ASC' }
      });

      return opls.map(opl => ({
        ...opl,
        details: details.filter(detail => detail.oplId === opl.id)
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const opl = await this.oplRepository.findOneBy({ id });
      if (!opl) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }
      const details = await this.oplDetailsRepository.find({
        where: { oplId: id },
        order: { order: 'ASC' }
      });

      return {
        ...opl,
        details
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findOplMstrByLevelId = async (levelId: number) => {
    try {
      const opls = await this.oplRepository
        .createQueryBuilder('opl')
        .innerJoin('opl_mstr_levels', 'oml', 'opl.id = oml.opl_id')
        .where('oml.level_id = :levelId', { levelId })
        .andWhere('oml.deleted_at IS NULL')
        .andWhere('opl.deleted_at IS NULL')
        .getMany();
      
      const oplIds = opls.map(opl => opl.id);
      const details = await this.oplDetailsRepository.find({
        where: { oplId: In(oplIds) },
        order: { order: 'ASC' }
      });

      return opls.map(opl => ({
        ...opl,
        details: details.filter(detail => detail.oplId === opl.id)
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findOplMstrBySiteId = async (siteId: number) => {
    try {
      const opls = await this.oplRepository.find({
        where: {
          siteId,
          deletedAt: null
        },
        order: {
          id: 'ASC'
        }
      });

      const oplIds = opls.map(opl => opl.id);
      const details = await this.oplDetailsRepository.find({
        where: { oplId: In(oplIds) },
        order: { order: 'ASC' }
      });

      return opls.map(opl => ({
        ...opl,
        details: details.filter(detail => detail.oplId === opl.id)
      }));
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createOplDto: CreateOplMstrDTO) => {
    try {
      const opl = this.oplRepository.create(createOplDto);
      return await this.oplRepository.save(opl);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateOplDto: UpdateOplMstrDTO) => {
    try {
      const opl = await this.oplRepository.findOneBy({
        id: updateOplDto.id,
      });
      if (!opl) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_MSTR);
      }

      Object.assign(opl, updateOplDto);
      return await this.oplRepository.save(opl);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
} 