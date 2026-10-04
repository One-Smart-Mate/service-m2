import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CILT_EXECUTION_OWNER_KEY,
  CiltExecutionOwnerOptions,
} from 'src/common/decorators/cilt-execution-owner.decorator';
import { CiltSequencesExecutionsEntity } from 'src/modules/CiltSequencesExecutions/entities/ciltSequencesExecutions.entity';
import { CiltSequencesExecutionsEvidencesEntity } from 'src/modules/CiltSequencesExecutionsEvidences/entities/ciltSequencesExecutionsEvidences.entity';
import { UsersService } from 'src/modules/users/users.service';
import { DataSource, Repository } from 'typeorm';
import { CiltExecutionOwnerGuard } from './cilt-execution-owner.guard';

describe('CiltExecutionOwnerGuard', () => {
  let metadata: CiltExecutionOwnerOptions | undefined;
  const reflector = {
    getAllAndOverride: jest.fn((key: string) =>
      key === CILT_EXECUTION_OWNER_KEY ? metadata : undefined,
    ),
  } as unknown as Reflector;
  const usersService = {
    getUserRoles: jest.fn(),
  } as unknown as UsersService;
  const executionRepository = {
    findOne: jest.fn(),
  } as unknown as Repository<CiltSequencesExecutionsEntity>;
  const evidenceRepository = {
    findOne: jest.fn(),
  } as unknown as Repository<CiltSequencesExecutionsEvidencesEntity>;
  const dataSource = {
    getRepository: jest.fn((entity) =>
      entity === CiltSequencesExecutionsEntity
        ? executionRepository
        : evidenceRepository,
    ),
  } as unknown as DataSource;
  const guard = new CiltExecutionOwnerGuard(
    reflector,
    usersService,
    dataSource,
  );

  const createContext = (request: Record<string, unknown>) =>
    ({
      getHandler: () => function handler() {},
      getClass: () => class Controller {},
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    metadata = undefined;
    jest.clearAllMocks();
  });

  it('ignores handlers without ownership metadata', async () => {
    await expect(guard.canActivate(createContext({}))).resolves.toBe(true);
  });

  it('rejects an unauthenticated protected request', async () => {
    metadata = {
      resource: 'execution',
      source: 'body',
      requestKey: 'id',
    };

    await expect(guard.canActivate(createContext({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('allows a site administrator after tenant authorization', async () => {
    metadata = {
      resource: 'execution',
      source: 'body',
      requestKey: 'id',
    };
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['local_admin']);

    await expect(
      guard.canActivate(createContext({ user: { id: 10 }, body: { id: 7 } })),
    ).resolves.toBe(true);
    expect(executionRepository.findOne).not.toHaveBeenCalled();
  });

  it('allows the assigned operational user', async () => {
    metadata = {
      resource: 'execution',
      source: 'body',
      requestKey: 'id',
    };
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['mechanic']);
    jest
      .mocked(executionRepository.findOne)
      .mockResolvedValue({ userId: 10, userWhoExecutedId: null } as never);

    await expect(
      guard.canActivate(createContext({ user: { id: 10 }, body: { id: 7 } })),
    ).resolves.toBe(true);
  });

  it('rejects another operational user', async () => {
    metadata = {
      resource: 'execution',
      source: 'body',
      requestKey: 'id',
    };
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['mechanic']);
    jest
      .mocked(executionRepository.findOne)
      .mockResolvedValue({ userId: 20, userWhoExecutedId: null } as never);

    await expect(
      guard.canActivate(createContext({ user: { id: 10 }, body: { id: 7 } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('prevents an owner from reassigning an execution', async () => {
    metadata = {
      resource: 'execution',
      source: 'body',
      requestKey: 'id',
    };
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['mechanic']);
    jest
      .mocked(executionRepository.findOne)
      .mockResolvedValue({ userId: 10, userWhoExecutedId: null } as never);

    await expect(
      guard.canActivate(
        createContext({
          user: { id: 10 },
          body: { id: 7, userWhoExecutedId: 20 },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires a new execution to be assigned to the current user', async () => {
    metadata = {
      resource: 'newExecution',
      source: 'body',
      requestKey: 'userId',
    };
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['mechanic']);

    await expect(
      guard.canActivate(
        createContext({ user: { id: 10 }, body: { userId: 20 } }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('resolves evidence ownership through its execution', async () => {
    metadata = {
      resource: 'evidence',
      source: 'params',
      requestKey: 'id',
    };
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['operator']);
    jest
      .mocked(evidenceRepository.findOne)
      .mockResolvedValue({ ciltSequencesExecutionsId: 7 } as never);
    jest
      .mocked(executionRepository.findOne)
      .mockResolvedValue({ userId: 10, userWhoExecutedId: null } as never);

    await expect(
      guard.canActivate(createContext({ user: { id: 10 }, params: { id: 5 } })),
    ).resolves.toBe(true);
  });

  it('returns not found for an unknown execution', async () => {
    metadata = {
      resource: 'execution',
      source: 'body',
      requestKey: 'id',
    };
    jest.mocked(usersService.getUserRoles).mockResolvedValue(['mechanic']);
    jest.mocked(executionRepository.findOne).mockResolvedValue(null);

    await expect(
      guard.canActivate(createContext({ user: { id: 10 }, body: { id: 999 } })),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
