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
import { CommunicationChannelsService } from './communication-channels.service';
import { CreateCommunicationChannelDto } from './dto/create-communication-channel.dto';
import { UpdateCommunicationChannelDto } from './dto/update-communication-channel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('communication-channels')
@Controller('communication-channels')
export class CommunicationChannelsController {
  constructor(
    private readonly communicationChannelsService: CommunicationChannelsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo canal de comunicación' })
  @ApiResponse({
    status: 201,
    description: 'Canal de comunicación creado exitosamente',
  })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  create(
    @Body() createCommunicationChannelDto: CreateCommunicationChannelDto,
    @Request() req: any,
  ) {
    return this.communicationChannelsService.create(
      createCommunicationChannelDto,
      req.user.sub,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los canales de comunicación' })
  @ApiResponse({ status: 200, description: 'Lista de canales' })
  findAll() {
    return this.communicationChannelsService.findAll();
  }

  @Get('hackathon/:hackathonId')
  @ApiOperation({
    summary: 'Obtener canales de comunicación de un hackathon específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de canales del hackathon',
  })
  findByHackathon(@Param('hackathonId') hackathonId: string) {
    return this.communicationChannelsService.findByHackathon(hackathonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un canal de comunicación por ID' })
  @ApiResponse({ status: 200, description: 'Canal encontrado' })
  @ApiResponse({ status: 404, description: 'Canal no encontrado' })
  findOne(@Param('id') id: string) {
    return this.communicationChannelsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un canal de comunicación' })
  @ApiResponse({ status: 200, description: 'Canal actualizado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  @ApiResponse({ status: 404, description: 'Canal no encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateCommunicationChannelDto: UpdateCommunicationChannelDto,
    @Request() req: any,
  ) {
    return this.communicationChannelsService.update(
      id,
      updateCommunicationChannelDto,
      req.user.sub,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un canal de comunicación' })
  @ApiResponse({ status: 204, description: 'Canal eliminado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  @ApiResponse({ status: 404, description: 'Canal no encontrado' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.communicationChannelsService.remove(id, req.user.sub);
  }
}
