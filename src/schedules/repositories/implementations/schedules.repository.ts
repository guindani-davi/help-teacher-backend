import { Inject, Injectable } from '@nestjs/common';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { Database } from '../../../database/types';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import { DayOfWeekEnum } from '../../enums/day-of-week.enum';
import { Schedule } from '../../models/schedule.model';
import { ISchedulesRepository } from '../i.schedules.repository';

@Injectable()
export class SchedulesRepository extends ISchedulesRepository {
  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
    @Inject(IHelpersService) helperService: IHelpersService,
  ) {
    super(databaseService, helperService);
  }

  public async create(
    dayOfWeek: DayOfWeekEnum,
    startTime: string,
    endTime: string,
    organizationId: string,
    userId: string,
  ): Promise<Schedule> {
    const data: Database['public']['Tables']['schedules']['Insert'] = {
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      organization_id: organizationId,
      created_by: userId,
    };

    const result = await this.databaseService
      .from('schedules')
      .insert(data)
      .select()
      .single();

    if (result.error) {
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  public async getById(
    scheduleId: string,
    organizationId: string,
  ): Promise<Schedule> {
    const result = await this.databaseService
      .from('schedules')
      .select()
      .eq('id', scheduleId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Schedule');
    }

    return this.mapToEntity(result.data);
  }

  public async getByOrganizationId(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Schedule>> {
    const { from, to } = pagination.getRange();

    const result = await this.databaseService
      .from('schedules')
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
    scheduleId: string,
    dayOfWeek: DayOfWeekEnum | undefined,
    startTime: string | undefined,
    endTime: string | undefined,
    userId: string,
  ): Promise<Schedule> {
    const data: Database['public']['Tables']['schedules']['Update'] = {
      updated_by: userId,
      updated_at: new Date().toISOString(),
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    };

    const result = await this.databaseService
      .from('schedules')
      .update(data)
      .eq('id', scheduleId)
      .eq('is_active', true)
      .select()
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Schedule');
    }

    return this.mapToEntity(result.data);
  }

  public async delete(scheduleId: string, userId: string): Promise<void> {
    const result = await this.databaseService
      .from('schedules')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scheduleId)
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
      .from('schedules')
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
      .from('schedules')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    return result.count ?? 0;
  }

  private mapToEntity(
    data: Database['public']['Tables']['schedules']['Row'],
  ): Schedule {
    const { createdAtDate, updatedAtDate } =
      this.helperService.parseEntitiesDates(data.created_at, data.updated_at);

    return new Schedule(
      data.id,
      data.day_of_week as DayOfWeekEnum,
      data.start_time,
      data.end_time,
      data.organization_id,
      data.is_active,
      data.created_by,
      data.updated_by,
      createdAtDate,
      updatedAtDate,
    );
  }
}
