import { Inject, Injectable } from '@nestjs/common';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { Database } from '../../../database/types';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import { EducationLevel } from '../../models/education-level.model';
import { IEducationLevelsRepository } from '../i.education-levels.repository';

@Injectable()
export class EducationLevelsRepository extends IEducationLevelsRepository {
  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
    @Inject(IHelpersService) helperService: IHelpersService,
  ) {
    super(databaseService, helperService);
  }

  public async create(
    name: string,
    organizationId: string,
    userId: string,
  ): Promise<EducationLevel> {
    const data: Database['public']['Tables']['education_levels']['Insert'] = {
      name,
      organization_id: organizationId,
      created_by: userId,
    };

    const result = await this.databaseService
      .from('education_levels')
      .insert(data)
      .select()
      .single();

    if (result.error) {
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  public async getById(
    educationLevelId: string,
    organizationId: string,
  ): Promise<EducationLevel> {
    const result = await this.databaseService
      .from('education_levels')
      .select()
      .eq('id', educationLevelId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Education level');
    }

    return this.mapToEntity(result.data);
  }

  public async getByOrganizationId(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<EducationLevel>> {
    const { from, to } = pagination.getRange();

    const result = await this.databaseService
      .from('education_levels')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .range(from, to);

    if (result.error) {
      throw new DatabaseException();
    }

    const items = result.data.map((row) => this.mapToEntity(row));
    return new PaginatedResponse(
      items,
      result.count ?? 0,
      pagination.page,
      pagination.limit,
    );
  }

  public async update(
    educationLevelId: string,
    name: string | undefined,
    userId: string,
  ): Promise<EducationLevel> {
    const data: Database['public']['Tables']['education_levels']['Update'] = {
      updated_by: userId,
      updated_at: new Date().toISOString(),
      name,
    };

    const result = await this.databaseService
      .from('education_levels')
      .update(data)
      .eq('id', educationLevelId)
      .eq('is_active', true)
      .select()
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Education level');
    }

    return this.mapToEntity(result.data);
  }

  public async delete(educationLevelId: string, userId: string): Promise<void> {
    const result = await this.databaseService
      .from('education_levels')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', educationLevelId)
      .eq('is_active', true);

    if (result.error) {
      throw new DatabaseException();
    }
  }

  public async deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    await this.databaseService
      .from('education_levels')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .eq('is_active', true);
  }

  public async countActiveByOrganizationId(
    organizationId: string,
  ): Promise<number> {
    const result = await this.databaseService
      .from('education_levels')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    return result.count ?? 0;
  }

  private mapToEntity(
    data: Database['public']['Tables']['education_levels']['Row'],
  ): EducationLevel {
    const { createdAtDate, updatedAtDate } =
      this.helperService.parseEntitiesDates(data.created_at, data.updated_at);

    return new EducationLevel(
      data.id,
      data.name,
      data.organization_id,
      data.is_active,
      data.created_by,
      data.updated_by,
      createdAtDate,
      updatedAtDate,
    );
  }
}
