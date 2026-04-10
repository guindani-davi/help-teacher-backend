import { Inject, Injectable } from '@nestjs/common';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { Database } from '../../../database/types';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import { School } from '../../models/school.model';
import { ISchoolsRepository } from '../i.schools.repository';

@Injectable()
export class SchoolsRepository extends ISchoolsRepository {
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
  ): Promise<School> {
    const data: Database['public']['Tables']['schools']['Insert'] = {
      name,
      organization_id: organizationId,
      created_by: userId,
    };

    const result = await this.databaseService
      .from('schools')
      .insert(data)
      .select()
      .single();

    if (result.error) {
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  public async getById(
    schoolId: string,
    organizationId: string,
  ): Promise<School> {
    const result = await this.databaseService
      .from('schools')
      .select()
      .eq('id', schoolId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('School');
    }

    return this.mapToEntity(result.data);
  }

  public async getByOrganizationId(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<School>> {
    const { from, to } = pagination.getRange();

    const result = await this.databaseService
      .from('schools')
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
    schoolId: string,
    name: string | undefined,
    userId: string,
  ): Promise<School> {
    const data: Database['public']['Tables']['schools']['Update'] = {
      updated_by: userId,
      updated_at: new Date().toISOString(),
      name,
    };

    const result = await this.databaseService
      .from('schools')
      .update(data)
      .eq('id', schoolId)
      .eq('is_active', true)
      .select()
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('School');
    }

    return this.mapToEntity(result.data);
  }

  public async delete(schoolId: string, userId: string): Promise<void> {
    const result = await this.databaseService
      .from('schools')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', schoolId)
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
      .from('schools')
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
      .from('schools')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    return result.count ?? 0;
  }

  private mapToEntity(
    data: Database['public']['Tables']['schools']['Row'],
  ): School {
    const { createdAtDate, updatedAtDate } =
      this.helperService.parseEntitiesDates(data.created_at, data.updated_at);

    return new School(
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
