import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CiltSecuencesScheduleService } from './ciltSecuencesSchedule.service';
import { CiltSecuencesScheduleEntity } from './entities/ciltSecuencesSchedule.entity';
import { CiltMstrEntity } from '../ciltMstr/entities/ciltMstr.entity';
import { CiltSequencesEntity } from '../ciltSequences/entities/ciltSequences.entity';
import { SiteEntity } from '../site/entities/site.entity';
import { CreateCiltSecuencesScheduleDto } from './models/dto/create.ciltSecuencesSchedule.dto';
import { UpdateCiltSecuencesScheduleDto } from './models/dto/update.ciltSecuencesSchedule.dto';
import { NotFoundCustomException } from 'src/common/exceptions/types/notFound.exception';
import { ValidationException, ValidationExceptionType } from 'src/common/exceptions/types/validation.exception';
import { ScheduleType } from 'src/utils/string.constant';

describe('CiltSecuencesScheduleService', () => {
  let service: CiltSecuencesScheduleService;
  let mockRepository: jest.Mocked<Repository<CiltSecuencesScheduleEntity>>;
  let mockCiltMstrRepository: jest.Mocked<Repository<CiltMstrEntity>>;
  let mockCiltSequencesRepository: jest.Mocked<Repository<CiltSequencesEntity>>;
  let mockSiteRepository: jest.Mocked<Repository<SiteEntity>>;

  const createMockSchedule = (overrides = {}): CiltSecuencesScheduleEntity => ({
    id: 1,
    siteId: 1,
    ciltId: 1,
    secuenceId: 1,
    scheduleType: ScheduleType.DAILY,
    status: 'A',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    cilt: { id: 1 } as CiltMstrEntity,
    sequence: { id: 1 } as CiltSequencesEntity,
    site: { id: 1 } as SiteEntity,
    frecuency: null,
    schedule: null,
    endDate: null,
    mon: null,
    tue: null,
    wed: null,
    thu: null,
    fri: null,
    sat: null,
    sun: null,
    dayOfMonth: null,
    weekOfMonth: null,
    dateOfYear: null,
    monthOfYear: null,
    allowExecuteBefore: null,
    allowExecuteBeforeMinutes: null,
    toleranceBeforeMinutes: null,
    toleranceAfterMinutes: null,
    allowExecuteAfterDue: null,
    ...overrides,
  } as CiltSecuencesScheduleEntity);

  beforeEach(async () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    } as unknown as SelectQueryBuilder<CiltSecuencesScheduleEntity>;

    mockRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    } as unknown as jest.Mocked<Repository<CiltSecuencesScheduleEntity>>;

    mockCiltMstrRepository = {
      findOneBy: jest.fn(),
    } as unknown as jest.Mocked<Repository<CiltMstrEntity>>;

    mockCiltSequencesRepository = {
      findOneBy: jest.fn(),
    } as unknown as jest.Mocked<Repository<CiltSequencesEntity>>;

    mockSiteRepository = {
      findOneBy: jest.fn(),
    } as unknown as jest.Mocked<Repository<SiteEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CiltSecuencesScheduleService,
        {
          provide: getRepositoryToken(CiltSecuencesScheduleEntity),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(CiltMstrEntity),
          useValue: mockCiltMstrRepository,
        },
        {
          provide: getRepositoryToken(CiltSequencesEntity),
          useValue: mockCiltSequencesRepository,
        },
        {
          provide: getRepositoryToken(SiteEntity),
          useValue: mockSiteRepository,
        },
      ],
    }).compile();

    service = module.get<CiltSecuencesScheduleService>(CiltSecuencesScheduleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debería retornar un array de schedules', async () => {
      const mockSchedules = [createMockSchedule()];
      mockRepository.find.mockResolvedValue(mockSchedules);
      const result = await service.findAll();
      expect(result).toEqual(mockSchedules);
    });
    it('debería retornar un array vacío si no hay schedules', async () => {
      mockRepository.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findBySiteId', () => {
    it('debería retornar schedules para un site', async () => {
      const mockSchedules = [createMockSchedule()];
      mockRepository.find.mockResolvedValue(mockSchedules);
      const result = await service.findBySiteId(1);
      expect(result).toEqual(mockSchedules);
    });
    it('debería retornar un array vacío si no hay schedules para el site', async () => {
      mockRepository.find.mockResolvedValue([]);
      const result = await service.findBySiteId(1);
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('debería retornar un schedule por id', async () => {
      const mockSchedule = createMockSchedule();
      mockRepository.findOneBy.mockResolvedValue(mockSchedule);
      const result = await service.findById(1);
      expect(result).toEqual(mockSchedule);
    });
    it('debería lanzar NotFoundCustomException si no existe', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findById(1)).rejects.toThrow(NotFoundCustomException);
    });
  });

  describe('create', () => {
    it('should create a new schedule', async () => {
      const createDto: CreateCiltSecuencesScheduleDto = {
        siteId: 1,
        ciltId: 1,
        secuenceId: 1,
        scheduleType: ScheduleType.DAILY,
        createdAt: new Date().toISOString(),
      };

      const mockSite = { id: 1 } as SiteEntity;
      const mockCilt = { id: 1 } as CiltMstrEntity;
      const mockSequence = { id: 1 } as CiltSequencesEntity;
      const mockSchedule = createMockSchedule();

      mockSiteRepository.findOneBy.mockResolvedValue(mockSite);
      mockCiltMstrRepository.findOneBy.mockResolvedValue(mockCilt);
      mockCiltSequencesRepository.findOneBy.mockResolvedValue(mockSequence);
      mockRepository.create.mockReturnValue(mockSchedule);
      mockRepository.save.mockResolvedValue(mockSchedule);

      const result = await service.create(createDto);
      expect(result).toEqual(mockSchedule);
    });

    it('should handle validation errors', async () => {
      const createDto: CreateCiltSecuencesScheduleDto = {
        siteId: 1,
        ciltId: 1,
        secuenceId: 1,
        scheduleType: 'invalid' as ScheduleType,
        createdAt: new Date().toISOString(),
      };

      const mockSite = { id: 1 } as SiteEntity;
      const mockCilt = { id: 1 } as CiltMstrEntity;
      const mockSequence = { id: 1 } as CiltSequencesEntity;
      const mockSchedule = createMockSchedule({ scheduleType: 'invalid' as ScheduleType });

      mockSiteRepository.findOneBy.mockResolvedValue(mockSite);
      mockCiltMstrRepository.findOneBy.mockResolvedValue(mockCilt);
      mockCiltSequencesRepository.findOneBy.mockResolvedValue(mockSequence);
      mockRepository.create.mockReturnValue(mockSchedule);
      mockRepository.save.mockRejectedValue(new ValidationException(ValidationExceptionType.INVALID_SCHEDULE_TYPE));

      await expect(service.create(createDto)).rejects.toThrow(ValidationException);
    });
  });

  describe('update', () => {
    it('should update an existing schedule', async () => {
      const updateDto: UpdateCiltSecuencesScheduleDto = {
        id: 1,
        siteId: 1,
        ciltId: 1,
        secuenceId: 1,
        scheduleType: ScheduleType.DAILY,
        updatedAt: new Date().toISOString(),
      };

      const mockSite = { id: 1 } as SiteEntity;
      const mockCilt = { id: 1 } as CiltMstrEntity;
      const mockSequence = { id: 1 } as CiltSequencesEntity;
      const mockSchedule = createMockSchedule();

      mockRepository.findOneBy.mockResolvedValue(mockSchedule);
      mockSiteRepository.findOneBy.mockResolvedValue(mockSite);
      mockCiltMstrRepository.findOneBy.mockResolvedValue(mockCilt);
      mockCiltSequencesRepository.findOneBy.mockResolvedValue(mockSequence);
      mockRepository.save.mockResolvedValue(mockSchedule);

      const result = await service.update(updateDto);
      expect(result).toEqual(mockSchedule);
    });

    it('should throw NotFoundCustomException when schedule not found', async () => {
      const updateDto: UpdateCiltSecuencesScheduleDto = {
        id: 1,
        siteId: 1,
        ciltId: 1,
        secuenceId: 1,
        scheduleType: ScheduleType.DAILY,
        updatedAt: new Date().toISOString(),
      };

      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update(updateDto)).rejects.toThrow(NotFoundCustomException);
    });
  });

  describe('findSchedulesForDate', () => {
    it('should return schedules for a specific date', async () => {
      const date = '2024-01-01';
      const mockSchedules = [createMockSchedule()];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockSchedules),
      } as unknown as SelectQueryBuilder<CiltSecuencesScheduleEntity>;

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findSchedulesForDate(date);
      expect(result).toEqual(mockSchedules);
    });

    it('should handle invalid date format', async () => {
      const invalidDate = 'invalid-date';

      await expect(service.findSchedulesForDate(invalidDate)).rejects.toThrow(ValidationException);
    });
  });

  describe('findSchedulesForDateSimplified', () => {
    it('should return simplified schedules for a specific date', async () => {
      const mockSchedules = [
        {
          id: 1,
          siteId: 1,
          ciltId: 1,
          secuenceId: 1,
        } as CiltSecuencesScheduleEntity,
      ];

      jest.spyOn(service, 'findSchedulesForDate').mockResolvedValue(mockSchedules);

      const result = await service.findSchedulesForDateSimplified('2024-03-20');
      expect(result).toEqual([
        {
          id: 1,
          siteId: 1,
          ciltId: 1,
          secuenceId: 1,
        },
      ]);
    });
  });

  describe('isScheduleActiveForDate', () => {
    const createMockSchedule = (overrides = {}) => ({
      id: 1,
      siteId: 1,
      ciltId: 1,
      secuenceId: 1,
      scheduleType: 'dai',
      status: 'A',
      sun: 0,
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      schedule: '09:00:00',
      createdAt: new Date(),
      ...overrides,
    } as CiltSecuencesScheduleEntity);

    it('should return true for daily schedule', () => {
      const schedule = createMockSchedule();
      const result = service.isScheduleActiveForDate(schedule, '2024-03-20');
      expect(result).toBe(true);
    });

    it('should return false for inactive schedule', () => {
      const schedule = createMockSchedule({ status: 'I' });
      const result = service.isScheduleActiveForDate(schedule, '2024-03-20');
      expect(result).toBe(false);
    });

    it('should return false for expired schedule', () => {
      const schedule = createMockSchedule({ endDate: '2024-03-19' });
      const result = service.isScheduleActiveForDate(schedule, '2024-03-20');
      expect(result).toBe(false);
    });

    it('should return true for weekly schedule on correct day', () => {
      const schedule = createMockSchedule({
        scheduleType: 'wee',
        mon: 1,
      });
      const result = service.isScheduleActiveForDate(schedule, '2024-03-18'); // Monday
      expect(result).toBe(true);
    });

    it('should return false for weekly schedule on wrong day', () => {
      const schedule = createMockSchedule({
        scheduleType: 'wee',
        mon: 1,
      });
      const result = service.isScheduleActiveForDate(schedule, '2024-03-19'); // Tuesday
      expect(result).toBe(false);
    });

    it('should return true for monthly schedule on correct day', () => {
      const schedule = createMockSchedule({
        scheduleType: 'mon',
        dayOfMonth: 20,
      });
      const result = service.isScheduleActiveForDate(schedule, '2024-03-20');
      expect(result).toBe(true);
    });

    it('should return false for monthly schedule on wrong day', () => {
      const schedule = createMockSchedule({
        scheduleType: 'mon',
        dayOfMonth: 20,
      });
      const result = service.isScheduleActiveForDate(schedule, '2024-03-21');
      expect(result).toBe(false);
    });

    it('should return true for yearly schedule on correct date', () => {
      const schedule = createMockSchedule({
        scheduleType: 'yea',
        monthOfYear: 3,
        dayOfMonth: 20,
      });
      const result = service.isScheduleActiveForDate(schedule, '2024-03-20');
      expect(result).toBe(true);
    });

    it('should return false for yearly schedule on wrong date', () => {
      const schedule = createMockSchedule({
        scheduleType: 'yea',
        monthOfYear: 3,
        dayOfMonth: 20,
      });
      const result = service.isScheduleActiveForDate(schedule, '2024-03-21');
      expect(result).toBe(false);
    });

    it('should return false for manual schedule', () => {
      const schedule = createMockSchedule({
        scheduleType: 'man',
      });
      const result = service.isScheduleActiveForDate(schedule, '2024-03-20');
      expect(result).toBe(false);
    });
  });
}); 