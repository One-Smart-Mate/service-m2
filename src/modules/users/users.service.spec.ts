import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const userRepository = {
    findOne: jest.fn(),
  } as unknown as Repository<UserEntity>;

  const service = Reflect.construct(UsersService, [
    userRepository,
  ]) as UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findOneByEmail', () => {
    it.each([undefined, null, '', '   '])(
      'rejects an invalid email filter: %p',
      (email) => {
        expect(() => service.findOneByEmail(email)).toThrow(
          BadRequestException,
        );
        expect(userRepository.findOne).not.toHaveBeenCalled();
      },
    );

    it('queries the repository when the email is valid', async () => {
      jest.mocked(userRepository.findOne).mockResolvedValue(null);

      await service.findOneByEmail('user@example.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
        relations: { userHasSites: { site: true } },
      });
    });
  });

  describe('getUserRoles', () => {
    it('returns no roles when the JWT user no longer exists', async () => {
      jest.mocked(userRepository.findOne).mockResolvedValue(null);

      await expect(service.getUserRoles(10)).resolves.toEqual([]);
    });
  });

  describe('getAccessibleSiteIds', () => {
    it('returns null for IH_sis_admin to represent global access', async () => {
      jest.mocked(userRepository.findOne).mockResolvedValue({
        userRoles: [{ role: { name: 'IH_sis_admin' } }],
      } as UserEntity);

      await expect(service.getAccessibleSiteIds(10)).resolves.toBeNull();
    });

    it('returns all assigned sites for a regular user', async () => {
      jest
        .mocked(userRepository.findOne)
        .mockResolvedValueOnce({
          userRoles: [{ role: { name: 'local_admin' } }],
        } as UserEntity)
        .mockResolvedValueOnce({
          userHasSites: [{ site: { id: 2 } }, { site: { id: 3 } }],
        } as UserEntity);

      await expect(service.getAccessibleSiteIds(10)).resolves.toEqual([2, 3]);
    });

    it('rejects a regular user without assigned sites', async () => {
      jest
        .mocked(userRepository.findOne)
        .mockResolvedValueOnce({
          userRoles: [{ role: { name: 'mechanic' } }],
        } as UserEntity)
        .mockResolvedValueOnce({ userHasSites: [] } as UserEntity);

      await expect(service.getAccessibleSiteIds(10)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
