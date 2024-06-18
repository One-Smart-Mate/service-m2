import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CurrencyEntity } from './entities/currency.entity';
import { Repository } from 'typeorm';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';

@Injectable()
export class CurrencyService {
  constructor(@InjectRepository(CurrencyEntity) private readonly currencyRepository: Repository<CurrencyEntity>){}

  findAll = async () => {
    try{
      return this.currencyRepository.find()
    }catch(excpetion){
      HandleException.exception(excpetion)
    }
  }
}
