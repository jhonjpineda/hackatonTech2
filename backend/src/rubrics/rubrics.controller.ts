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
import { RubricsService } from './rubrics.service';
import { CreateRubricDto } from './dto/create-rubric.dto';
import { UpdateRubricDto } from './dto/update-rubric.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('rubrics')
@Controller('rubrics')
export class RubricsController {
  constructor(private readonly rubricsService: RubricsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva rúbrica de evaluación' })
  @ApiResponse({ status: 201, description: 'Rúbrica creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Porcentajes exceden 100%' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  create(@Body() createRubricDto: CreateRubricDto, @Request() req: any) {
    return this.rubricsService.create(createRubricDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las rúbricas' })
  @ApiResponse({ status: 200, description: 'Lista de rúbricas' })
  findAll() {
    return this.rubricsService.findAll();
  }

  @Get('challenge/:challengeId')
  @ApiOperation({ summary: 'Obtener rúbricas de un reto específico' })
  @ApiResponse({ status: 200, description: 'Lista de rúbricas del reto' })
  findByChallenge(@Param('challengeId') challengeId: string) {
    return this.rubricsService.findByChallenge(challengeId);
  }

  @Get('challenge/:challengeId/validate')
  @ApiOperation({
    summary: 'Validar que las rúbricas de un reto sumen 100%',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado de la validación',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
      },
    },
  })
  async validateRubrics(@Param('challengeId') challengeId: string) {
    const valid = await this.rubricsService.validateRubricsTotal(challengeId);
    return { valid };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una rúbrica por ID' })
  @ApiResponse({ status: 200, description: 'Rúbrica encontrada' })
  @ApiResponse({ status: 404, description: 'Rúbrica no encontrada' })
  findOne(@Param('id') id: string) {
    return this.rubricsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una rúbrica' })
  @ApiResponse({ status: 200, description: 'Rúbrica actualizada' })
  @ApiResponse({ status: 400, description: 'Porcentajes exceden 100%' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  @ApiResponse({ status: 404, description: 'Rúbrica no encontrada' })
  update(
    @Param('id') id: string,
    @Body() updateRubricDto: UpdateRubricDto,
    @Request() req: any,
  ) {
    return this.rubricsService.update(id, updateRubricDto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una rúbrica' })
  @ApiResponse({ status: 204, description: 'Rúbrica eliminada' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  @ApiResponse({ status: 404, description: 'Rúbrica no encontrada' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.rubricsService.remove(id, req.user.sub);
  }
}
