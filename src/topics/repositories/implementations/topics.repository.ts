import { Inject, Injectable } from '@nestjs/common';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { Database } from '../../../database/types';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import { Topic } from '../../models/topic.model';
import { ITopicsRepository } from '../i.topics.repository';

@Injectable()
export class TopicsRepository extends ITopicsRepository {
  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
    @Inject(IHelpersService) helperService: IHelpersService,
  ) {
    super(databaseService, helperService);
  }

  public async create(
    name: string,
    subjectId: string,
    organizationId: string,
    userId: string,
  ): Promise<Topic> {
    const data: Database['public']['Tables']['topics']['Insert'] = {
      name,
      subject_id: subjectId,
      organization_id: organizationId,
      created_by: userId,
    };

    const result = await this.databaseService
      .from('topics')
      .insert(data)
      .select()
      .single();

    if (result.error) {
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  public async getById(
    topicId: string,
    organizationId: string,
  ): Promise<Topic> {
    const result = await this.databaseService
      .from('topics')
      .select()
      .eq('id', topicId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Topic');
    }

    return this.mapToEntity(result.data);
  }

  public async getByOrganizationId(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Topic>> {
    const { from, to } = pagination.getRange();

    const result = await this.databaseService
      .from('topics')
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
    topicId: string,
    name: string | undefined,
    subjectId: string | undefined,
    userId: string,
  ): Promise<Topic> {
    const data: Database['public']['Tables']['topics']['Update'] = {
      updated_by: userId,
      updated_at: new Date().toISOString(),
      name,
      subject_id: subjectId,
    };

    const result = await this.databaseService
      .from('topics')
      .update(data)
      .eq('id', topicId)
      .eq('is_active', true)
      .select()
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Topic');
    }

    return this.mapToEntity(result.data);
  }

  public async delete(topicId: string, userId: string): Promise<void> {
    const result = await this.databaseService
      .from('topics')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', topicId)
      .eq('is_active', true);

    if (result.error) {
      throw new DatabaseException();
    }
  }

  public async deactivateBySubjectId(
    subjectId: string,
    userId: string,
  ): Promise<void> {
    await this.databaseService
      .from('topics')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('subject_id', subjectId)
      .eq('is_active', true);
  }

  public async deactivateBySubjectIds(
    subjectIds: string[],
    userId: string,
  ): Promise<void> {
    if (subjectIds.length === 0) return;

    await this.databaseService
      .from('topics')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .in('subject_id', subjectIds)
      .eq('is_active', true);
  }

  public async deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    await this.databaseService
      .from('topics')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .eq('is_active', true);
  }

  public async getActiveIdsBySubjectId(subjectId: string): Promise<string[]> {
    const result = await this.databaseService
      .from('topics')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('is_active', true);

    return result.data?.map((row) => row.id) ?? [];
  }

  public async getActiveIdsBySubjectIds(
    subjectIds: string[],
  ): Promise<string[]> {
    if (subjectIds.length === 0) return [];

    const result = await this.databaseService
      .from('topics')
      .select('id')
      .in('subject_id', subjectIds)
      .eq('is_active', true);

    return result.data?.map((row) => row.id) ?? [];
  }

  public async countActiveByOrganizationId(
    organizationId: string,
  ): Promise<number> {
    const result = await this.databaseService
      .from('topics')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    return result.count ?? 0;
  }

  private mapToEntity(
    data: Database['public']['Tables']['topics']['Row'],
  ): Topic {
    const { createdAtDate, updatedAtDate } =
      this.helperService.parseEntitiesDates(data.created_at, data.updated_at);

    return new Topic(
      data.id,
      data.name,
      data.subject_id,
      data.organization_id,
      data.is_active,
      data.created_by,
      data.updated_by,
      createdAtDate,
      updatedAtDate,
    );
  }
}
