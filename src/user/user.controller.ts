import { Controller, UseGuards, Get } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';

@Controller('user')
@UseGuards(JwtGuard)
export class UserController {
  @Get('me')
  getMe(@GetUser() user: User) {
    return user;
  }
}
