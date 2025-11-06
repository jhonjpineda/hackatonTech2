import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { UserSource } from '../../entities/user.entity';
import { Campista } from '../../entities/campista.entity';

/**
 * Seed inicial para Usuarios de prueba
 */
export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const campistaRepository = dataSource.getRepository(Campista);

  // Verificar si ya existen usuarios
  const count = await userRepository.count();
  if (count > 0) {
    console.log('✅ Usuarios ya existen, omitiendo seed...');
    return;
  }

  console.log('👥 Creando usuarios iniciales...');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Usuario Organizador
  const organizador = userRepository.create({
    documento: '1000000001',
    email: 'organizador@hackatontech.com',
    password: hashedPassword,
    nombres: 'Juan',
    apellidos: 'Organizador',
    telefono: '3001234567',
    role: UserRole.ORGANIZADOR,
    status: UserStatus.ACTIVE,
    source: UserSource.DIRECT,
    isPreRegistered: false,
    isFullyRegistered: true,
    mustChangePassword: false,
  });
  await userRepository.save(organizador);

  // Usuario Juez
  const juez = userRepository.create({
    documento: '1000000002',
    email: 'juez@hackatontech.com',
    password: hashedPassword,
    nombres: 'María',
    apellidos: 'Evaluadora',
    telefono: '3009876543',
    role: UserRole.JUEZ,
    status: UserStatus.ACTIVE,
    source: UserSource.DIRECT,
    isPreRegistered: false,
    isFullyRegistered: true,
    mustChangePassword: false,
  });
  await userRepository.save(juez);

  // Usuario Campista
  const campista = userRepository.create({
    documento: '1000000003',
    email: 'campista@hackatontech.com',
    password: hashedPassword,
    nombres: 'Carlos',
    apellidos: 'Participante',
    telefono: '3005551234',
    role: UserRole.CAMPISTA,
    status: UserStatus.ACTIVE,
    source: UserSource.DIRECT,
    isPreRegistered: false,
    isFullyRegistered: true,
    mustChangePassword: false,
  });
  await userRepository.save(campista);

  // Crear perfil de campista
  const campistaProfile = campistaRepository.create({
    userId: campista.id,
    biografia: 'Desarrollador apasionado por la tecnología',
  });
  await campistaRepository.save(campistaProfile);

  console.log('✅ 3 Usuarios creados exitosamente:');
  console.log('   - Organizador: organizador@hackatontech.com / Password123!');
  console.log('   - Juez: juez@hackatontech.com / Password123!');
  console.log('   - Campista: campista@hackatontech.com / Password123!');
}
