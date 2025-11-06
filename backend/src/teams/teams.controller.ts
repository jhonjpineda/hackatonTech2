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
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo equipo' })
  @ApiResponse({ status: 201, description: 'Equipo creado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Ya perteneces a un equipo o límite alcanzado',
  })
  create(@Body() createTeamDto: CreateTeamDto, @Request() req: any) {
    return this.teamsService.create(createTeamDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los equipos' })
  @ApiResponse({ status: 200, description: 'Lista de equipos' })
  findAll() {
    return this.teamsService.findAll();
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Obtener equipos de una categoría específica' })
  @ApiResponse({ status: 200, description: 'Lista de equipos de la categoría' })
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.teamsService.findByCategory(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un equipo por ID' })
  @ApiResponse({ status: 200, description: 'Equipo encontrado' })
  @ApiResponse({ status: 404, description: 'Equipo no encontrado' })
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un equipo' })
  @ApiResponse({ status: 200, description: 'Equipo actualizado' })
  @ApiResponse({ status: 403, description: 'Solo el líder puede editar' })
  @ApiResponse({ status: 404, description: 'Equipo no encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @Request() req: any,
  ) {
    return this.teamsService.update(id, updateTeamDto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un equipo' })
  @ApiResponse({ status: 204, description: 'Equipo eliminado' })
  @ApiResponse({
    status: 403,
    description: 'Solo el líder o el organizador pueden eliminar',
  })
  @ApiResponse({ status: 404, description: 'Equipo no encontrado' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.teamsService.remove(id, req.user.sub);
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agregar un miembro al equipo' })
  @ApiResponse({ status: 200, description: 'Miembro agregado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Límite alcanzado o usuario ya está en un equipo',
  })
  @ApiResponse({ status: 403, description: 'Solo el líder puede agregar' })
  addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
    @Request() req: any,
  ) {
    return this.teamsService.addMember(id, addMemberDto, req.user.sub);
  }

  @Delete(':id/members/:memberId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover un miembro del equipo' })
  @ApiResponse({ status: 204, description: 'Miembro removido exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'No se puede remover al líder o límite mínimo',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo el líder puede remover o puedes salirte',
  })
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    return this.teamsService.removeMember(id, memberId, req.user.sub);
  }
}
