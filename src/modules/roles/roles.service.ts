import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from './entities/role.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly rolesRepository: Repository<RoleEntity>,
  ) {}

  findAll = async () => {
    try {
      return await this.rolesRepository.find();
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
