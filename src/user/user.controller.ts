import { Controller, UseGuards, Get } from '@nestjs/common';
import { GetUser } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';
import { User } from '@prisma/client';

@Controller('user')
@UseGuards(JwtGuard)
export class UserController {
  @Get('me')
  getMe(@GetUser() user: User) {
    return user;
  }
}
