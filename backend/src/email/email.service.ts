import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig = {
      host: this.configService.get<string>('EMAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('EMAIL_PORT', 587),
      secure: this.configService.get<boolean>('EMAIL_SECURE', false),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: this.configService.get<boolean>('EMAIL_TLS_REJECT_UNAUTHORIZED', true),
      },
    };

    // Si no hay configuración de email, usar modo mock
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      this.logger.warn(
        'Configuración de email no encontrada. Usando modo MOCK. Configure EMAIL_USER y EMAIL_PASSWORD en .env',
      );
      this.transporter = null;
    } else {
      this.transporter = nodemailer.createTransport(emailConfig);
    }
  }

  /**
   * Envía un email genérico
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.warn(
          `[MOCK EMAIL] To: ${options.to} | Subject: ${options.subject}`,
        );
        this.logger.warn(`[MOCK EMAIL] Content: ${options.text || options.html}`);
        return true;
      }

      const mailOptions = {
        from: this.configService.get<string>(
          'EMAIL_FROM',
          'noreply@hackatontech.com',
        ),
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email enviado exitosamente a ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error enviando email a ${options.to}:`, error);
      return false;
    }
  }

  /**
   * Envía email de verificación con token
   */
  async sendVerificationEmail(
    email: string,
    token: string,
    userName: string,
  ): Promise<boolean> {
    // En modo MOCK, mostrar el token claramente en los logs
    if (!this.transporter) {
      this.logger.warn(`========================================`);
      this.logger.warn(`[MOCK EMAIL] CÓDIGO DE VERIFICACIÓN`);
      this.logger.warn(`Usuario: ${userName}`);
      this.logger.warn(`Email: ${email}`);
      this.logger.warn(`CÓDIGO: ${token}`);
      this.logger.warn(`========================================`);
    }

    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/auth/verify?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .token {
            background-color: #e8f5e9;
            padding: 15px;
            border-left: 4px solid #4CAF50;
            font-family: monospace;
            font-size: 18px;
            letter-spacing: 2px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verificación de Cuenta - HackatonTech2</h1>
          </div>
          <div class="content">
            <h2>Hola ${userName},</h2>
            <p>Gracias por registrarte en HackatonTech2. Para completar tu registro, necesitamos verificar tu dirección de correo electrónico.</p>

            <p><strong>Tu código de verificación es:</strong></p>
            <div class="token">${token}</div>

            <p>O puedes hacer clic en el siguiente enlace:</p>
            <a href="${verificationUrl}" class="button">Verificar mi cuenta</a>

            <p><small>Este código expirará en 24 horas.</small></p>

            <p>Si no solicitaste este registro, puedes ignorar este correo.</p>
          </div>
          <div class="footer">
            <p>HackatonTech2 - Talento Tech<br>
            Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hola ${userName},

Gracias por registrarte en HackatonTech2.

Tu código de verificación es: ${token}

O puedes verificar tu cuenta en: ${verificationUrl}

Este código expirará en 24 horas.

Si no solicitaste este registro, puedes ignorar este correo.

HackatonTech2 - Talento Tech
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Verificación de cuenta - HackatonTech2',
      text,
      html,
    });
  }

  /**
   * Envía email de bienvenida
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    const loginUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/login`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2196F3;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a HackatonTech2!</h1>
          </div>
          <div class="content">
            <h2>Hola ${userName},</h2>
            <p>Tu cuenta ha sido verificada exitosamente. ¡Estás listo para participar en nuestras hackathones!</p>

            <p>Ahora puedes:</p>
            <ul>
              <li>Inscribirte en hackathones disponibles</li>
              <li>Crear o unirte a equipos</li>
              <li>Participar en retos tecnológicos</li>
              <li>Competir y ganar premios</li>
            </ul>

            <a href="${loginUrl}" class="button">Iniciar Sesión</a>

            <p>¡Buena suerte en tus hackathones!</p>
          </div>
          <div class="footer">
            <p>HackatonTech2 - Talento Tech<br>
            Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
¡Bienvenido a HackatonTech2!

Hola ${userName},

Tu cuenta ha sido verificada exitosamente. ¡Estás listo para participar en nuestras hackathones!

Ahora puedes:
- Inscribirte en hackathones disponibles
- Crear o unirte a equipos
- Participar en retos tecnológicos
- Competir y ganar premios

Inicia sesión en: ${loginUrl}

¡Buena suerte en tus hackathones!

HackatonTech2 - Talento Tech
    `;

    return await this.sendEmail({
      to: email,
      subject: '¡Bienvenido a HackatonTech2!',
      text,
      html,
    });
  }

  /**
   * Envía email de contraseña temporal
   */
  async sendTemporaryPasswordEmail(
    email: string,
    userName: string,
    temporaryPassword: string,
  ): Promise<boolean> {
    const loginUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/login`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #FF9800;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .password {
            background-color: #fff3e0;
            padding: 15px;
            border-left: 4px solid #FF9800;
            font-family: monospace;
            font-size: 18px;
            letter-spacing: 2px;
          }
          .warning {
            background-color: #ffebee;
            padding: 10px;
            border-left: 4px solid #f44336;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Credenciales de Acceso - HackatonTech2</h1>
          </div>
          <div class="content">
            <h2>Hola ${userName},</h2>
            <p>Tu cuenta ha sido creada exitosamente. A continuación encontrarás tus credenciales de acceso:</p>

            <p><strong>Usuario:</strong> ${email}</p>
            <p><strong>Contraseña temporal:</strong></p>
            <div class="password">${temporaryPassword}</div>

            <div class="warning">
              <strong>⚠️ Importante:</strong> Por tu seguridad, deberás cambiar esta contraseña en tu primer inicio de sesión.
            </div>

            <a href="${loginUrl}" class="button">Iniciar Sesión</a>

            <p>Si no solicitaste esta cuenta, por favor contacta con el administrador.</p>
          </div>
          <div class="footer">
            <p>HackatonTech2 - Talento Tech<br>
            Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Credenciales de Acceso - HackatonTech2

Hola ${userName},

Tu cuenta ha sido creada exitosamente.

Usuario: ${email}
Contraseña temporal: ${temporaryPassword}

⚠️ IMPORTANTE: Por tu seguridad, deberás cambiar esta contraseña en tu primer inicio de sesión.

Inicia sesión en: ${loginUrl}

Si no solicitaste esta cuenta, por favor contacta con el administrador.

HackatonTech2 - Talento Tech
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Credenciales de acceso - HackatonTech2',
      text,
      html,
    });
  }

  /**
   * Envía email de creación de cuenta de juez
   */
  async sendJudgeCreationEmail(
    email: string,
    userName: string,
    documento: string,
    temporaryPassword: string,
  ): Promise<boolean> {
    const loginUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/login`;

    // En modo MOCK, mostrar las credenciales claramente en los logs
    if (!this.transporter) {
      this.logger.warn(`========================================`);
      this.logger.warn(`[MOCK EMAIL] CREDENCIALES DE JUEZ`);
      this.logger.warn(`Usuario: ${userName}`);
      this.logger.warn(`Email: ${email}`);
      this.logger.warn(`Documento: ${documento}`);
      this.logger.warn(`Contraseña Temporal: ${temporaryPassword}`);
      this.logger.warn(`========================================`);
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #9C27B0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #9C27B0;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .credentials {
            background-color: #f3e5f5;
            padding: 15px;
            border-left: 4px solid #9C27B0;
            margin: 15px 0;
          }
          .password {
            background-color: #fff3e0;
            padding: 15px;
            border-left: 4px solid #FF9800;
            font-family: monospace;
            font-size: 18px;
            letter-spacing: 2px;
          }
          .warning {
            background-color: #ffebee;
            padding: 10px;
            border-left: 4px solid #f44336;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenido como Juez - HackatonTech2</h1>
          </div>
          <div class="content">
            <h2>Hola ${userName},</h2>
            <p>Has sido designado como <strong>Juez</strong> en la plataforma HackatonTech2. Tu rol será evaluar y calificar las entregas de los equipos participantes en las hackathones asignadas.</p>

            <div class="credentials">
              <h3>Credenciales de Acceso:</h3>
              <p><strong>Documento de ingreso:</strong> ${documento}</p>
              <p><strong>Contraseña temporal:</strong></p>
              <div class="password">${temporaryPassword}</div>
            </div>

            <div class="warning">
              <strong>⚠️ Importante:</strong> Por seguridad, deberás cambiar esta contraseña en tu primer inicio de sesión.
            </div>

            <h3>Tus responsabilidades como Juez:</h3>
            <ul>
              <li>Evaluar las entregas de los equipos asignados</li>
              <li>Proporcionar retroalimentación constructiva</li>
              <li>Calificar de manera objetiva y justa</li>
              <li>Respetar los criterios de evaluación establecidos</li>
            </ul>

            <a href="${loginUrl}" class="button">Iniciar Sesión</a>

            <p>Si tienes alguna duda, contacta con el administrador.</p>
          </div>
          <div class="footer">
            <p>HackatonTech2 - Talento Tech<br>
            Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Bienvenido como Juez - HackatonTech2

Hola ${userName},

Has sido designado como Juez en la plataforma HackatonTech2.

CREDENCIALES DE ACCESO:
Documento de ingreso: ${documento}
Contraseña temporal: ${temporaryPassword}

⚠️ IMPORTANTE: Por seguridad, deberás cambiar esta contraseña en tu primer inicio de sesión.

TUS RESPONSABILIDADES COMO JUEZ:
- Evaluar las entregas de los equipos asignados
- Proporcionar retroalimentación constructiva
- Calificar de manera objetiva y justa
- Respetar los criterios de evaluación establecidos

Inicia sesión en: ${loginUrl}

Si tienes alguna duda, contacta con el administrador.

HackatonTech2 - Talento Tech
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Bienvenido como Juez - HackatonTech2',
      text,
      html,
    });
  }

  async sendOrganizerCreationEmail(
    email: string,
    userName: string,
    documento: string,
    temporaryPassword: string,
  ): Promise<boolean> {
    const loginUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/login`;

    // En modo MOCK, mostrar las credenciales claramente en los logs
    if (!this.transporter) {
      this.logger.warn(`========================================`);
      this.logger.warn(`[MOCK EMAIL] CREDENCIALES DE ORGANIZADOR`);
      this.logger.warn(`Usuario: ${userName}`);
      this.logger.warn(`Email: ${email}`);
      this.logger.warn(`Documento: ${documento}`);
      this.logger.warn(`Contraseña Temporal: ${temporaryPassword}`);
      this.logger.warn(`========================================`);
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #b64cff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #b64cff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .credentials {
            background-color: #f3e5f5;
            padding: 15px;
            border-left: 4px solid #b64cff;
            margin: 15px 0;
          }
          .password {
            background-color: #fff3e0;
            padding: 15px;
            border-left: 4px solid #FF9800;
            font-family: monospace;
            font-size: 18px;
            letter-spacing: 2px;
          }
          .warning {
            background-color: #ffebee;
            padding: 10px;
            border-left: 4px solid #f44336;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenido como Organizador - HackatonTech2</h1>
          </div>
          <div class="content">
            <h2>Hola ${userName},</h2>
            <p>Has sido designado como <strong>Organizador</strong> en la plataforma HackatonTech2. Tu rol será administrar hackathones, crear retos, asignar jueces y gestionar el sistema.</p>

            <div class="credentials">
              <h3>Credenciales de Acceso:</h3>
              <p><strong>Documento de ingreso:</strong> ${documento}</p>
              <p><strong>Contraseña temporal:</strong></p>
              <div class="password">${temporaryPassword}</div>
            </div>

            <div class="warning">
              <strong>⚠️ Importante:</strong> Por seguridad, deberás cambiar esta contraseña en tu primer inicio de sesión.
            </div>

            <h3>Tus responsabilidades como Organizador:</h3>
            <ul>
              <li>Crear y gestionar hackathones</li>
              <li>Crear retos y definir criterios de evaluación</li>
              <li>Asignar jueces a hackathones</li>
              <li>Gestionar equipos y categorías</li>
              <li>Supervisar entregas y evaluaciones</li>
            </ul>

            <a href="${loginUrl}" class="button">Iniciar Sesión</a>

            <p>Si tienes alguna duda, contacta con el administrador principal.</p>
          </div>
          <div class="footer">
            <p>HackatonTech2 - Talento Tech<br>
            Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Bienvenido como Organizador - HackatonTech2

Hola ${userName},

Has sido designado como Organizador en la plataforma HackatonTech2.

CREDENCIALES DE ACCESO:
Documento de ingreso: ${documento}
Contraseña temporal: ${temporaryPassword}

⚠️ IMPORTANTE: Por seguridad, deberás cambiar esta contraseña en tu primer inicio de sesión.

TUS RESPONSABILIDADES COMO ORGANIZADOR:
- Crear y gestionar hackathones
- Crear retos y definir criterios de evaluación
- Asignar jueces a hackathones
- Gestionar equipos y categorías
- Supervisar entregas y evaluaciones

Inicia sesión en: ${loginUrl}

Si tienes alguna duda, contacta con el administrador principal.

HackatonTech2 - Talento Tech
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Bienvenido como Organizador - HackatonTech2',
      text,
      html,
    });
  }
}
 
