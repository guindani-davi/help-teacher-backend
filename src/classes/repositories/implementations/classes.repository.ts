import { Inject, Injectable } from '@nestjs/common';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { Database } from '../../../database/types';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import { Class } from '../../models/class.model';
import { IClassesRepository } from '../i.classes.repository';

@Injectable()
export class ClassesRepository extends IClassesRepository {
  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
    @Inject(IHelpersService) helperService: IHelpersService,
  ) {
    super(databaseService, helperService);
  }

  public async create(
    scheduleId: string,
    studentId: string,
    teacherId: string,
    date: string,
    organizationId: string,
    userId: string,
  ): Promise<Class> {
    const data: Database['public']['Tables']['classes']['Insert'] = {
      schedule_id: scheduleId,
      student_id: studentId,
      teacher_id: teacherId,
      date,
      organization_id: organizationId,
      created_by: userId,
    };

    const result = await this.databaseService
      .from('classes')
      .insert(data)
      .select()
      .single();

    if (result.error) {
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  public async getById(
    classId: string,
    organizationId: string,
  ): Promise<Class> {
    const result = await this.databaseService
      .from('classes')
      .select()
      .eq('id', classId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Class');
    }

    return this.mapToEntity(result.data);
  }

  public async getByOrganizationId(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Class>> {
    const { from, to } = pagination.getRange();

    const result = await this.databaseService
      .from('classes')
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
    classId: string,
    scheduleId: string | undefined,
    studentId: string | undefined,
    teacherId: string | undefined,
    date: string | undefined,
    userId: string,
  ): Promise<Class> {
    const data: Database['public']['Tables']['classes']['Update'] = {
      updated_by: userId,
      updated_at: new Date().toISOString(),
      schedule_id: scheduleId,
      student_id: studentId,
      teacher_id: teacherId,
      date,
    };

    const result = await this.databaseService
      .from('classes')
      .update(data)
      .eq('id', classId)
      .eq('is_active', true)
      .select()
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Class');
    }

    return this.mapToEntity(result.data);
  }

  public async delete(classId: string, userId: string): Promise<void> {
    const result = await this.databaseService
      .from('classes')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', classId)
      .eq('is_active', true);

    if (result.error) {
      throw new DatabaseException();
    }
  }

  public async deactivateByScheduleId(
    scheduleId: string,
    userId: string,
  ): Promise<void> {
    await this.databaseService
      .from('classes')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('schedule_id', scheduleId)
      .eq('is_active', true);
  }

  public async deactivateByStudentId(
    studentId: string,
    userId: string,
  ): Promise<void> {
    await this.databaseService
      .from('classes')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', studentId)
      .eq('is_active', true);
  }

  public async deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    await this.databaseService
      .from('classes')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .eq('is_active', true);
  }

  public async getActiveIdsByScheduleId(scheduleId: string): Promise<string[]> {
    const result = await this.databaseService
      .from('classes')
      .select('id')
      .eq('schedule_id', scheduleId)
      .eq('is_active', true);

    return result.data?.map((row) => row.id) ?? [];
  }

  public async getActiveIdsByStudentId(studentId: string): Promise<string[]> {
    const result = await this.databaseService
      .from('classes')
      .select('id')
      .eq('student_id', studentId)
      .eq('is_active', true);

    return result.data?.map((row) => row.id) ?? [];
  }

  public async countActiveByOrganizationId(
    organizationId: string,
  ): Promise<number> {
    const result = await this.databaseService
      .from('classes')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    return result.count ?? 0;
  }

  private mapToEntity(
    data: Database['public']['Tables']['classes']['Row'],
  ): Class {
    const { createdAtDate, updatedAtDate } =
      this.helperService.parseEntitiesDates(data.created_at, data.updated_at);

    return new Class(
      data.id,
      data.schedule_id,
      data.student_id,
      data.teacher_id,
      data.date,
      data.organization_id,
      data.is_active,
      data.created_by,
      data.updated_by,
      createdAtDate,
      updatedAtDate,
    );
  }
}
