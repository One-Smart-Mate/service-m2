import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CiltSecuencesScheduleService } from './ciltSecuencesSchedule.service';
import { CiltSecuencesScheduleEntity } from './entities/ciltSecuencesSchedule.entity';
import { CreateCiltSecuencesScheduleDto } from './models/dto/create.ciltSecuencesSchedule.dto';
import { UpdateCiltSecuencesScheduleDto } from './models/dto/update.ciltSecuencesSchedule.dto';
import { NotFoundCustomException } from 'src/common/exceptions/types/notFound.exception';
import { ValidationException, ValidationExceptionType } from 'src/common/exceptions/types/validation.exception';

describe('CiltSecuencesScheduleService', () => {
  let service: CiltSecuencesScheduleService;
  let repository: Repository<CiltSecuencesScheduleEntity>;

  const mockRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getSql: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CiltSecuencesScheduleService,
        {
          provide: getRepositoryToken(CiltSecuencesScheduleEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CiltSecuencesScheduleService>(CiltSecuencesScheduleService);
    repository = module.get<Repository<CiltSecuencesScheduleEntity>>(
      getRepositoryToken(CiltSecuencesScheduleEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of schedules', async () => {
      const mockSchedules = [
        { id: 1, siteId: 1, ciltId: 1, secuenceId: 1 },
        { id: 2, siteId: 1, ciltId: 2, secuenceId: 2 },
      ];
      mockRepository.find.mockResolvedValue(mockSchedules);

      const result = await service.findAll();
      expect(result).toEqual(mockSchedules);
      expect(repository.find).toHaveBeenCalled();
    });

    it('should return empty array when no schedules exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();
      expect(result).toEqual([]);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findBySiteId', () => {
    it('should return schedules for a specific site', async () => {
      const mockSchedules = [
        { id: 1, siteId: 1, ciltId: 1, secuenceId: 1 },
      ];
      mockRepository.find.mockResolvedValue(mockSchedules);

      const result = await service.findBySiteId(1);
      expect(result).toEqual(mockSchedules);
      expect(repository.find).toHaveBeenCalledWith({
        where: { siteId: 1 },
      });
    });

    it('should return empty array when no schedules exist for site', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findBySiteId(999);
      expect(result).toEqual([]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { siteId: 999 },
      });
    });
  });

  describe('findById', () => {
    it('should return a schedule by id', async () => {
      const mockSchedule = { id: 1, siteId: 1, ciltId: 1, secuenceId: 1 };
      mockRepository.findOneBy.mockResolvedValue(mockSchedule);

      const result = await service.findById(1);
      expect(result).toEqual(mockSchedule);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should throw NotFoundCustomException when schedule not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundCustomException);
    });
  });

  describe('create', () => {
    it('should create a new schedule', async () => {
      const createDto: Partial<CreateCiltSecuencesScheduleDto> = {
        siteId: 1,
        ciltId: 1,
        secuenceId: 1,
        scheduleType: 'dai',
        schedule: '09:00:00',
        status: 'A',
      };

      const mockSchedule = {
        ...createDto,
        id: 1,
        createdAt: new Date(),
      } as CiltSecuencesScheduleEntity;

      mockRepository.create.mockReturnValue(mockSchedule);
      mockRepository.save.mockResolvedValue(mockSchedule);

      const result = await service.create(createDto as CreateCiltSecuencesScheduleDto);
      expect(result).toEqual(mockSchedule);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const createDto = {
        siteId: 1,
        ciltId: 1,
        secuenceId: 1,
        scheduleType: 'invalid',
        createdAt: new Date().toISOString()
      };

      mockRepository.save.mockRejectedValue(new ValidationException(ValidationExceptionType.INVALID_SCHEDULE_TYPE));

      await expect(service.create(createDto)).rejects.toThrow(ValidationException);
    });
  });

  describe('update', () => {
    it('should update an existing schedule', async () => {
      const updateDto: Partial<UpdateCiltSecuencesScheduleDto> = {
        id: 1,
        schedule: '10:00:00',
      };

      const existingSchedule = {
        id: 1,
        siteId: 1,
        ciltId: 1,
        secuenceId: 1,
        scheduleType: 'dai',
        schedule: '09:00:00',
        status: 'A',
      } as CiltSecuencesScheduleEntity;

      const updatedSchedule = {
        ...existingSchedule,
        ...updateDto,
        updatedAt: new Date(),
      } as CiltSecuencesScheduleEntity;

      mockRepository.findOneBy.mockResolvedValue(existingSchedule);
      mockRepository.save.mockResolvedValue(updatedSchedule);

      const result = await service.update(updateDto as UpdateCiltSecuencesScheduleDto);
      expect(result).toEqual(updatedSchedule);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundCustomException when schedule not found', async () => {
      const updateDto: Partial<UpdateCiltSecuencesScheduleDto> = {
        id: 999,
        schedule: '10:00:00',
      };

      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update(updateDto as UpdateCiltSecuencesScheduleDto)).rejects.toThrow(NotFoundCustomException);
    });
  });

  describe('findSchedulesForDate', () => {
    it('should return schedules for a specific date', async () => {
      const mockSchedules = [
        {
          id: 1,
          siteId: 1,
          ciltId: 1,
          secuenceId: 1,
          scheduleType: 'dai',
          status: 'A',
        } as CiltSecuencesScheduleEntity,
      ];

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockSchedules),
        getSql: jest.fn().mockReturnValue('SELECT * FROM cilt_secuences_schedule'),
      };

      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findSchedulesForDate('2024-03-20');
      expect(result).toEqual(mockSchedules);
      expect(repository.createQueryBuilder).toHaveBeenCalled();
    });

    it('should handle invalid date format', async () => {
      mockRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(new Error('Invalid date provided')),
        getSql: jest.fn().mockReturnValue('SELECT * FROM cilt_secuences_schedule'),
      });

      await expect(service.findSchedulesForDate('invalid-date')).rejects.toThrow('Invalid date provided');
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