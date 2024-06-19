import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CardEntity } from './entities/card.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { EvidenceEntity } from '../evidence/entities/evidence.entity';

@Injectable()
export class CardService {
  constructor(@InjectRepository(CardEntity) private readonly cardRepository: Repository<CardEntity>,
  @InjectRepository(EvidenceEntity) private readonly evidenceRepository: Repository<EvidenceEntity>){}

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

  findCardByIDAndGetEvidences = async (cardId: number) =>{
    try{
      const card = await this.cardRepository.findOneBy({id: cardId})
      if(card) card['levelName'] = card.areaName
      const evidences = await this.evidenceRepository.findBy({cardId: cardId})

      return{
        card,
        evidences
      }
    }catch(exception){
      HandleException.exception(exception)
    }
  } 
}
