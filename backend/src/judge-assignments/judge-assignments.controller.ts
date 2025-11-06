import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JudgeAssignmentsService } from './judge-assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

class AssignJudgeDto {
  juezId: string;
  hackathonId: string;
  teamIds?: string[];
}

class UpdateAssignmentDto {
  teamIds?: string[];
}

@ApiTags('Judge Assignments')
@Controller('judge-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class JudgeAssignmentsController {
  constructor(
    private readonly judgeAssignmentsService: JudgeAssignmentsService,
  ) {}

  @Post()
  @Roles(UserRole.ORGANIZADOR)
  @ApiOperation({ summary: 'Asignar un juez a un hackathon' })
  @ApiResponse({
    status: 201,
    description: 'Juez asignado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o juez ya asignado',
  })
  @ApiResponse({
    status: 404,
    description: 'Juez o hackathon no encontrado',
  })
  async assignJudge(@Body() assignJudgeDto: AssignJudgeDto) {
    return this.judgeAssignmentsService.assignJudgeToHackathon(
      assignJudgeDto.juezId,
      assignJudgeDto.hackathonId,
      assignJudgeDto.teamIds,
    );
  }

  @Get('judge/:juezId')
  @Roles(UserRole.ORGANIZADOR, UserRole.JUEZ)
  @ApiOperation({ summary: 'Obtener asignaciones de un juez' })
  @ApiResponse({
    status: 200,
    description: 'Lista de asignaciones del juez',
  })
  async getJudgeAssignments(@Param('juezId') juezId: string) {
    return this.judgeAssignmentsService.getJudgeAssignments(juezId);
  }

  @Get('hackathon/:hackathonId')
  @Roles(UserRole.ORGANIZADOR)
  @ApiOperation({ summary: 'Obtener todos los jueces de un hackathon' })
  @ApiResponse({
    status: 200,
    description: 'Lista de jueces asignados al hackathon',
  })
  async getHackathonJudges(@Param('hackathonId') hackathonId: string) {
    return this.judgeAssignmentsService.getHackathonJudges(hackathonId);
  }

  @Put(':assignmentId')
  @Roles(UserRole.ORGANIZADOR)
  @ApiOperation({ summary: 'Actualizar equipos asignados a un juez' })
  @ApiResponse({
    status: 200,
    description: 'Asignación actualizada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Asignación no encontrada',
  })
  async updateAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() updateDto: UpdateAssignmentDto,
  ) {
    return this.judgeAssignmentsService.updateJudgeAssignment(
      assignmentId,
      updateDto.teamIds,
    );
  }

  @Delete(':assignmentId')
  @Roles(UserRole.ORGANIZADOR)
  @ApiOperation({ summary: 'Remover asignación de un juez' })
  @ApiResponse({
    status: 200,
    description: 'Asignación removida exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Asignación no encontrada',
  })
  async removeAssignment(@Param('assignmentId') assignmentId: string) {
    await this.judgeAssignmentsService.removeJudgeAssignment(assignmentId);
    return { message: 'Asignación removida exitosamente' };
  }

  @Get('my-assignments')
  @Roles(UserRole.JUEZ)
  @ApiOperation({ summary: 'Obtener mis asignaciones como juez' })
  @ApiResponse({
    status: 200,
    description: 'Lista de mis asignaciones',
  })
  async getMyAssignments(@Request() req: any) {
    return this.judgeAssignmentsService.getJudgeAssignments(req.user.userId);
  }

  @Get('accessible-teams/:hackathonId')
  @Roles(UserRole.JUEZ)
  @ApiOperation({ summary: 'Obtener equipos accesibles para un juez en un hackathon' })
  @ApiResponse({
    status: 200,
    description: 'Lista de equipos accesibles',
  })
  async getAccessibleTeams(
    @Param('hackathonId') hackathonId: string,
    @Request() req: any,
  ) {
    return this.judgeAssignmentsService.getAccessibleTeamsForJudge(
      req.user.userId,
      hackathonId,
    );
  }
}
