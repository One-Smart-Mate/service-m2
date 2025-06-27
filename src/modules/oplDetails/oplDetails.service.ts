import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OplDetailsEntity } from './entities/oplDetails.entity';
import { CreateOplDetailsDTO } from './models/dto/createOplDetails.dto';
import { UpdateOplDetailsDTO } from './models/dto/updateOplDetails.dto';
import { UpdateOplDetailOrderDTO } from './models/dto/update-order.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class OplDetailsService {
  constructor(
    @InjectRepository(OplDetailsEntity)
    private readonly oplDetailsRepository: Repository<OplDetailsEntity>,
  ) {}

  findAll = async () => {
    try {
      return await this.oplDetailsRepository.find({
        order: { order: 'ASC' }
      });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const detail = await this.oplDetailsRepository.findOneBy({ id });
      if (!detail) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_DETAILS);
      }
      return detail;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByOplId = async (oplId: number) => {
    try {
      const details = await this.oplDetailsRepository.find({ 
        where: { oplId },
        order: { order: 'ASC' }
      });
      if (!details || details.length === 0) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_DETAILS);
      }
      return details;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createOplDetailsDto: CreateOplDetailsDTO) => {
    try {
      // Buscar detalles existentes del mismo OPL
      const existingDetails = await this.oplDetailsRepository.find({
        where: { oplId: createOplDetailsDto.oplId },
        order: { order: 'DESC' },
        take: 1
      });

      // Asignar el siguiente número de orden
      const nextOrder = existingDetails.length > 0 ? existingDetails[0].order + 1 : 1;
      createOplDetailsDto.order = nextOrder;

      const detail = this.oplDetailsRepository.create(createOplDetailsDto);
      return await this.oplDetailsRepository.save(detail);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateOplDetailsDto: UpdateOplDetailsDTO) => {
    try {
      const detail = await this.oplDetailsRepository.findOneBy({
        id: updateOplDetailsDto.id,
      });
      if (!detail) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_DETAILS);
      }

      Object.assign(detail, updateOplDetailsDto);
      return await this.oplDetailsRepository.save(detail);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  updateOrder = async (updateOrderDto: UpdateOplDetailOrderDTO) => {
    try {
      // Find the detail to update
      const detailToUpdate = await this.oplDetailsRepository.findOneBy({
        id: updateOrderDto.detailId,
      });
      if (!detailToUpdate) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_DETAILS);
      }

      // Find the detail that currently has the new order
      const detailWithNewOrder = await this.oplDetailsRepository.findOne({
        where: {
          oplId: detailToUpdate.oplId,
          order: updateOrderDto.newOrder,
        },
      });

      if (detailWithNewOrder) {
        // Swap orders
        const oldOrder = detailToUpdate.order;
        detailToUpdate.order = updateOrderDto.newOrder;
        detailWithNewOrder.order = oldOrder;

        // Save both details
        await this.oplDetailsRepository.save(detailWithNewOrder);
        return await this.oplDetailsRepository.save(detailToUpdate);
      } else {
        // If no detail has the new order, just update the order
        detailToUpdate.order = updateOrderDto.newOrder;
        return await this.oplDetailsRepository.save(detailToUpdate);
      }
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  delete = async (id: number) => {
    try {
      const detail = await this.oplDetailsRepository.findOneBy({ id });
      if (!detail) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.OPL_DETAILS);
      }
      return await this.oplDetailsRepository.softDelete(id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
} 