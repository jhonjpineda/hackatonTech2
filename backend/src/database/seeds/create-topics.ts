import { DataSource } from 'typeorm';
import { Topic, TopicType } from '../../entities/topic.entity';

export async function createTopics(dataSource: DataSource) {
  const topicRepository = dataSource.getRepository(Topic);

  // Verificar si ya existen temas
  const existingTopics = await topicRepository.count();
  if (existingTopics > 0) {
    console.log('Topics already exist');
    return;
  }

  // Crear los 6 temas predefinidos
  const topics = [
    {
      nombre: 'Programación',
      descripcion: 'Desarrollo de software, aplicaciones web y móviles',
      codigo: TopicType.PROGRAMACION,
      icono: 'code',
      colorHex: '#3B82F6',
      orden: 1,
      activo: true,
    },
    {
      nombre: 'Inteligencia Artificial',
      descripcion: 'Machine Learning, Deep Learning, NLP y Computer Vision',
      codigo: TopicType.INTELIGENCIA_ARTIFICIAL,
      icono: 'brain',
      colorHex: '#8B5CF6',
      orden: 2,
      activo: true,
    },
    {
      nombre: 'Análisis de Datos',
      descripcion: 'Big Data, Analytics, Visualización de datos',
      codigo: TopicType.ANALISIS_DATOS,
      icono: 'chart-bar',
      colorHex: '#10B981',
      orden: 3,
      activo: true,
    },
    {
      nombre: 'Arquitectura en la Nube',
      descripcion: 'Cloud Computing, AWS, Azure, Google Cloud',
      codigo: TopicType.ARQUITECTURA_NUBE,
      icono: 'cloud',
      colorHex: '#06B6D4',
      orden: 4,
      activo: true,
    },
    {
      nombre: 'Blockchain',
      descripcion: 'Tecnología blockchain, criptomonedas, contratos inteligentes',
      codigo: TopicType.BLOCKCHAIN,
      icono: 'link',
      colorHex: '#F59E0B',
      orden: 5,
      activo: true,
    },
    {
      nombre: 'Ciberseguridad',
      descripcion: 'Seguridad informática, ethical hacking, protección de datos',
      codigo: TopicType.CIBERSEGURIDAD,
      icono: 'shield-check',
      colorHex: '#EF4444',
      orden: 6,
      activo: true,
    },
  ];

  for (const topicData of topics) {
    const topic = topicRepository.create(topicData);
    await topicRepository.save(topic);
    console.log(`✅ Topic created: ${topic.nombre}`);
  }

  console.log('✅ All 6 topics created successfully');
}
