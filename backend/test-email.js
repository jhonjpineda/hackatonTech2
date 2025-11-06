/**
 * Script de prueba para verificar configuración de email
 *
 * Uso: node test-email.js
 *
 * Este script prueba la conexión SMTP sin necesidad de levantar todo el backend
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailConfiguration() {
  console.log('\n==============================================');
  console.log('🧪 TEST DE CONFIGURACIÓN DE EMAIL');
  console.log('==============================================\n');

  // Leer configuración del .env
  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  };

  console.log('📋 Configuración detectada:');
  console.log(`   Host: ${config.host || '❌ NO CONFIGURADO'}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Secure: ${config.secure}`);
  console.log(`   User: ${config.auth.user || '❌ NO CONFIGURADO'}`);
  console.log(`   Password: ${config.auth.pass ? '✅ Configurada (oculta)' : '❌ NO CONFIGURADA'}\n`);

  // Verificar que estén configuradas
  if (!config.auth.user || !config.auth.pass) {
    console.error('❌ ERROR: EMAIL_USER o EMAIL_PASSWORD no están configurados en .env');
    console.log('\n💡 Solución:');
    console.log('   1. Abre el archivo backend/.env');
    console.log('   2. Configura EMAIL_USER y EMAIL_PASSWORD');
    console.log('   3. Consulta CONFIGURACION_EMAIL.md para más detalles\n');
    process.exit(1);
  }

  console.log('🔄 Creando transporter...');
  const transporter = nodemailer.createTransport(config);

  try {
    console.log('🔍 Verificando conexión con servidor SMTP...');
    await transporter.verify();
    console.log('✅ Conexión exitosa con el servidor SMTP!\n');

    // Preguntar si quiere enviar un email de prueba
    console.log('📧 ¿Deseas enviar un email de prueba? (Ctrl+C para cancelar)\n');

    // Esperar 3 segundos antes de enviar
    console.log('Enviando email de prueba en 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const testEmail = {
      from: process.env.EMAIL_FROM || config.auth.user,
      to: config.auth.user, // Enviar a sí mismo para probar
      subject: '🧪 Test de Configuración - HackatonTech2',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; }
            .success { background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
            .info { background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            code { background-color: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Configuración de Email Exitosa</h1>
            </div>
            <div class="content">
              <div class="success">
                <strong>✅ ¡Felicitaciones!</strong><br>
                Tu configuración de email está funcionando correctamente.
              </div>

              <h2>📋 Detalles de la Prueba</h2>
              <div class="info">
                <strong>Servidor SMTP:</strong> ${config.host}<br>
                <strong>Puerto:</strong> ${config.port}<br>
                <strong>Seguridad:</strong> ${config.secure ? 'SSL/TLS' : 'STARTTLS'}<br>
                <strong>Usuario:</strong> ${config.auth.user}<br>
                <strong>Fecha:</strong> ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
              </div>

              <h2>✅ Siguiente Paso</h2>
              <p>Ahora que el email está configurado, los usuarios recibirán:</p>
              <ul>
                <li>✉️ Códigos de verificación para registro</li>
                <li>🔔 Notificaciones de hackathones</li>
                <li>📧 Comunicaciones importantes del sistema</li>
              </ul>

              <h2>🚀 Para Probar el Registro Completo</h2>
              <ol>
                <li>Inicia el backend: <code>npm run start:dev</code></li>
                <li>Inicia el frontend: <code>npm run dev</code></li>
                <li>Ve a: <code>http://localhost:3000/register</code></li>
                <li>Ingresa un documento de SIGA válido</li>
                <li>Revisa tu correo para el código de verificación</li>
              </ol>
            </div>
            <div class="footer">
              <p>HackatonTech2 - Talento Tech<br>
              Este es un correo de prueba automático</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
🎉 ¡Configuración de Email Exitosa!

Tu configuración de email está funcionando correctamente.

Detalles de la Prueba:
- Servidor SMTP: ${config.host}
- Puerto: ${config.port}
- Seguridad: ${config.secure ? 'SSL/TLS' : 'STARTTLS'}
- Usuario: ${config.auth.user}
- Fecha: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}

Siguiente Paso:
Ahora los usuarios recibirán códigos de verificación y notificaciones.

Para probar el registro completo:
1. Inicia el backend: npm run start:dev
2. Inicia el frontend: npm run dev
3. Ve a: http://localhost:3000/register
4. Ingresa un documento de SIGA válido
5. Revisa tu correo para el código de verificación

HackatonTech2 - Talento Tech
      `
    };

    console.log(`📤 Enviando email de prueba a: ${testEmail.to}...`);
    const info = await transporter.sendMail(testEmail);

    console.log('\n✅ Email enviado exitosamente!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}\n`);

    console.log('==============================================');
    console.log('✅ CONFIGURACIÓN COMPLETADA EXITOSAMENTE');
    console.log('==============================================\n');
    console.log('📧 Revisa tu bandeja de entrada en:', config.auth.user);
    console.log('💡 Si no ves el email, revisa la carpeta de SPAM\n');

  } catch (error) {
    console.error('\n❌ ERROR al conectar con el servidor SMTP:\n');
    console.error(`   ${error.message}\n`);

    console.log('🔧 Posibles soluciones:\n');

    if (error.message.includes('Invalid login')) {
      console.log('   1. Verifica que EMAIL_USER y EMAIL_PASSWORD sean correctos');
      console.log('   2. Si usas Office 365/Gmail con 2FA, necesitas una App Password');
      console.log('   3. Consulta CONFIGURACION_EMAIL.md para obtener App Password\n');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      console.log('   1. Verifica que EMAIL_HOST sea correcto');
      console.log('   2. Prueba con puerto 465 y EMAIL_SECURE=true');
      console.log('   3. Verifica que tu firewall no bloquee el puerto\n');
    } else if (error.message.includes('EAUTH')) {
      console.log('   1. La autenticación falló');
      console.log('   2. Para Office 365: Habilita "SMTP AUTH"');
      console.log('   3. Para Gmail: Habilita "Acceso de apps menos seguras"\n');
    } else {
      console.log('   1. Revisa la configuración en backend/.env');
      console.log('   2. Consulta CONFIGURACION_EMAIL.md');
      console.log('   3. Contacta al administrador de TI de UCaldas\n');
    }

    process.exit(1);
  }
}

// Ejecutar test
testEmailConfiguration().catch(console.error);
