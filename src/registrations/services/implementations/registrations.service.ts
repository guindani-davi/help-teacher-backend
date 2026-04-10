import { forwardRef, Inject, Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { IGradeLevelsService } from '../../../grade-levels/services/i.grade-levels.service';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import type { Membership } from '../../../memberships/models/membership.model';
import { IReportCacheService } from '../../../reports/services/i.report-cache.service';
import { ISchoolsService } from '../../../schools/services/i.schools.service';
import { IStudentsService } from '../../../students/services/i.students.service';
import { CreateRegistrationBodyDTO } from '../../dtos/create-registration.dto';
import { DeleteRegistrationParamsDTO } from '../../dtos/delete-registration.dto';
import { GetRegistrationParamsDTO } from '../../dtos/get-registration.dto';
import {
  UpdateRegistrationBodyDTO,
  UpdateRegistrationParamsDTO,
} from '../../dtos/update-registration.dto';
import { RegistrationOverlapException } from '../../exceptions/registration-overlap.exception';
import { Registration } from '../../models/registration.model';
import { IRegistrationsRepository } from '../../repositories/i.registrations.repository';
import { IRegistrationsService } from '../i.registrations.service';

@Injectable()
export class RegistrationsService extends IRegistrationsService {
  public constructor(
    @Inject(IRegistrationsRepository)
    registrationsRepository: IRegistrationsRepository,
    @Inject(IHelpersService) helperService: IHelpersService,
    @Inject(forwardRef(() => IStudentsService))
    studentsService: IStudentsService,
    @Inject(forwardRef(() => ISchoolsService)) schoolsService: ISchoolsService,
    @Inject(forwardRef(() => IGradeLevelsService))
    gradeLevelsService: IGradeLevelsService,
    @Inject(IReportCacheService) reportCacheService: IReportCacheService,
  ) {
    super(
      registrationsRepository,
      helperService,
      studentsService,
      schoolsService,
      gradeLevelsService,
      reportCacheService,
    );
  }

  public async create(
    body: CreateRegistrationBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Registration> {
    const organizationId = membership.organizationId;

    await Promise.all([
      this.studentsService.getById(body.studentId, organizationId),
      this.schoolsService.getById(body.schoolId, organizationId),
      this.gradeLevelsService.getById(body.gradeLevelId, organizationId),
    ]);

    if (!body.endDate) {
      await this.registrationsRepository.closeCurrentRegistration(
        body.studentId,
        organizationId,
        this.helperService.subtractOneDay(body.startDate),
        user.sub,
      );
    }

    const hasOverlap = await this.registrationsRepository.hasOverlapping(
      body.studentId,
      organizationId,
      body.startDate,
      body.endDate,
    );

    if (hasOverlap) {
      throw new RegistrationOverlapException();
    }

    const created = await this.registrationsRepository.create(
      body.studentId,
      body.schoolId,
      body.gradeLevelId,
      organizationId,
      body.startDate,
      body.endDate,
      user.sub,
    );

    await this.reportCacheService.invalidateCache(
      organizationId,
      body.studentId,
    );

    return created;
  }

  public async getById(
    params: GetRegistrationParamsDTO,
    membership: Membership,
  ): Promise<Registration> {
    return this.registrationsRepository.getById(
      params.registrationId,
      membership.organizationId,
    );
  }

  public async getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Registration>> {
    return this.registrationsRepository.getByOrganizationId(
      membership.organizationId,
      pagination,
    );
  }

  public async update(
    params: UpdateRegistrationParamsDTO,
    body: UpdateRegistrationBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Registration> {
    const organizationId = membership.organizationId;

    const existing = await this.registrationsRepository.getById(
      params.registrationId,
      organizationId,
    );

    const validations: Promise<unknown>[] = [];
    if (body.studentId) {
      validations.push(
        this.studentsService.getById(body.studentId, organizationId),
      );
    }
    if (body.schoolId) {
      validations.push(
        this.schoolsService.getById(body.schoolId, organizationId),
      );
    }
    if (body.gradeLevelId) {
      validations.push(
        this.gradeLevelsService.getById(body.gradeLevelId, organizationId),
      );
    }
    await Promise.all(validations);

    const effectiveStudentId = body.studentId ?? existing.studentId;
    const effectiveStartDate = body.startDate ?? existing.startDate;
    const effectiveEndDate =
      body.endDate !== undefined ? body.endDate : existing.endDate;

    const hasOverlap = await this.registrationsRepository.hasOverlapping(
      effectiveStudentId,
      organizationId,
      effectiveStartDate,
      effectiveEndDate,
      params.registrationId,
    );

    if (hasOverlap) {
      throw new RegistrationOverlapException();
    }

    const updated = await this.registrationsRepository.update(
      params.registrationId,
      body.studentId,
      body.schoolId,
      body.gradeLevelId,
      body.startDate,
      body.endDate,
      user.sub,
    );

    await this.reportCacheService.invalidateCache(
      organizationId,
      existing.studentId,
    );

    if (body.studentId && body.studentId !== existing.studentId) {
      await this.reportCacheService.invalidateCache(
        organizationId,
        body.studentId,
      );
    }

    return updated;
  }

  public async delete(
    params: DeleteRegistrationParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void> {
    const existing = await this.registrationsRepository.getById(
      params.registrationId,
      membership.organizationId,
    );

    await this.registrationsRepository.delete(params.registrationId, user.sub);

    await this.reportCacheService.invalidateCache(
      membership.organizationId,
      existing.studentId,
    );
  }

  public async deactivateByStudentId(
    studentId: string,
    userId: string,
  ): Promise<void> {
    await this.registrationsRepository.deactivateByStudentId(studentId, userId);
  }

  public async deactivateBySchoolId(
    schoolId: string,
    userId: string,
  ): Promise<void> {
    await this.registrationsRepository.deactivateBySchoolId(schoolId, userId);
  }

  public async deactivateByGradeLevelId(
    gradeLevelId: string,
    userId: string,
  ): Promise<void> {
    await this.registrationsRepository.deactivateByGradeLevelId(
      gradeLevelId,
      userId,
    );
  }

  public async deactivateByGradeLevelIds(
    gradeLevelIds: string[],
    userId: string,
  ): Promise<void> {
    await this.registrationsRepository.deactivateByGradeLevelIds(
      gradeLevelIds,
      userId,
    );
  }
}
