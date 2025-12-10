import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AppleLoginDto } from './dto/apple-login.dto';
import { RegisterDto, LoginDto } from './dto/email-auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existingUser = await this.usersService.findOneByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.usersService.createWithEmail({
      email: dto.email,
      displayName: dto.displayName,
      passwordHash,
      ageBucket: dto.ageBucket,
    });

    return {
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }

  async loginWithEmail(dto: LoginDto) {
    // Find user by email
    const user = await this.usersService.findOneByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check password
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Please use Apple Sign-In for this account',
      );
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      message: 'Authenticated successfully',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        appleId: user.appleId,
        ageBucket: user.ageBucket,
      },
    };
  }

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
    };
  }
}
