import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AppleLoginDto } from './dto/apple-login.dto';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async loginWithApple(dto: AppleLoginDto) {
    // 1. In production, verify dto.identityToken with Apple Keys
    // 2. find or create user
    const user = await this.usersService.findOrCreate(dto.appleId, dto.email);

    // 3. Update Age Bucket if new or changed
    if (dto.ageBucket && String(user.ageBucket) !== String(dto.ageBucket)) {
      await this.usersService.setAgeBucket(user.id, dto.ageBucket);
    }

    // 4. Return Session (JWT in future)
    return {
      message: 'Authenticated successfully',
      user: user,
      // accessToken: 'jwt_token_here'
    };
  }
}
