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
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('evaluations')
@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.JUEZ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva evaluación' })
  @ApiResponse({ status: 201, description: 'Evaluación creada exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Calificación fuera de rango o ya evaluado',
  })
  @ApiResponse({ status: 403, description: 'Solo jueces pueden evaluar' })
  create(@Body() createEvaluationDto: CreateEvaluationDto, @Request() req: any) {
    return this.evaluationsService.create(createEvaluationDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las evaluaciones' })
  @ApiResponse({ status: 200, description: 'Lista de evaluaciones' })
  findAll() {
    return this.evaluationsService.findAll();
  }

  @Get('team/:teamId')
  @ApiOperation({ summary: 'Obtener evaluaciones de un equipo' })
  @ApiResponse({ status: 200, description: 'Lista de evaluaciones del equipo' })
  findByTeam(@Param('teamId') teamId: string) {
    return this.evaluationsService.findByTeam(teamId);
  }

  @Get('juez/:juezId')
  @ApiOperation({ summary: 'Obtener evaluaciones de un juez' })
  @ApiResponse({ status: 200, description: 'Lista de evaluaciones del juez' })
  findByJuez(@Param('juezId') juezId: string) {
    return this.evaluationsService.findByJuez(juezId);
  }

  @Get('challenge/:challengeId')
  @ApiOperation({ summary: 'Obtener evaluaciones de un reto' })
  @ApiResponse({ status: 200, description: 'Lista de evaluaciones del reto' })
  findByChallenge(@Param('challengeId') challengeId: string) {
    return this.evaluationsService.findByChallenge(challengeId);
  }

  @Get('team/:teamId/score/:challengeId')
  @ApiOperation({
    summary: 'Obtener puntuación calculada de un equipo para un reto',
  })
  @ApiResponse({
    status: 200,
    description: 'Puntuación del equipo con detalles por rúbrica',
  })
  getTeamScore(
    @Param('teamId') teamId: string,
    @Param('challengeId') challengeId: string,
  ) {
    return this.evaluationsService.getTeamScore(teamId, challengeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una evaluación por ID' })
  @ApiResponse({ status: 200, description: 'Evaluación encontrada' })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada' })
  findOne(@Param('id') id: string) {
    return this.evaluationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.JUEZ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una evaluación' })
  @ApiResponse({ status: 200, description: 'Evaluación actualizada' })
  @ApiResponse({ status: 403, description: 'Solo puedes editar tus evaluaciones' })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada' })
  update(
    @Param('id') id: string,
    @Body() updateEvaluationDto: UpdateEvaluationDto,
    @Request() req: any,
  ) {
    return this.evaluationsService.update(id, updateEvaluationDto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.JUEZ)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una evaluación' })
  @ApiResponse({ status: 204, description: 'Evaluación eliminada' })
  @ApiResponse({
    status: 403,
    description: 'Solo puedes eliminar tus evaluaciones',
  })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.evaluationsService.remove(id, req.user.sub);
  }
}
