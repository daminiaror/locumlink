import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard }        from '@nestjs/passport';
import { HostService }      from './host.service.js';
import {
  SaveHostProfileDto,
  CreateJobDto,
  UpdateJobDto,
  UpdateApplicationDto,
} from './host.dto.js';

interface JwtRequest {
  user: { userId: string; email: string; role: string };
}

@Controller('host')
@UseGuards(AuthGuard('jwt'))
export class HostController {
  constructor(private readonly hostService: HostService) {}

  // ── Profile (unchanged) ────────────────────────────────────────────────────

  @Post('profile')
  @HttpCode(HttpStatus.OK)
  saveProfile(@Req() req: JwtRequest, @Body() dto: SaveHostProfileDto) {
    return this.hostService.saveProfile(req.user.userId, dto);
  }

  @Get('profile')
  getProfile(@Req() req: JwtRequest) {
    return this.hostService.getProfile(req.user.userId);
  }

  // ── Jobs ───────────────────────────────────────────────────────────────────

  @Post('jobs')
  createJob(@Req() req: JwtRequest, @Body() dto: CreateJobDto) {
    return this.hostService.createJob(req.user.userId, dto);
  }

  @Get('jobs')
  getJobs(@Req() req: JwtRequest) {
    return this.hostService.getJobs(req.user.userId);
  }

  @Get('jobs/:id')
  getJob(@Req() req: JwtRequest, @Param('id') id: string) {
    return this.hostService.getJob(req.user.userId, id);
  }

  @Patch('jobs/:id')
  updateJob(
    @Req() req: JwtRequest,
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.hostService.updateJob(req.user.userId, id, dto);
  }

  @Delete('jobs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteJob(@Req() req: JwtRequest, @Param('id') id: string) {
    return this.hostService.deleteJob(req.user.userId, id);
  }

  // ── Applications ───────────────────────────────────────────────────────────

  @Get('jobs/:jobId/applications')
  getApplications(@Req() req: JwtRequest, @Param('jobId') jobId: string) {
    return this.hostService.getApplications(req.user.userId, jobId);
  }

  @Patch('jobs/:jobId/applications/:appId')
  updateApplication(
    @Req() req: JwtRequest,
    @Param('jobId') jobId: string,
    @Param('appId') appId: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.hostService.updateApplication(req.user.userId, jobId, appId, dto.status);
  }
}