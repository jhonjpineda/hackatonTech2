import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import { SigaService } from './siga.service';
import { ValidateDocumentDto, SyncUsersDto } from './dto';

@Controller('siga')
export class SigaController {
  constructor(private readonly sigaService: SigaService) {}

  /**
   * POST /siga/validate
   * Valida un documento contra SIGA
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateDocument(@Body() validateDto: ValidateDocumentDto) {
    const result = await this.sigaService.validateDocument(validateDto);
    return {
      success: result.isValid,
      data: result.user,
      message: result.reason,
    };
  }

  /**
   * POST /siga/sync
   * Sincroniza usuarios desde SIGA (solo administradores)
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  // @UseGuards(AdminGuard) // TODO: Implementar guard de admin
  async syncUsers(@Body() syncDto: SyncUsersDto) {
    const result = await this.sigaService.syncUsers(syncDto);
    return {
      success: true,
      data: result,
      message: `Sincronización completada: ${result.synced} usuarios procesados`,
    };
  }

  /**
   * GET /siga/user/:documento
   * Obtiene información de un usuario desde SIGA
   */
  @Get('user/:documento')
  async getUserFromSiga(@Param('documento') documento: string) {
    const user = await this.sigaService.getUserFromSiga(documento);
    return {
      success: !!user,
      data: user,
      message: user ? 'Usuario encontrado' : 'Usuario no encontrado en SIGA',
    };
  }

  /**
   * POST /siga/generate-token
   * Genera un nuevo token de autenticación con SIGA
   */
  @Post('generate-token')
  @HttpCode(HttpStatus.OK)
  // @UseGuards(AdminGuard) // TODO: Implementar guard de admin
  async generateToken() {
    const token = await this.sigaService.generateToken();
    return {
      success: true,
      data: { token },
      message: 'Token generado exitosamente',
    };
  }
}
