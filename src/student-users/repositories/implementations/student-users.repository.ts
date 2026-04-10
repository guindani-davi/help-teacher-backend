import { Inject, Injectable } from '@nestjs/common';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { EntityAlreadyExistsException } from '../../../common/exceptions/entity-already-exists.exception';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { PostgresErrorCode } from '../../../database/enums/postgres-error-code.enum';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { Database } from '../../../database/types';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import { Student } from '../../../students/models/student.model';
import { StudentUser } from '../../models/student-user.model';
import { IStudentUsersRepository } from '../i.student-users.repository';

@Injectable()
export class StudentUsersRepository extends IStudentUsersRepository {
  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
    @Inject(IHelpersService) helperService: IHelpersService,
  ) {
    super(databaseService, helperService);
  }

  public async create(
    studentId: string,
    userId: string,
    createdBy: string,
  ): Promise<StudentUser> {
    const data: Database['public']['Tables']['student_users']['Insert'] = {
      student_id: studentId,
      user_id: userId,
      created_by: createdBy,
    };

    const result = await this.databaseService
      .from('student_users')
      .insert(data)
      .select()
      .single();

    if (result.error) {
      if (result.error.code === PostgresErrorCode.UNIQUE_VIOLATION) {
        throw new EntityAlreadyExistsException('Student-user link');
      }
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  public async delete(studentUserId: string, userId: string): Promise<void> {
    const result = await this.databaseService
      .from('student_users')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentUserId)
      .eq('is_active', true);

    if (result.error) {
      throw new DatabaseException();
    }
  }

  public async getById(studentUserId: string): Promise<StudentUser> {
    const result = await this.databaseService
      .from('student_users')
      .select()
      .eq('id', studentUserId)
      .eq('is_active', true)
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Student-user link');
    }

    return this.mapToEntity(result.data);
  }

  public async countActiveForUser(
    userId: string,
    organizationId: string,
  ): Promise<number> {
    const result = await this.databaseService
      .from('student_users')
      .select('id, students!inner(organization_id)', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('students.organization_id', organizationId)
      .eq('students.is_active', true);

    return result.count ?? 0;
  }

  public async getStudentsByUserId(
    userId: string,
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Student>> {
    const { from, to } = pagination.getRange();

    const linkResult = await this.databaseService
      .from('student_users')
      .select('student_id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (linkResult.error) {
      throw new DatabaseException();
    }

    const studentIds = linkResult.data.map((row) => row.student_id);
    if (studentIds.length === 0) {
      return new PaginatedResponse([], 0, pagination.page, pagination.limit);
    }

    const result = await this.databaseService
      .from('students')
      .select('*', { count: 'exact' })
      .in('id', studentIds)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .range(from, to);

    if (result.error) {
      throw new DatabaseException();
    }

    const items = result.data.map((row) => this.mapToStudentEntity(row));
    return new PaginatedResponse(
      items,
      result.count ?? 0,
      pagination.page,
      pagination.limit,
    );
  }

  public async deactivateByStudentId(
    studentId: string,
    userId: string,
  ): Promise<void> {
    await this.databaseService
      .from('student_users')
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
    const studentIds = await this.databaseService
      .from('students')
      .select('id')
      .eq('organization_id', organizationId);

    const ids = studentIds.data?.map((row) => row.id) ?? [];
    if (ids.length === 0) return;

    await this.databaseService
      .from('student_users')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .in('student_id', ids)
      .eq('is_active', true);
  }

  public async getActiveUserIdsForStudent(
    studentId: string,
  ): Promise<string[]> {
    const result = await this.databaseService
      .from('student_users')
      .select('user_id')
      .eq('student_id', studentId)
      .eq('is_active', true);

    return result.data?.map((row) => row.user_id) ?? [];
  }

  private mapToEntity(
    data: Database['public']['Tables']['student_users']['Row'],
  ): StudentUser {
    const { createdAtDate, updatedAtDate } =
      this.helperService.parseEntitiesDates(data.created_at, data.updated_at);

    return new StudentUser(
      data.id,
      data.student_id,
      data.user_id,
      data.is_active,
      data.created_by,
      data.updated_by,
      createdAtDate,
      updatedAtDate,
    );
  }

  private mapToStudentEntity(
    data: Database['public']['Tables']['students']['Row'],
  ): Student {
    const { createdAtDate, updatedAtDate } =
      this.helperService.parseEntitiesDates(data.created_at, data.updated_at);

    return new Student(
      data.id,
      data.name,
      data.surname,
      data.organization_id,
      data.is_active,
      data.created_by,
      data.updated_by,
      createdAtDate,
      updatedAtDate,
    );
  }
}
