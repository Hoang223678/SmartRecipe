import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  IngredientOptionDto,
  RecipeDetailDto,
  RecipePageDto,
  RecipeSortBy,
  RecipeStatus,
  RecipeTagDto,
  SearchRecipesQueryDto,
} from '@app/contracts';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeTag } from './entities/recipe-tag.entity';
import { toDetail, toSummary } from './recipe.mapper';
import { seedApprovedRecipes } from './recipe.seed';

@Injectable()
export class RecipeService implements OnModuleInit {
  constructor(
    @InjectRepository(Recipe) private readonly recipes: Repository<Recipe>,
    @InjectRepository(RecipeIngredient)
    private readonly ingredients: Repository<RecipeIngredient>,
    @InjectRepository(RecipeTag) private readonly tags: Repository<RecipeTag>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.recipes.count();
    if (count > 0) {
      return;
    }
    await this.recipes.save(this.recipes.create(seedApprovedRecipes()));
  }

  async search(query: SearchRecipesQueryDto): Promise<RecipePageDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.recipes
      .createQueryBuilder('r')
      .where('r.status = :status', { status: RecipeStatus.APPROVED })
      .andWhere('r.deleted_at IS NULL');

    if (query.q?.trim()) {
      qb.andWhere('r.title ILIKE :q', { q: `%${query.q.trim()}%` });
    }
    if (query.difficulty) {
      qb.andWhere('r.difficulty = :difficulty', {
        difficulty: query.difficulty,
      });
    }
    if (query.maxCookTime != null) {
      qb.andWhere('r.cook_time_minutes <= :maxCookTime', {
        maxCookTime: query.maxCookTime,
      });
    }
    if (query.tagIds?.length) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM recipe_tags rt
          WHERE rt.recipe_id = r.id AND rt.tag_id IN (:...tagIds)
        )`,
        { tagIds: query.tagIds },
      );
    }

    switch (query.sortBy) {
      case RecipeSortBy.RATING:
        qb.orderBy('r.avg_rating', 'DESC');
        break;
      case RecipeSortBy.POPULAR:
        qb.orderBy('r.favorite_count', 'DESC');
        break;
      case RecipeSortBy.COOK_TIME:
        qb.orderBy('r.cook_time_minutes', 'ASC');
        break;
      default:
        qb.orderBy('r.published_at', 'DESC');
    }

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: rows.map(toSummary),
      page,
      limit,
      total,
    };
  }

  async getById(id: string, viewerId?: string): Promise<RecipeDetailDto> {
    const recipe = await this.recipes.findOne({
      where: {
        id,
        status: RecipeStatus.APPROVED,
        deletedAt: IsNull(),
      },
      relations: ['ingredients', 'steps', 'tags'],
    });
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    return toDetail(recipe, viewerId);
  }

  async searchIngredients(q?: string): Promise<IngredientOptionDto[]> {
    const qb = this.ingredients
      .createQueryBuilder('ri')
      .innerJoin(Recipe, 'r', 'r.id = ri.recipe_id')
      .select('ri.ingredient_id', 'id')
      .addSelect('ri.ingredient_name', 'name')
      .distinct(true)
      .where('r.status = :status', { status: RecipeStatus.APPROVED })
      .andWhere('r.deleted_at IS NULL')
      .orderBy('ri.ingredient_name', 'ASC')
      .limit(20);

    if (q?.trim()) {
      qb.andWhere('ri.ingredient_name ILIKE :q', { q: `%${q.trim()}%` });
    }

    const rows = await qb.getRawMany<{ id: string; name: string }>();
    return rows.map((row) => ({ id: row.id, name: row.name }));
  }

  async listTags(): Promise<RecipeTagDto[]> {
    const rows = await this.tags
      .createQueryBuilder('rt')
      .innerJoin(Recipe, 'r', 'r.id = rt.recipe_id')
      .select('rt.tag_id', 'id')
      .addSelect('rt.tag_name', 'name')
      .distinct(true)
      .where('r.status = :status', { status: RecipeStatus.APPROVED })
      .andWhere('r.deleted_at IS NULL')
      .orderBy('rt.tag_name', 'ASC')
      .getRawMany<{ id: string; name: string }>();
    return rows.map((row) => ({ id: row.id, name: row.name }));
  }
}
