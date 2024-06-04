import { Injectable } from '@nestjs/common';
import { CreatePreclassifierDto } from './models/dto/create-preclassifier.dto';
import { UpdatePreclassifierDto } from './models/dto/update-preclassifier.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PreclassifierEntity } from './entities/preclassifier.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';

@Injectable()
export class PreclassifierService {
  constructor(@InjectRepository(PreclassifierEntity) private readonly preclassifiersRepository: Repository<PreclassifierEntity>){}

  findCardTypesPreclassifiers = async (cardTypeId: number) => {
    try{
      return await this.preclassifiersRepository.findBy({cardTypeId: cardTypeId})
    }catch(exception){
      HandleException.exception(exception)
    }
  }
}
