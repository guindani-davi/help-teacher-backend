import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { ReportClassTopic } from '../../models/report-class-topic.model';
import { ReportClass } from '../../models/report-class.model';
import { ReportOrganization } from '../../models/report-organization.model';
import { ReportRegistration } from '../../models/report-registration.model';
import { ReportStudent } from '../../models/report-student.model';
import { StudentReport } from '../../models/student-report.model';
import { IReportDataService } from '../i.report-data.service';

@Injectable()
export class ReportDataService extends IReportDataService {
  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
  ) {
    super(databaseService);
  }

  public async assembleStudentReport(
    studentId: string,
    organizationId: string,
  ): Promise<StudentReport> {
    const [organization, student] = await Promise.all([
      this.fetchOrganization(organizationId),
      this.fetchStudent(studentId, organizationId),
    ]);

    const [registration, classes] = await Promise.all([
      this.fetchRegistration(studentId, organizationId),
      this.fetchClasses(studentId, organizationId),
    ]);

    return new StudentReport(organization, student, registration, classes);
  }

  private async fetchOrganization(
    organizationId: string,
  ): Promise<ReportOrganization> {
    const result = await this.databaseService
      .from('organizations')
      .select('id, name, slug, logo_url')
      .eq('id', organizationId)
      .eq('is_active', true)
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Organization');
    }

    return new ReportOrganization(
      result.data.id,
      result.data.name,
      result.data.slug,
      result.data.logo_url,
    );
  }

  private async fetchStudent(
    studentId: string,
    organizationId: string,
  ): Promise<ReportStudent> {
    const result = await this.databaseService
      .from('students')
      .select('id, name, surname')
      .eq('id', studentId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Student');
    }

    return new ReportStudent(
      result.data.id,
      result.data.name,
      result.data.surname,
    );
  }

  private async fetchRegistration(
    studentId: string,
    organizationId: string,
  ): Promise<ReportRegistration | null> {
    const today = new Date().toISOString().split('T')[0];

    const currentResult = await this.databaseService
      .from('registrations')
      .select(
        'id, start_date, end_date, schools(name), grade_levels(name, education_levels(name))',
      )
      .eq('student_id', studentId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    let row = currentResult.data;

    if (!row) {
      const recentResult = await this.databaseService
        .from('registrations')
        .select(
          'id, start_date, end_date, schools(name), grade_levels(name, education_levels(name))',
        )
        .eq('student_id', studentId)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      row = recentResult.data;
    }

    if (!row) {
      return null;
    }

    return new ReportRegistration(
      row.id,
      (row.schools as unknown as { name: string })?.name ?? '',
      (row.grade_levels as unknown as { name: string })?.name ?? '',
      (
        row.grade_levels as unknown as {
          education_levels: { name: string };
        }
      )?.education_levels?.name ?? '',
      row.start_date,
      row.end_date,
    );
  }

  private async fetchClasses(
    studentId: string,
    organizationId: string,
  ): Promise<ReportClass[]> {
    const result = await this.databaseService
      .from('classes')
      .select(
        'id, date, teacher_id, schedules(day_of_week, start_time, end_time)',
      )
      .eq('student_id', studentId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('date', { ascending: false });

    if (result.error || !result.data || result.data.length === 0) {
      return [];
    }

    const classIds = result.data.map((row) => row.id);
    const teacherIds = [...new Set(result.data.map((row) => row.teacher_id))];

    const [classTopicsResult, teachersResult] = await Promise.all([
      this.databaseService
        .from('class_topics')
        .select('class_id, topics(id, name, subjects(name))')
        .in('class_id', classIds)
        .eq('is_active', true),
      this.databaseService
        .from('users')
        .select('id, name, surname')
        .in('id', teacherIds),
    ]);

    const topicsByClassId = new Map<string, ReportClassTopic[]>();
    if (classTopicsResult.data) {
      for (const ct of classTopicsResult.data) {
        const topic = ct.topics as unknown as {
          id: string;
          name: string;
          subjects: { name: string } | null;
        };
        if (!topic) continue;
        const existing = topicsByClassId.get(ct.class_id) ?? [];
        existing.push(
          new ReportClassTopic(
            topic.id,
            topic.name,
            topic.subjects?.name ?? '',
          ),
        );
        topicsByClassId.set(ct.class_id, existing);
      }
    }

    const teacherMap = new Map<string, string>();
    if (teachersResult.data) {
      for (const t of teachersResult.data) {
        teacherMap.set(t.id, `${t.name} ${t.surname}`);
      }
    }

    return result.data.map((row) => {
      const schedule = row.schedules as unknown as {
        day_of_week: string;
        start_time: string;
        end_time: string;
      };

      return new ReportClass(
        row.id,
        teacherMap.get(row.teacher_id) ?? '',
        schedule?.day_of_week ?? '',
        schedule?.start_time ?? '',
        schedule?.end_time ?? '',
        row.date,
        topicsByClassId.get(row.id) ?? [],
      );
    });
  }
}
