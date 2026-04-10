import { Inject, Injectable } from '@nestjs/common';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { Database } from '../../../database/types';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import { Registration } from '../../models/registration.model';
import { IRegistrationsRepository } from '../i.registrations.repository';

@Injectable()
export class RegistrationsRepository extends IRegistrationsRepository {
  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
    @Inject(IHelpersService) helperService: IHelpersService,
  ) {
    super(databaseService, helperService);
  }

  public async create(
    studentId: string,
    schoolId: string,
    gradeLevelId: string,
    organizationId: string,
    startDate: string,
    endDate: string | undefined,
    userId: string,
  ): Promise<Registration> {
    const data: Database['public']['Tables']['registrations']['Insert'] = {
      student_id: studentId,
      school_id: schoolId,
      grade_level_id: gradeLevelId,
      organization_id: organizationId,
      start_date: startDate,
      end_date: endDate,
      created_by: userId,
    };

    const result = await this.databaseService
      .from('registrations')
      .insert(data)
      .select()
      .single();

    if (result.error) {
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  public async getById(
    registrationId: string,
    organizationId: string,
  ): Promise<Registration> {
    const result = await this.databaseService
      .from('registrations')
      .select()
      .eq('id', registrationId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Registration');
    }

    return this.mapToEntity(result.data);
  }

  public async getByOrganizationId(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Registration>> {
    const { from, to } = pagination.getRange();

    const result = await this.databaseService
      .from('registrations')
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
    registrationId: string,
    studentId: string | undefined,
    schoolId: string | undefined,
    gradeLevelId: string | undefined,
    startDate: string | undefined,
    endDate: string | null | undefined,
    userId: string,
  ): Promise<Registration> {
    const data: Database['public']['Tables']['registrations']['Update'] = {
      updated_by: userId,
      updated_at: new Date().toISOString(),
      student_id: studentId,
      school_id: schoolId,
      grade_level_id: gradeLevelId,
      start_date: startDate,
      end_date: endDate,
    };

    const result = await this.databaseService
      .from('registrations')
      .update(data)
      .eq('id', registrationId)
      .eq('is_active', true)
      .select()
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Registration');
    }

    return this.mapToEntity(result.data);
  }

  public async delete(registrationId: string, userId: string): Promise<void> {
    const result = await this.databaseService
      .from('registrations')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', registrationId)
      .eq('is_active', true);

    if (result.error) {
      throw new DatabaseException();
    }
  }

  public async deactivateByStudentId(
    studentId: string,
    userId: string,
  ): Promise<void> {
    await this.databaseService
      .from('registrations')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', studentId)
      .eq('is_active', true);
  }

  public async deactivateBySchoolId(
    schoolId: string,
    userId: string,
  ): Promise<void> {
    await this.databaseService
      .from('registrations')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('school_id', schoolId)
      .eq('is_active', true);
  }

  public async deactivateByGradeLevelId(
    gradeLevelId: string,
    userId: string,
  ): Promise<void> {
    await this.databaseService
      .from('registrations')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('grade_level_id', gradeLevelId)
      .eq('is_active', true);
  }

  public async deactivateByGradeLevelIds(
    gradeLevelIds: string[],
    userId: string,
  ): Promise<void> {
    if (gradeLevelIds.length === 0) return;

    await this.databaseService
      .from('registrations')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .in('grade_level_id', gradeLevelIds)
      .eq('is_active', true);
  }

  public async deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    await this.databaseService
      .from('registrations')
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
      .from('registrations')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    return result.count ?? 0;
  }

  public async closeCurrentRegistration(
    studentId: string,
    organizationId: string,
    endDate: string,
    userId: string,
  ): Promise<void> {
    await this.databaseService
      .from('registrations')
      .update({
        end_date: endDate,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', studentId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .is('end_date', null);
  }

  public async hasOverlapping(
    studentId: string,
    organizationId: string,
    startDate: string,
    endDate: string | null | undefined,
    excludeRegistrationId?: string,
  ): Promise<boolean> {
    let query = this.databaseService
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .lte('start_date', endDate ?? '9999-12-31')
      .or(`end_date.gte.${startDate},end_date.is.null`);

    if (excludeRegistrationId) {
      query = query.neq('id', excludeRegistrationId);
    }

    const result = await query;

    return (result.count ?? 0) > 0;
  }

  private mapToEntity(
    data: Database['public']['Tables']['registrations']['Row'],
  ): Registration {
    const { createdAtDate, updatedAtDate } =
      this.helperService.parseEntitiesDates(data.created_at, data.updated_at);

    return new Registration(
      data.id,
      data.student_id,
      data.school_id,
      data.grade_level_id,
      data.organization_id,
      data.start_date,
      data.end_date,
      data.is_active,
      data.created_by,
      data.updated_by,
      createdAtDate,
      updatedAtDate,
    );
  }
}
