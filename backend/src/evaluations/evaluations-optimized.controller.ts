import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Query,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EvaluationsOptimizedService } from './evaluations-optimized.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('evaluations-optimized')
@Controller('evaluations-optimized')
export class EvaluationsOptimizedController {
  constructor(
    private readonly evaluationsOptimizedService: EvaluationsOptimizedService,
  ) {}

  @Get('judge-progress/:juezId/team/:teamId/challenge/:challengeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener progreso de evaluación de un juez para un equipo',
  })
  @ApiResponse({
    status: 200,
    description: 'Progreso de evaluación',
  })
  @ApiParam({ name: 'juezId', description: 'ID del juez' })
  @ApiParam({ name: 'teamId', description: 'ID del equipo' })
  @ApiParam({ name: 'challengeId', description: 'ID del desafío' })
  async getJudgeProgress(
    @Param('juezId') juezId: string,
    @Param('teamId') teamId: string,
    @Param('challengeId') challengeId: string,
  ) {
    return await this.evaluationsOptimizedService.getJudgeProgressForTeam(
      juezId,
      teamId,
      challengeId,
    );
  }

  @Get('team/:teamId/score/challenge/:challengeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener puntuación detallada de un equipo para un desafío',
  })
  @ApiResponse({
    status: 200,
    description: 'Puntuación del equipo con detalles',
  })
  @ApiParam({ name: 'teamId', description: 'ID del equipo' })
  @ApiParam({ name: 'challengeId', description: 'ID del desafío' })
  async getTeamScore(
    @Param('teamId') teamId: string,
    @Param('challengeId') challengeId: string,
  ) {
    return await this.evaluationsOptimizedService.getTeamScore(
      teamId,
      challengeId,
    );
  }

  @Get('leaderboard/hackathon/:hackathonId')
  @ApiOperation({
    summary: 'Obtener tabla de posiciones de un hackathon',
  })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard del hackathon',
  })
  @ApiParam({ name: 'hackathonId', description: 'ID del hackathon' })
  async getHackathonLeaderboard(@Param('hackathonId') hackathonId: string) {
    return await this.evaluationsOptimizedService.getHackathonLeaderboard(
      hackathonId,
    );
  }

  @Delete('cache/clear')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Limpiar toda la caché de evaluaciones',
  })
  @ApiResponse({
    status: 200,
    description: 'Caché limpiada exitosamente',
  })
  async clearCache() {
    await this.evaluationsOptimizedService.clearAllCache();
    return {
      message: 'Caché de evaluaciones limpiada exitosamente',
    };
  }

  @Get('stats/cache')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener estadísticas de caché',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de caché',
  })
  async getCacheStats() {
    // This would require exposing cache stats from CacheService
    return {
      message: 'Cache statistics endpoint',
      note: 'Implementation pending',
    };
  }
}
