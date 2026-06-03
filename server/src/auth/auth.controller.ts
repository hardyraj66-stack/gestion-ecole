import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body?.username, body?.password);
  }

  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.authService.me(userId);
  }

  @Post('change-password')
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() body: { current: string; next: string },
  ) {
    return this.authService.changePassword(userId, body?.current, body?.next);
  }
}
