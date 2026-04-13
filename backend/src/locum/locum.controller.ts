import {
  Controller, Get, Post, Body,
  UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard }          from '@nestjs/passport';
import { LocumService }       from './locum.service.js';
import { SaveLocumProfileDto } from './locum.dto.js';

interface JwtRequest {
  user: { userId: string; email: string; role: string };
}

@Controller('locum')
@UseGuards(AuthGuard('jwt'))
export class LocumController {
  constructor(private readonly locumService: LocumService) {}

  /** POST /api/locum/profile */
  @Post('profile')
  @HttpCode(HttpStatus.OK)
  saveProfile(
    @Req()  req: JwtRequest,
    @Body() dto: SaveLocumProfileDto,
  ) {
    return this.locumService.saveProfile(req.user.userId, dto);
  }

  /** GET /api/locum/profile */
  @Get('profile')
  getProfile(@Req() req: JwtRequest) {
    return this.locumService.getProfile(req.user.userId);
  }
}
