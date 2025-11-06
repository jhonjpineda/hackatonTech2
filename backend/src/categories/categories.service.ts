import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Hackathon } from '../entities/hackathon.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Hackathon)
    private hackathonRepository: Repository<Hackathon>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, userId: string) {
    // Verificar que el hackathon existe y el usuario es el organizador
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: createCategoryDto.hackathonId },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon no encontrado');
    }

    if (hackathon.organizadorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para agregar categorías a este hackathon',
      );
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async findAll() {
    return await this.categoryRepository.find({
      relations: ['hackathon', 'challenges'],
    });
  }

  async findByHackathon(hackathonId: string) {
    return await this.categoryRepository.find({
      where: { hackathonId },
      relations: ['challenges'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['hackathon', 'challenges'],
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string) {
    const category = await this.findOne(id);

    // Verificar que el usuario es el organizador del hackathon
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: category.hackathonId },
    });

    if (hackathon.organizadorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para editar esta categoría',
      );
    }

    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async remove(id: string, userId: string) {
    const category = await this.findOne(id);

    // Verificar que el usuario es el organizador del hackathon
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: category.hackathonId },
    });

    if (hackathon.organizadorId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta categoría',
      );
    }

    await this.categoryRepository.remove(category);
  }
}
