import { DataSource } from 'typeorm';
import { createAdminUser } from './create-admin';
import { createTopics } from './create-topics';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './database.sqlite',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function runSeeds() {
  try {
    console.log('🌱 Starting database seeding...');

    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    await createAdminUser(AppDataSource);
    await createTopics(AppDataSource);

    await AppDataSource.destroy();
    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

runSeeds();
