import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CardEntity } from './entities/card.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';

@Injectable()
export class CardService {
  constructor(@InjectRepository(CardEntity) private readonly cardRepository: Repository<CardEntity>){}

  findSiteCards = async (siteId: number) => {
    try{
      return await this.cardRepository.findBy({siteId: siteId})
    }catch(exception){
      HandleException.exception(exception)
    }
  }
  findResponsibleCards = async (responsibleId: number) => {
    try{
      return await this.cardRepository.findBy({responsableId: responsibleId})
    }catch(exception){
      HandleException.exception(exception)
    }
  }
}
