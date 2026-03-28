import { Inject, Injectable } from '@nestjs/common';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { Database } from '../../../database/types';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import { Student } from '../../models/student.model';
import { IStudentsRepository } from '../i.students.repository';

@Injectable()
export class StudentsRepository extends IStudentsRepository {
  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
    @Inject(IHelpersService) helperService: IHelpersService,
  ) {
    super(databaseService, helperService);
  }

  public async create(
    name: string,
    surname: string,
    organizationId: string,
    userId: string,
  ): Promise<Student> {
    const data: Database['public']['Tables']['students']['Insert'] = {
      name,
      surname,
      organization_id: organizationId,
      created_by: userId,
    };

    const result = await this.databaseService
      .from('students')
      .insert(data)
      .select()
      .single();

    if (result.error) {
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  public async getById(
    studentId: string,
    organizationId: string,
  ): Promise<Student> {
    const result = await this.databaseService
      .from('students')
      .select()
      .eq('id', studentId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Student');
    }

    return this.mapToEntity(result.data);
  }

  public async getByOrganizationId(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Student>> {
    const { from, to } = pagination.getRange();

    const result = await this.databaseService
      .from('students')
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
    studentId: string,
    name: string | undefined,
    surname: string | undefined,
    userId: string,
  ): Promise<Student> {
    const data: Database['public']['Tables']['students']['Update'] = {
      updated_by: userId,
      updated_at: new Date().toISOString(),
      name,
      surname,
    };

    const result = await this.databaseService
      .from('students')
      .update(data)
      .eq('id', studentId)
      .eq('is_active', true)
      .select()
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Student');
    }

    return this.mapToEntity(result.data);
  }

  public async delete(studentId: string, userId: string): Promise<void> {
    const result = await this.databaseService
      .from('students')
      .update({
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId)
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
      .from('students')
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
      .from('students')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    return result.count ?? 0;
  }

  private mapToEntity(
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
