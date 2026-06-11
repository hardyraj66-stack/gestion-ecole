import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Req() req: any, @Body() body: { username: string; password: string }) {
    const userAgent = req.headers?.['user-agent'] || '';
    const ip = (req.headers?.['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '')
      .toString().split(',')[0].trim();
    return this.authService.login(body?.username, body?.password, { userAgent, ip });
  }

  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.authService.me(userId);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: { nom?: string; email?: string },
  ) {
    return this.authService.updateProfile(userId, body);
  }

  @Post('change-password')
  changePassword(
    @CurrentUser('id') userId: string,
    @CurrentUser('jti') jti: string,
    @Body() body: { current: string; next: string },
  ) {
    return this.authService.changePassword(userId, body?.current, body?.next, jti);
  }

  @Post('logout')
  logout(@CurrentUser('id') userId: string, @CurrentUser('jti') jti: string) {
    return this.authService.logout(userId, jti);
  }

  @Post('logout-all')
  logoutAll(@CurrentUser('id') userId: string) {
    return this.authService.logoutAll(userId);
  }

  @Get('sessions')
  sessions(@CurrentUser('id') userId: string, @CurrentUser('jti') jti: string) {
    return this.authService.listSessions(userId, jti);
  }

  @Delete('sessions/:jti')
  revokeSession(@CurrentUser('id') userId: string, @Param('jti') jti: string) {
    return this.authService.revokeSession(userId, jti);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body?.email);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body?.token, body?.password);
  }
}
