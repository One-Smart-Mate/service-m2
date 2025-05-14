import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CiltMstrEntity } from './entities/ciltMstr.entity';
import { CreateCiltMstrDTO } from './models/dto/create.ciltMstr.dto';
import { UpdateCiltMstrDTO } from './models/dto/update.ciltMstr.dto';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { UsersPositionsEntity } from 'src/modules/users/entities/users.positions.entity';
import { CiltSequencesEntity } from 'src/modules/ciltSequences/entities/ciltSequences.entity';
import { CiltSequencesExecutionsEntity } from 'src/modules/CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';

@Injectable()
export class CiltMstrService {
  constructor(
    @InjectRepository(CiltMstrEntity)
    private readonly ciltRepository: Repository<CiltMstrEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UsersPositionsEntity)
    private readonly usersPositionsRepository: Repository<UsersPositionsEntity>,
    @InjectRepository(CiltSequencesEntity)
    private readonly ciltSequencesRepository: Repository<CiltSequencesEntity>,
    @InjectRepository(CiltSequencesExecutionsEntity)
    private readonly ciltSequencesExecutionsRepository: Repository<CiltSequencesExecutionsEntity>,
  ) {}

  findAll = async () => {
    try {
      return await this.ciltRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findBySiteId = async (siteId: number) => {
    try {
      return await this.ciltRepository.find({ where: { siteId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findByPositionId = async (positionId: number) => {
    try {
      return await this.ciltRepository.find({ where: { positionId } });
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findById = async (id: number) => {
    try {
      const cilt = await this.ciltRepository.findOneBy({ id });
      if (!cilt) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
      }
      return cilt;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  create = async (createCiltDto: CreateCiltMstrDTO) => {
    try {
      const cilt = this.ciltRepository.create(createCiltDto);
      return await this.ciltRepository.save(cilt);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  update = async (updateCiltDto: UpdateCiltMstrDTO) => {
    try {
      const cilt = await this.ciltRepository.findOneBy({
        id: updateCiltDto.id,
      });
      if (!cilt) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CILT_MSTR);
      }

      Object.assign(cilt, updateCiltDto);
      return await this.ciltRepository.save(cilt);
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findCiltsByUserId = async (userId: number) => {
    try {
      // Verificar si el usuario existe
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.USER);
      }

      // Obtener todas las posiciones asignadas al usuario
      const userPositions = await this.usersPositionsRepository.find({
        where: { user: { id: userId } },
        relations: ['position'],
      });

      if (!userPositions.length) {
        return { message: 'El usuario no tiene posiciones asignadas', data: [] };
      }

      // Extraer los IDs de posición
      const positionIds = userPositions.map(up => up.position.id);

      // Obtener todos los CILT masters por posiciones
      const ciltMasters = await this.ciltRepository.find({
        where: { positionId: In(positionIds) },
      });

      // Obtener todas las secuencias CILT por posiciones
      const ciltSequences = await this.ciltSequencesRepository.find({
        where: { positionId: In(positionIds) },
      });

      // Obtener todas las ejecuciones CILT por posiciones
      const ciltExecutions = await this.ciltSequencesExecutionsRepository.find({
        where: { positionId: In(positionIds) },
      });

      // Estructura de respuesta con la información anidada jerárquicamente
      const positions = userPositions.map(up => {
        const positionId = up.position.id;
        
        // Filtrar masters para esta posición
        const positionCiltMasters = ciltMasters.filter(cm => cm.positionId === positionId);
        
        // Mapear cada master para incluir sus secuencias
        const mastersWithSequences = positionCiltMasters.map(master => {
          // Encontrar secuencias para este master
          const masterSequences = ciltSequences.filter(
            seq => seq.positionId === positionId && seq.ciltMstrId === master.id
          );
          
          // Mapear cada secuencia para incluir sus ejecuciones
          const sequencesWithExecutions = masterSequences.map(sequence => {
            // Encontrar ejecuciones para esta secuencia
            const sequenceExecutions = ciltExecutions.filter(
              exec => exec.ciltDetailsId === sequence.id
            );
            
            // Devolver la secuencia con sus ejecuciones
            return {
              ...sequence,
              executions: sequenceExecutions
            };
          });
          
          // Devolver el master con sus secuencias
          return {
            ...master,
            sequences: sequencesWithExecutions
          };
        });
        
        return {
          id: positionId,
          name: up.position.name,
          siteName: up.position.siteName,
          areaName: up.position.areaName,
          ciltMasters: mastersWithSequences
        };
      });

      // Respuesta final
      return {
        userInfo: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        positions
      };
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
