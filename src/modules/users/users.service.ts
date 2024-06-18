import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  findOneByEmail = (email: string) => {
    return this.userRepository.findOne({where: {email: email}, relations: ['site']  });
  };
  update = async (user: UserEntity) => {
    const exists = await this.userRepository.existsBy({ email: user.email });
    if (!exists) {
      throw new BadRequestException('The user does not exist');
    }
    return this.userRepository.save(user);
  };

  getUserRoles = async (userId: number): Promise<string[]> => {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userRoles', 'userRoles.role'],
    });

    return user.userRoles.map((userRole) => userRole.role.name);
  };

  findById = async (userId: number) => {
    return await this.userRepository.findOneBy({ id: userId });
  };

  findSiteUsers = async (siteId: number) => {
    try {
      return await this.userRepository.find({where: {site: {id: siteId}}});
    } catch (exception) {
      HandleException.exception(exception);
    }
  };

  findAllUsers = async () => {
    try {
      const users = await this.userRepository.find({
        relations: ['userRoles', 'userRoles.role', 'site'],
      });

      const transformedUsers = users.map((user) => ({
        name: user.name,
        email: user.email,
        roles: user.userRoles.map((userRole) => ({
          id: userRole.role.id,
          name: userRole.role.name
        })),
        site: {id: user.site.id, name: user.site.name, logo: user.site.logo}
      }));

      return transformedUsers;
    } catch (exception) {
      HandleException.exception(exception);
    }
  };
}
