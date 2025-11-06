import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../entities/user.entity';

@ApiTags('Topics')
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo tema (solo ORGANIZADOR)' })
  @ApiResponse({ status: 201, description: 'Tema creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Ya existe un tema con este código' })
  create(@Body() createTopicDto: CreateTopicDto) {
    return this.topicsService.create(createTopicDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los temas' })
  @ApiResponse({ status: 200, description: 'Lista de todos los temas' })
  findAll() {
    return this.topicsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Obtener solo temas activos' })
  @ApiResponse({ status: 200, description: 'Lista de temas activos' })
  findAllActive() {
    return this.topicsService.findAllActive();
  }

  @Get('code/:codigo')
  @ApiOperation({ summary: 'Obtener tema por código' })
  @ApiResponse({ status: 200, description: 'Tema encontrado' })
  @ApiResponse({ status: 404, description: 'Tema no encontrado' })
  findByCode(@Param('codigo') codigo: string) {
    return this.topicsService.findByCode(codigo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener tema por ID' })
  @ApiResponse({ status: 200, description: 'Tema encontrado' })
  @ApiResponse({ status: 404, description: 'Tema no encontrado' })
  findOne(@Param('id') id: string) {
    return this.topicsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un tema (solo ORGANIZADOR)' })
  @ApiResponse({ status: 200, description: 'Tema actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Tema no encontrado' })
  update(@Param('id') id: string, @Body() updateTopicDto: UpdateTopicDto) {
    return this.topicsService.update(id, updateTopicDto);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activar/desactivar tema (solo ORGANIZADOR)' })
  @ApiResponse({ status: 200, description: 'Estado del tema cambiado' })
  @ApiResponse({ status: 404, description: 'Tema no encontrado' })
  toggleActive(@Param('id') id: string) {
    return this.topicsService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un tema (solo ORGANIZADOR)' })
  @ApiResponse({ status: 204, description: 'Tema eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Tema no encontrado' })
  remove(@Param('id') id: string) {
    return this.topicsService.remove(id);
  }
}
