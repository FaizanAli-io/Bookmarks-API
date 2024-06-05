import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDTO } from './dto';
import * as argon from 'argon2';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signup(dto: AuthDTO) {
    const hash = await argon.hash(dto.password);

    const user = await this.prisma.user.create({
      data: { email: dto.email, hash: hash },
    });

    delete user.hash;

    return user;
  }

  async signin(dto: AuthDTO) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new ForbiddenException('Credentials Incorrect');
    }

    const pwMatch = await argon.verify(user.hash, dto.password);

    if (!pwMatch) {
      throw new ForbiddenException('Credentials Incorrect');
    }

    delete user.hash;

    return user;
  }
}
