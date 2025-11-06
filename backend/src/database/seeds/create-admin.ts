import { DataSource } from 'typeorm';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';

export async function createAdminUser(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  // Check if admin already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@hackatontech2.com' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists');
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const admin = userRepository.create({
    documento: 'ADMIN001',
    email: 'admin@hackatontech2.com',
    password: hashedPassword,
    nombres: 'Administrador',
    apellidos: 'Sistema',
    telefono: '3001234567',
    role: UserRole.ORGANIZADOR,
    status: UserStatus.ACTIVE,
  });

  await userRepository.save(admin);

  console.log('✅ Admin user created successfully:');
  console.log('   Email: admin@hackatontech2.com');
  console.log('   Password: Admin123!');
  console.log('   Role: ORGANIZADOR');
}
