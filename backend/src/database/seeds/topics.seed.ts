import { DataSource } from 'typeorm';
import { Topic, TopicType } from '../../entities/topic.entity';

/**
 * Seed inicial para Topics (Programas de Interés)
 * Estos son los 6 programas principales de TalentoTech
 */
export async function seedTopics(dataSource: DataSource): Promise<void> {
  const topicRepository = dataSource.getRepository(Topic);

  // Verificar si ya existen topics
  const count = await topicRepository.count();
  if (count > 0) {
    console.log('✅ Topics ya existen, omitiendo seed...');
    return;
  }

  console.log('📝 Creando Topics iniciales...');

  const topics = [
    {
      nombre: 'Programación',
      descripcion: 'Desarrollo de software, programación web y aplicaciones',
      codigo: TopicType.PROGRAMACION,
      icono: '💻',
      colorHex: '#3B82F6',
      orden: 1,
      activo: true,
    },
    {
      nombre: 'Inteligencia Artificial',
      descripcion: 'Machine Learning, Deep Learning y AI',
      codigo: TopicType.INTELIGENCIA_ARTIFICIAL,
      icono: '🤖',
      colorHex: '#8B5CF6',
      orden: 2,
      activo: true,
    },
    {
      nombre: 'Análisis de Datos',
      descripcion: 'Big Data, Analytics y Data Science',
      codigo: TopicType.ANALISIS_DATOS,
      icono: '📊',
      colorHex: '#10B981',
      orden: 3,
      activo: true,
    },
    {
      nombre: 'Arquitectura en la Nube',
      descripcion: 'Cloud Computing, AWS, Azure, GCP',
      codigo: TopicType.ARQUITECTURA_NUBE,
      icono: '☁️',
      colorHex: '#06B6D4',
      orden: 4,
      activo: true,
    },
    {
      nombre: 'Blockchain',
      descripcion: 'Tecnología Blockchain, Smart Contracts y Web3',
      codigo: TopicType.BLOCKCHAIN,
      icono: '⛓️',
      colorHex: '#F59E0B',
      orden: 5,
      activo: true,
    },
    {
      nombre: 'Ciberseguridad',
      descripcion: 'Seguridad informática, hacking ético y protección de datos',
      codigo: TopicType.CIBERSEGURIDAD,
      icono: '🔒',
      colorHex: '#EF4444',
      orden: 6,
      activo: true,
    },
  ];

  await topicRepository.save(topics);

  console.log(`✅ ${topics.length} Topics creados exitosamente`);
}
