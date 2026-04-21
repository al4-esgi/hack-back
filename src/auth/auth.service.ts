import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from 'src/users/users.repository';
import { EncryptionService } from '../encryption/encryption.service';
import { SelectUser } from 'src/users/users.entity';
import JwtPayloadInterface from './_utils/interfaces/jwt-payload.interface';
import { InstagramProfile } from './_utils/interfaces/instagram-profile.interface';
import { UserRoleEnum } from 'src/users/_utils/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async validateUser(email: string, pass: string) {
    // const user = await this.usersRepository.findOneByEmailOrThrow(email);
    //
    // const passwordStatus = await this.encryptionService.compare(pass, user.password);
    // if (!passwordStatus.isPasswordCorrect) throw new UnauthorizedException('WRONG_CREDENTIALS');
    // if (passwordStatus.isEncryptionChanged) {
    //   await this.usersRepository.updatePasswordById(user._id, pass);
    // }
    //
    // return user;
  }

  async login(login: any) {
    // const user = await this.validateUser(login.email, login.password);
    //
    // const payload: JwtPayloadInterface = { email: user.email, id: user._id.toString(), role: user.role };
    // return { accessToken: this.jwtService.sign(payload), user: this.usersService.getUser(user) };
  }

  async validateInstagramLogin(
    profile: InstagramProfile,
    accessToken: string,
    refreshToken: string,
  ): Promise<SelectUser> {
    let user = await this.usersRepository.findByInstagramId(profile.id);

    if (!user) {
      user = await this.usersRepository.createInstagramUser(profile, accessToken, refreshToken);
    } else {
      user = await this.usersRepository.updateInstagramTokens(user.id, accessToken, refreshToken);
    }

    return user;
  }

  generateJwt(user: SelectUser) {
    const payload: JwtPayloadInterface = {
      email: user.email,
      id: user.id.toString(),
      role: UserRoleEnum.USER,
    };
    return this.jwtService.sign(payload);
  }
}
