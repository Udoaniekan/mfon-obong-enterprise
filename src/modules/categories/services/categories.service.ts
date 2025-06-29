import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryDocument> {
    try {
      const category = new this.categoryModel(createCategoryDto);
      return await category.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Category already exists');
      }
      throw error;
    }
  }

  async findAll(includeInactive = false): Promise<CategoryDocument[]> {
    const query = includeInactive ? {} : { isActive: true };
    return this.categoryModel.find(query).exec();
  }
  async findById(id: string): Promise<CategoryDocument> {
    try {
      // Check if we've received a stringified object instead of a simple ID
      if (id.includes('ObjectId') && id.includes('_id')) {
        // Extract the ObjectId from the string
        const match = id.match(/ObjectId\('([0-9a-fA-F]{24})'\)/);
        if (match && match[1]) {
          // Use the extracted ID
          id = match[1];
        }
      }
      
      const category = await this.categoryModel.findById(id);
      
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      return category;
    } catch (error) {
      console.error('Error finding category:', error);
      throw new NotFoundException(`Category lookup failed: ${error.message}`);
    }
  }

  async findByName(name: string): Promise<CategoryDocument | null> {
    return this.categoryModel.findOne({ name }).exec();
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDocument> {
    const category = await this.findById(id);
    
    try {
      Object.assign(category, updateCategoryDto);
      return await category.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Category name already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const category = await this.findById(id);
    category.isActive = false;
    await category.save();
  }

  async validateCategoryAndUnit(categoryId: string, unit: string): Promise<boolean> {
    const category = await this.findById(categoryId);
    return category.units.includes(unit);
  }
}
