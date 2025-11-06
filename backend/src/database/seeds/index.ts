import { DataSource } from 'typeorm';
import { seedTopics } from './topics.seed';
import { seedUsers } from './users.seed';

/**
 * Función principal para ejecutar todos los seeds
 */
export async function runSeeds(dataSource: DataSource): Promise<void> {
  console.log('🌱 Iniciando seeds de base de datos...\n');

  try {
    // Orden de ejecución de seeds
    await seedTopics(dataSource);
    await seedUsers(dataSource);

    console.log('\n✅ Todos los seeds completados exitosamente!');
  } catch (error) {
    console.error('❌ Error ejecutando seeds:', error);
    throw error;
  }
}

/**
 * Script ejecutable
 */
if (require.main === module) {
  const { AppDataSource } = require('../../app-data-source');

  AppDataSource.initialize()
    .then(async (dataSource: DataSource) => {
      await runSeeds(dataSource);
      await dataSource.destroy();
      process.exit(0);
    })
    .catch((error: Error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
