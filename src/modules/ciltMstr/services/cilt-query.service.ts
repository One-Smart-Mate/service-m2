import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { CiltMstrEntity } from '../entities/ciltMstr.entity';
import { CiltSequencesEntity } from 'src/modules/ciltSequences/entities/ciltSequences.entity';
import { CustomLoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class CiltQueryService {
  constructor(
    @InjectRepository(CiltMstrEntity)
    private readonly ciltRepository: Repository<CiltMstrEntity>,
    @InjectRepository(CiltSequencesEntity)
    private readonly ciltSequencesRepository: Repository<CiltSequencesEntity>,
    private readonly logger: CustomLoggerService,
  ) {}

  /**
   * Get all active CILTs for a specific site
   */
  async getActiveCiltsForSite(siteId: number): Promise<CiltMstrEntity[]> {
    this.logger.logProcess('GETTING ACTIVE CILTS FOR SITE', { siteId });
    
    const ciltMasters = await this.ciltRepository.find({
      where: { 
        siteId,
        status: 'A',
        deletedAt: IsNull()
      },
      order: { order: 'ASC' }
    });

    this.logger.logProcess('FOUND ACTIVE CILTS FOR SITE', { 
      siteId, 
      count: ciltMasters.length 
    });
    
    return ciltMasters;
  }

  /**
   * Get all active sequences for a set of CILTs
   */
  async getActiveSequencesForCilts(ciltMasterIds: number[]): Promise<CiltSequencesEntity[]> {
    this.logger.logProcess('GETTING ACTIVE SEQUENCES FOR CILTS', { 
      ciltMasterIds,
      count: ciltMasterIds.length 
    });
    
    const ciltSequences = await this.ciltSequencesRepository.find({
      where: { 
        ciltMstrId: In(ciltMasterIds),
        deletedAt: IsNull()
      },
      order: { order: 'ASC' }
    });

    this.logger.logProcess('FOUND ACTIVE SEQUENCES FOR CILTS', { 
      sequencesCount: ciltSequences.length 
    });
    
    return ciltSequences;
  }

  /**
   * Get a specific CILT by ID
   */
  async getCiltById(id: number): Promise<CiltMstrEntity> {
    this.logger.logProcess('GETTING CILT BY ID', { id });
    
    const cilt = await this.ciltRepository.findOneBy({ id });
    
    if (cilt) {
      this.logger.logProcess('FOUND CILT BY ID', { id, ciltName: cilt.ciltName });
    } else {
      this.logger.logProcess('CILT NOT FOUND BY ID', { id });
    }
    
    return cilt;
  }

  /**
   * Get all CILTs ordered by order
   */
  async getAllCilts(): Promise<CiltMstrEntity[]> {
    this.logger.logProcess('GETTING ALL CILTS');
    
    const cilts = await this.ciltRepository.find({
      order: { order: 'ASC' }
    });

    this.logger.logProcess('FOUND ALL CILTS', { count: cilts.length });
    
    return cilts;
  }

  /**
   * Get CILTs by site ordered by order
   */
  async getCiltsBySiteId(siteId: number): Promise<CiltMstrEntity[]> {
    this.logger.logProcess('GETTING CILTS BY SITE ID', { siteId });
    
    const cilts = await this.ciltRepository.find({ 
      where: { siteId },
      order: { order: 'ASC' }
    });

    this.logger.logProcess('FOUND CILTS BY SITE ID', { 
      siteId, 
      count: cilts.length 
    });
    
    return cilts;
  }

  /**
   * Get specific sequences for a CILT
   */
  async getSequencesForCilt(ciltMstrId: number): Promise<CiltSequencesEntity[]> {
    this.logger.logProcess('GETTING SEQUENCES FOR CILT', { ciltMstrId });
    
    const sequences = await this.ciltSequencesRepository.find({
      where: { ciltMstrId },
      order: { order: 'ASC' }
    });

    this.logger.logProcess('FOUND SEQUENCES FOR CILT', { 
      ciltMstrId,
      count: sequences.length 
    });
    
    return sequences;
  }

  /**
   * Filter unique CILT masters from a list
   */
  getUniqueCiltMasters(ciltMasters: CiltMstrEntity[]): CiltMstrEntity[] {
    const uniqueMasters = Array.from(
      new Map(ciltMasters.map(cm => [cm.id, cm])).values()
    );
    
    this.logger.logProcess('FILTERED UNIQUE CILT MASTERS', { 
      original: ciltMasters.length,
      unique: uniqueMasters.length 
    });
    
    return uniqueMasters;
  }

  /**
   * Get the next order number for a site
   */
  async getNextOrderForSite(siteId: number): Promise<number> {
    this.logger.logProcess('GETTING NEXT ORDER FOR SITE', { siteId });
    
    const existingCilts = await this.ciltRepository.find({
      where: { siteId },
      order: { order: 'DESC' },
      take: 1
    });
    
    const nextOrder = existingCilts.length > 0 ? existingCilts[0].order + 1 : 1;
    
    this.logger.logProcess('CALCULATED NEXT ORDER FOR SITE', { 
      siteId, 
      nextOrder 
    });
    
    return nextOrder;
  }
} 