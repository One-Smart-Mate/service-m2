import { Repository } from 'typeorm';
import { EvidenceEntity } from '../evidence/entities/evidence.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CardEntity } from './entities/card.entity';
import { CardService } from './card.service';

describe('CardService tenant-scoped collections', () => {
  const cardRepository = {
    find: jest.fn(),
    findBy: jest.fn(),
  } as unknown as Repository<CardEntity>;
  const evidenceRepository = {
    find: jest.fn(),
  } as unknown as Repository<EvidenceEntity>;
  const usersService = {
    getAccessibleSiteIds: jest.fn(),
  } as unknown as UsersService;
  const userRepository = {
    findOne: jest.fn(),
  } as unknown as Repository<UserEntity>;
  const service = Reflect.construct(CardService, [
    cardRepository,
    evidenceRepository,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    usersService,
    undefined,
    userRepository,
  ]) as CardService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filters responsible cards using every site available to the requester', async () => {
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue([2, 3]);
    jest.mocked(cardRepository.findBy).mockResolvedValue([]);

    await service.findResponsibleCards(20, 10);

    expect(cardRepository.findBy).toHaveBeenCalledWith({
      responsableId: 20,
      siteId: expect.objectContaining({ _value: [2, 3] }),
    });
  });

  it('does not add a site filter for IH_sis_admin', async () => {
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue(null);
    jest.mocked(cardRepository.findBy).mockResolvedValue([]);

    await service.findResponsibleCards(20, 10);

    expect(cardRepository.findBy).toHaveBeenCalledWith({ responsableId: 20 });
  });

  it('intersects mechanic sites with the requester accessible sites', async () => {
    jest.mocked(userRepository.findOne).mockResolvedValue({
      userHasSites: [{ site: { id: 2 } }, { site: { id: 3 } }],
    } as UserEntity);
    jest.mocked(usersService.getAccessibleSiteIds).mockResolvedValue([2]);
    jest.mocked(cardRepository.find).mockResolvedValue([]);

    await service.findUserCards(20, 10);

    expect(cardRepository.find).toHaveBeenCalledWith({
      where: {
        siteId: expect.objectContaining({ _value: [2] }),
        mechanicId: 20,
      },
      order: { siteCardId: 'DESC' },
    });
    expect(evidenceRepository.find).not.toHaveBeenCalled();
  });
});
