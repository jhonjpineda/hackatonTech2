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
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { HackathonsService } from './hackathons.service';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { UpdateHackathonDto } from './dto/update-hackathon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { HackathonStatus } from '../entities/hackathon.entity';

@ApiTags('hackathons')
@Controller('hackathons')
export class HackathonsController {
  constructor(private readonly hackathonsService: HackathonsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo hackathon' })
  @ApiResponse({
    status: 201,
    description: 'Hackathon creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos para crear hackathones',
  })
  create(@Body() createHackathonDto: CreateHackathonDto, @Request() req: any) {
    return this.hackathonsService.create(createHackathonDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los hackathones' })
  @ApiQuery({
    name: 'estado',
    required: false,
    enum: HackathonStatus,
  })
  @ApiQuery({
    name: 'publicado',
    required: false,
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de hackathones',
  })
  findAll(
    @Query('estado') estado?: HackathonStatus,
    @Query('publicado') publicado?: string,
  ) {
    const filters: any = {};
    if (estado) filters.estado = estado;
    if (publicado !== undefined)
      filters.publicado = publicado === 'true' || publicado === '1';

    return this.hackathonsService.findAll(filters);
  }

  @Get('public')
  @ApiOperation({ summary: 'Obtener hackathones públicos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de hackathones públicos',
  })
  findPublic() {
    return this.hackathonsService.findPublic();
  }

  @Get('my-hackathons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mis hackathones creados' })
  @ApiResponse({
    status: 200,
    description: 'Lista de hackathones del organizador',
  })
  findMyHackathons(@Request() req: any) {
    return this.hackathonsService.findByOrganizador(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un hackathon por ID' })
  @ApiResponse({
    status: 200,
    description: 'Hackathon encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Hackathon no encontrado',
  })
  findOne(@Param('id') id: string) {
    return this.hackathonsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un hackathon' })
  @ApiResponse({
    status: 200,
    description: 'Hackathon actualizado exitosamente',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos para editar este hackathon',
  })
  @ApiResponse({
    status: 404,
    description: 'Hackathon no encontrado',
  })
  update(
    @Param('id') id: string,
    @Body() updateHackathonDto: UpdateHackathonDto,
    @Request() req: any,
  ) {
    return this.hackathonsService.update(id, updateHackathonDto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un hackathon' })
  @ApiResponse({
    status: 204,
    description: 'Hackathon eliminado exitosamente',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos para eliminar este hackathon',
  })
  @ApiResponse({
    status: 404,
    description: 'Hackathon no encontrado',
  })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.hackathonsService.remove(id, req.user.sub);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar el estado de un hackathon' })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado exitosamente',
  })
  updateStatus(
    @Param('id') id: string,
    @Body('estado') estado: HackathonStatus,
    @Request() req: any,
  ) {
    return this.hackathonsService.updateStatus(id, estado, req.user.sub);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publicar un hackathon' })
  @ApiResponse({
    status: 200,
    description: 'Hackathon publicado exitosamente',
  })
  publish(@Param('id') id: string, @Request() req: any) {
    return this.hackathonsService.publish(id, req.user.sub);
  }

  @Post(':id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Despublicar un hackathon' })
  @ApiResponse({
    status: 200,
    description: 'Hackathon despublicado exitosamente',
  })
  unpublish(@Param('id') id: string, @Request() req: any) {
    return this.hackathonsService.unpublish(id, req.user.sub);
  }

  /**
   * ENDPOINTS PARA INSCRIPCIONES Y ELEGIBILIDAD
   */

  @Get(':id/eligibility')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar elegibilidad para un hackathon' })
  @ApiResponse({
    status: 200,
    description: 'Resultado de verificación de elegibilidad',
  })
  checkEligibility(@Param('id') id: string, @Request() req: any) {
    return this.hackathonsService.checkEligibility(id, req.user.sub);
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inscribirse en un hackathon' })
  @ApiResponse({
    status: 200,
    description: 'Inscripción exitosa',
  })
  @ApiResponse({
    status: 400,
    description: 'No cumples con los requisitos para inscribirte',
  })
  registerToHackathon(@Param('id') id: string, @Request() req: any) {
    return this.hackathonsService.registerUserToHackathon(id, req.user.sub);
  }

  @Delete(':id/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar inscripción en un hackathon' })
  @ApiResponse({
    status: 200,
    description: 'Inscripción cancelada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Inscripción no encontrada',
  })
  cancelRegistration(@Param('id') id: string, @Request() req: any) {
    return this.hackathonsService.cancelRegistration(id, req.user.sub);
  }

  @Get(':id/registrations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR, UserRole.JUEZ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener inscripciones de un hackathon' })
  @ApiResponse({
    status: 200,
    description: 'Lista de inscripciones',
  })
  getHackathonRegistrations(@Param('id') id: string) {
    return this.hackathonsService.getHackathonRegistrations(id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estadísticas de inscripciones' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del hackathon',
  })
  getHackathonStats(@Param('id') id: string) {
    return this.hackathonsService.getHackathonStats(id);
  }

  @Get('user/registrations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mis inscripciones' })
  @ApiResponse({
    status: 200,
    description: 'Lista de inscripciones del usuario',
  })
  getUserRegistrations(@Request() req: any) {
    return this.hackathonsService.getUserRegistrations(req.user.sub);
  }

  @Get('user/available')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener hackathons disponibles para mí' })
  @ApiResponse({
    status: 200,
    description: 'Lista de hackathons con información de elegibilidad',
  })
  getAvailableHackathons(@Request() req: any) {
    return this.hackathonsService.getAvailableHackathons(req.user.sub);
  }

  @Post(':id/create-categories')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Crear categorías faltantes para un hackathon',
    description:
      'Crea automáticamente categorías basadas en los topics del hackathon si no existen. Endpoint temporal para migración.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categorías creadas exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Hackathon no encontrado',
  })
  createMissingCategories(@Param('id') id: string) {
    return this.hackathonsService.createMissingCategories(id);
  }
}
