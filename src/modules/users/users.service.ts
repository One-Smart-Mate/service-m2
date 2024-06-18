import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { HandleException } from 'src/common/exceptions/handler/handle.exception';
import { CreateUserDTO } from './models/create.user.dto';
import { ValidationException, ValidationExceptionType } from 'src/common/exceptions/types/validation.exception';
import { SiteService } from '../site/site.service';
import { NotFoundCustomException, NotFoundCustomExceptionType } from 'src/common/exceptions/types/notFound.exception';
import { RolesService } from '../roles/roles.service';
import * as bcryptjs from 'bcryptjs';
import { stringConstants } from 'src/utils/string.constant';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly siteService: SiteService,
    private readonly roleService: RolesService
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

  create = async (createUserDTO: CreateUserDTO) => {
    try{
      const emailExists = await this.userRepository.existsBy({email: createUserDTO.email})
      if(emailExists){
        throw new ValidationException(ValidationExceptionType.DUPLICATED_USER)
      }

      const site = await this.siteService.findById(createUserDTO.siteId)
      const roles = await this.roleService.findRolesByIds(createUserDTO.roles)

      if(!site){
        throw new NotFoundCustomException(NotFoundCustomExceptionType.SITE)
      }else if(!roles){
        throw new NotFoundCustomException(NotFoundCustomExceptionType.ROLES)
      }


      const user = await this.userRepository.create({
        name: createUserDTO.name,
        email : createUserDTO.email,
        password : await bcryptjs.hash(createUserDTO.password, stringConstants.SALT_ROUNDS),
        site : site,
        appVersion: process.env.APP_ENV,
        siteCode: site.siteCode,
        uploadCardDataWithDataNet : createUserDTO.uploadCardDataWithDataNet,
        uploadCardEvidenceWithDataNet : createUserDTO.uploadCardDataWithDataNet,
        createdAt : new Date()
      })

      await this.userRepository.save(user)

      return await this.roleService.assignUserRoles(user, roles)
    }catch(exception){
      HandleException.exception(exception)
    }
  }
}
