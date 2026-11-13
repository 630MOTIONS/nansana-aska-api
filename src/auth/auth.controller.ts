import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import type { AuthedRequest } from './auth.types.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Req() request: AuthedRequest) {
    const agent = request.headers['user-agent'];
    return this.auth.login(
      dto.email,
      dto.password,
      request.ip ?? 'unknown',
      Array.isArray(agent) ? agent[0] : agent,
    );
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() request: AuthedRequest) {
    return request.user;
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: AuthedRequest) {
    if (!request.session) throw new UnauthorizedException();
    await this.auth.logout(request.session.id);
  }

  @UseGuards(AuthGuard)
  @Post('change-password')
  @HttpCode(204)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() request: AuthedRequest,
  ) {
    if (!request.user || !request.session) throw new UnauthorizedException();
    await this.auth.changePassword(
      request.user.id,
      request.session.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
