import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('submissions')
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva entrega (borrador)' })
  @ApiResponse({ status: 201, description: 'Entrega creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos para crear esta entrega',
  })
  create(@Body() createSubmissionDto: CreateSubmissionDto, @Request() req: any) {
    return this.submissionsService.create(createSubmissionDto, req.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR, UserRole.JUEZ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las entregas' })
  @ApiResponse({ status: 200, description: 'Lista de entregas' })
  findAll() {
    return this.submissionsService.findAll();
  }

  @Get('my-submissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mis entregas (equipos donde participo)' })
  @ApiResponse({ status: 200, description: 'Lista de mis entregas' })
  findMySubmissions(@Request() req: any) {
    return this.submissionsService.findMySubmissions(req.user.sub);
  }

  @Get('challenge/:challengeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener entregas de un reto específico' })
  @ApiResponse({ status: 200, description: 'Lista de entregas del reto' })
  findByChallenge(@Param('challengeId') challengeId: string) {
    return this.submissionsService.findByChallenge(challengeId);
  }

  @Get('team/:teamId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener entregas de un equipo específico' })
  @ApiResponse({ status: 200, description: 'Lista de entregas del equipo' })
  findByTeam(@Param('teamId') teamId: string) {
    return this.submissionsService.findByTeam(teamId);
  }

  @Get('challenge/:challengeId/leaderboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener tabla de posiciones de un reto' })
  @ApiResponse({ status: 200, description: 'Tabla de posiciones' })
  getLeaderboard(@Param('challengeId') challengeId: string) {
    return this.submissionsService.getLeaderboard(challengeId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener una entrega por ID' })
  @ApiResponse({ status: 200, description: 'Entrega encontrada' })
  @ApiResponse({ status: 404, description: 'Entrega no encontrada' })
  findOne(@Param('id') id: string) {
    return this.submissionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una entrega' })
  @ApiResponse({ status: 200, description: 'Entrega actualizada' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  @ApiResponse({ status: 404, description: 'Entrega no encontrada' })
  update(
    @Param('id') id: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
    @Request() req: any,
  ) {
    return this.submissionsService.update(id, updateSubmissionDto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una entrega' })
  @ApiResponse({ status: 204, description: 'Entrega eliminada' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  @ApiResponse({ status: 404, description: 'Entrega no encontrada' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.submissionsService.remove(id, req.user.sub);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar entrega (cambiar de borrador a enviada)' })
  @ApiResponse({ status: 200, description: 'Entrega enviada exitosamente' })
  @ApiResponse({ status: 400, description: 'La entrega ya fue enviada' })
  @ApiResponse({
    status: 403,
    description: 'Solo el líder puede enviar la entrega',
  })
  submit(@Param('id') id: string, @Request() req: any) {
    return this.submissionsService.submit(id, req.user.sub);
  }

  @Post(':id/start-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.JUEZ, UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar revisión de una entrega' })
  @ApiResponse({ status: 200, description: 'Revisión iniciada' })
  @ApiResponse({
    status: 403,
    description: 'Solo jueces u organizadores pueden iniciar revisión',
  })
  startReview(@Param('id') id: string, @Request() req: any) {
    return this.submissionsService.startReview(id, req.user.sub);
  }

  @Post(':id/mark-evaluated')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.JUEZ, UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar entrega como evaluada' })
  @ApiResponse({ status: 200, description: 'Entrega marcada como evaluada' })
  @ApiResponse({
    status: 400,
    description: 'La entrega debe tener al menos una evaluación',
  })
  markAsEvaluated(@Param('id') id: string, @Request() req: any) {
    return this.submissionsService.markAsEvaluated(id, req.user.sub);
  }
}
