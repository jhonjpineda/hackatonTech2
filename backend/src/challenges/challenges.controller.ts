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
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('challenges')
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo reto' })
  @ApiResponse({ status: 201, description: 'Reto creado exitosamente' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  create(@Body() createChallengeDto: CreateChallengeDto, @Request() req: any) {
    return this.challengesService.create(createChallengeDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los retos' })
  @ApiResponse({ status: 200, description: 'Lista de retos' })
  findAll() {
    return this.challengesService.findAll();
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Obtener retos de una categoría específica' })
  @ApiResponse({ status: 200, description: 'Lista de retos de la categoría' })
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.challengesService.findByCategory(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un reto por ID' })
  @ApiResponse({ status: 200, description: 'Reto encontrado' })
  @ApiResponse({ status: 404, description: 'Reto no encontrado' })
  findOne(@Param('id') id: string) {
    return this.challengesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un reto' })
  @ApiResponse({ status: 200, description: 'Reto actualizado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  @ApiResponse({ status: 404, description: 'Reto no encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateChallengeDto: UpdateChallengeDto,
    @Request() req: any,
  ) {
    return this.challengesService.update(id, updateChallengeDto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un reto' })
  @ApiResponse({ status: 204, description: 'Reto eliminado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  @ApiResponse({ status: 404, description: 'Reto no encontrado' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.challengesService.remove(id, req.user.sub);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publicar un reto' })
  @ApiResponse({ status: 200, description: 'Reto publicado' })
  publish(@Param('id') id: string, @Request() req: any) {
    return this.challengesService.publish(id, req.user.sub);
  }

  @Post(':id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar un reto' })
  @ApiResponse({ status: 200, description: 'Reto cerrado' })
  close(@Param('id') id: string, @Request() req: any) {
    return this.challengesService.close(id, req.user.sub);
  }
}
