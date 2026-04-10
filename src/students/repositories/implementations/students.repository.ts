import { Inject, Injectable } from '@nestjs/common';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { Database } from '../../../database/types';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import { ClassSummary } from '../../models/class-summary.model';
import { RegistrationDetail } from '../../models/registration-detail.model';
import { StudentDetail } from '../../models/student-detail.model';
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

  public async getDetailById(
    studentId: string,
    organizationId: string,
  ): Promise<StudentDetail> {
    const studentResult = await this.databaseService
      .from('students')
      .select('id, name, surname')
      .eq('id', studentId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (!studentResult.data) {
      throw new EntityNotFoundException('Student');
    }

    const registrationsResult = await this.databaseService
      .from('registrations')
      .select(
        `
        id, start_date, end_date,
        schools(id, name),
        grade_levels(id, name,
          education_levels(id, name)
        )
      `,
      )
      .eq('student_id', studentId)
      .eq('is_active', true)
      .order('start_date', { ascending: false });

    const classesResult = await this.databaseService
      .from('classes')
      .select(
        `
        id, date,
        schedules(id, day_of_week, start_time, end_time),
        users!classes_teacher_id_fkey(id, name, surname),
        class_topics(
          topics(id, name,
            subjects(id, name)
          )
        )
      `,
      )
      .eq('student_id', studentId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .eq('class_topics.is_active', true)
      .order('date', { ascending: false });

    const student = studentResult.data;

    const today = this.helperService.getCurrentDate();

    const registrations = (registrationsResult.data ?? []).map((r: any) => {
      return new RegistrationDetail(
        r.id,
        r.start_date,
        r.end_date,
        { id: r.schools.id, name: r.schools.name },
        {
          id: r.grade_levels.id,
          name: r.grade_levels.name,
          educationLevel: {
            id: r.grade_levels.education_levels.id,
            name: r.grade_levels.education_levels.name,
          },
        },
      );
    });

    const currentRegistration =
      registrations.find(
        (r) =>
          r.startDate <= today && (r.endDate === null || r.endDate >= today),
      ) ?? null;

    const classes = (classesResult.data ?? []).map((c: any) => {
      const teacher = c.users;
      const topics = (c.class_topics ?? [])
        .filter((ct: any) => ct.topics)
        .map((ct: any) => ({
          id: ct.topics.id,
          name: ct.topics.name,
          subject: {
            id: ct.topics.subjects.id,
            name: ct.topics.subjects.name,
          },
        }));

      return new ClassSummary(
        c.id,
        c.date,
        {
          id: c.schedules.id,
          dayOfWeek: c.schedules.day_of_week,
          startTime: c.schedules.start_time,
          endTime: c.schedules.end_time,
        },
        {
          id: teacher.id,
          name: teacher.name,
          surname: teacher.surname,
        },
        topics,
      );
    });

    return new StudentDetail(
      { id: student.id, name: student.name, surname: student.surname },
      currentRegistration,
      registrations,
      classes,
      classes.length,
    );
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
