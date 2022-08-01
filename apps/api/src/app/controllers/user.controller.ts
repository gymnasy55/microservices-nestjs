import { Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { UserId } from '../guards/user.decorator';
import { Cron } from '@nestjs/schedule';

@Controller('user')
export class UserController {
  constructor() {}

  @UseGuards(JwtAuthGuard)
  @Post('info')
  async info(@UserId() userId: string) {}

  @Cron('*/5 * * * * *')
  async cron() {
    Logger.log('Done');
  }
}
