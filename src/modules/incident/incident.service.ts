
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidentEntity } from './entities/incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';

@Injectable()
export class IncidentService {
  constructor(
    @InjectRepository(IncidentEntity)
    private readonly incidentRepository: Repository<IncidentEntity>,
  ) {}

  findAll = async () => {
    try {
      return await this.incidentRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const incident = await this.incidentRepository.findOneBy({ id });
      if (!incident) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.INCIDENT_NOT_FOUND);
      }
      return incident;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createIncidentDto: CreateIncidentDto, userId: number, userName: string) => {
    try {
      // Crear el objeto de incidente con la información del usuario autenticado
      const incidentData = {
        ...createIncidentDto,
        userId,
        userName
      };
      
      const incident = this.incidentRepository.create(incidentData);
      return await this.incidentRepository.save(incident);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  resolve = async (id: number) => {
    try {
      const incident = await this.findById(id);
      Object.assign(incident, { status: 'R', resolvedAt: new Date() });
      return await this.incidentRepository.save(incident);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  softDelete = async (id: number) => {
    try {
      const incident = await this.findById(id);
      if (!incident) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.INCIDENT_NOT_FOUND);
      }
      return await this.incidentRepository.softDelete(incident.id);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
