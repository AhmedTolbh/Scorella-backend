import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AppleLoginDto } from './dto/apple-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('apple')
  login(@Body() appleLoginDto: AppleLoginDto) {
    return this.authService.loginWithApple(appleLoginDto);
  }
}
