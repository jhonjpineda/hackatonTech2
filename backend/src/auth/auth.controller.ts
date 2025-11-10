import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterWithSigaDto, CompleteRegistrationDto, VerifyTokenDto } from './dto/register-with-siga.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
  })
  @ApiResponse({
    status: 409,
    description: 'Usuario ya existe',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener usuario actual' })
  @ApiResponse({
    status: 200,
    description: 'Usuario obtenido exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async getCurrentUser(@Request() req) {
    return this.authService.getCurrentUser(req.user.sub);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar perfil de usuario' })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.sub, updateProfileDto);
  }

  @Delete('profile/topics/:topicId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar tema de interés adicional (solo campistas)' })
  @ApiResponse({
    status: 200,
    description: 'Tema eliminado exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado o intento de eliminar tema principal de SIGA',
  })
  @ApiResponse({
    status: 404,
    description: 'Tema no encontrado',
  })
  async removeInterestTopic(@Request() req, @Param('topicId') topicId: string) {
    return this.authService.removeInterestTopic(req.user.sub, topicId);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar token de acceso' })
  @ApiResponse({
    status: 200,
    description: 'Token refrescado exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de refresco inválido',
  })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada exitosamente',
  })
  async logout(@Request() req) {
    return this.authService.logout(req.user.sub);
  }

  /**
   * ENDPOINTS PARA INTEGRACIÓN CON SIGA
   */

  @Post('register/siga')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar registro con SIGA - Paso 1' })
  @ApiResponse({
    status: 200,
    description: 'Token de verificación enviado por email',
  })
  @ApiResponse({
    status: 400,
    description: 'Documento no válido en SIGA',
  })
  async registerWithSiga(@Body() registerDto: RegisterWithSigaDto) {
    return this.authService.registerWithSiga(registerDto);
  }

  @Post('verify-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar token de email - Paso 2' })
  @ApiResponse({
    status: 200,
    description: 'Token válido',
  })
  @ApiResponse({
    status: 404,
    description: 'Token inválido o expirado',
  })
  async verifyToken(@Body() verifyDto: VerifyTokenDto) {
    return this.authService.verifyToken(verifyDto);
  }

  @Post('complete-registration')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Completar registro con SIGA - Paso 3' })
  @ApiResponse({
    status: 200,
    description: 'Registro completado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Token inválido o expirado',
  })
  async completeRegistration(@Body() completeDto: CompleteRegistrationDto) {
    return this.authService.completeRegistration(completeDto);
  }

  @Post('resend-token/:documento')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reenviar token de verificación' })
  @ApiResponse({
    status: 200,
    description: 'Token reenviado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async resendToken(@Param('documento') documento: string) {
    return this.authService.resendVerificationToken(documento);
  }

  @Post('sync-topics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sincronizar temas de interés desde SIGA' })
  @ApiResponse({
    status: 200,
    description: 'Temas sincronizados exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Error al sincronizar',
  })
  async syncTopics(@Request() req) {
    return this.authService.syncUserTopicsFromSiga(req.user.sub);
  }

  @Get('search-by-documento/:documento')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar usuario por número de documento' })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async searchByDocumento(@Param('documento') documento: string) {
    return this.authService.searchByDocumento(documento);
  }

  @Post('create-judge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear usuario con rol JUEZ (solo ORGANIZADOR)' })
  @ApiResponse({
    status: 201,
    description: 'Juez creado exitosamente',
  })
  @ApiResponse({
    status: 409,
    description: 'Usuario ya existe',
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para crear jueces',
  })
  async createJudge(
    @Body()
    judgeData: {
      documento: string;
      email: string;
      nombres: string;
      apellidos: string;
      telefono?: string;
    },
  ) {
    return this.authService.createJudge(judgeData);
  }

  @Get('judges')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los jueces (solo ORGANIZADOR)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de jueces',
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para ver jueces',
  })
  async getAllJudges() {
    return this.authService.getAllJudges();
  }

  @Post('create-organizer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear usuario con rol ORGANIZADOR (solo ORGANIZADOR)' })
  @ApiResponse({
    status: 201,
    description: 'Organizador creado exitosamente',
  })
  @ApiResponse({
    status: 409,
    description: 'Usuario ya existe',
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para crear organizadores',
  })
  async createOrganizer(
    @Body()
    organizerData: {
      documento: string;
      email: string;
      nombres: string;
      apellidos: string;
      telefono?: string;
    },
  ) {
    return this.authService.createOrganizer(organizerData);
  }

  @Get('organizers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los organizadores (solo ORGANIZADOR)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de organizadores',
  })
  @ApiResponse({
    status: 403,
    description: 'No tiene permisos para ver organizadores',
  })
  async getAllOrganizers() {
    return this.authService.getAllOrganizers();
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar contraseña' })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'Contraseña actual incorrecta o no autorizado',
  })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(
      req.user.sub,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }
}
