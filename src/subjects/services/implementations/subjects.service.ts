import { forwardRef, Inject, Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { IClassTopicsService } from '../../../class-topics/services/i.class-topics.service';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import type { Membership } from '../../../memberships/models/membership.model';
import { IReportCacheService } from '../../../reports/services/i.report-cache.service';
import { ITopicsService } from '../../../topics/services/i.topics.service';
import { CreateSubjectBodyDTO } from '../../dtos/create-subject.dto';
import { DeleteSubjectParamsDTO } from '../../dtos/delete-subject.dto';
import { GetSubjectParamsDTO } from '../../dtos/get-subject.dto';
import {
  UpdateSubjectBodyDTO,
  UpdateSubjectParamsDTO,
} from '../../dtos/update-subject.dto';
import { Subject } from '../../models/subject.model';
import { ISubjectsRepository } from '../../repositories/i.subjects.repository';
import { ISubjectsService } from '../i.subjects.service';

@Injectable()
export class SubjectsService extends ISubjectsService {
  public constructor(
    @Inject(ISubjectsRepository) subjectsRepository: ISubjectsRepository,
    @Inject(IHelpersService) helperService: IHelpersService,
    @Inject(forwardRef(() => ITopicsService)) topicsService: ITopicsService,
    @Inject(IClassTopicsService) classTopicsService: IClassTopicsService,
    @Inject(forwardRef(() => IReportCacheService))
    reportCacheService: IReportCacheService,
  ) {
    super(
      subjectsRepository,
      helperService,
      topicsService,
      classTopicsService,
      reportCacheService,
    );
  }

  public async create(
    body: CreateSubjectBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Subject> {
    return this.subjectsRepository.create(
      body.name,
      membership.organizationId,
      user.sub,
    );
  }

  public async getById(
    params: GetSubjectParamsDTO | string,
    membership: Membership | string,
  ): Promise<Subject> {
    const subjectId = typeof params === 'string' ? params : params.subjectId;
    const organizationId =
      typeof membership === 'string' ? membership : membership.organizationId;

    return this.subjectsRepository.getById(subjectId, organizationId);
  }

  public async getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Subject>> {
    return this.subjectsRepository.getByOrganizationId(
      membership.organizationId,
      pagination,
    );
  }

  public async update(
    params: UpdateSubjectParamsDTO,
    body: UpdateSubjectBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Subject> {
    await this.subjectsRepository.getById(
      params.subjectId,
      membership.organizationId,
    );

    const result = await this.subjectsRepository.update(
      params.subjectId,
      body.name,
      user.sub,
    );

    await this.reportCacheService.invalidateAllForOrg(
      membership.organizationId,
    );

    return result;
  }

  public async delete(
    params: DeleteSubjectParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void> {
    await this.subjectsRepository.getById(
      params.subjectId,
      membership.organizationId,
    );

    const topicIds = await this.topicsService.getActiveIdsBySubjectId(
      params.subjectId,
    );

    await this.classTopicsService.deactivateByTopicIds(topicIds, user.sub);

    await this.topicsService.deactivateBySubjectId(params.subjectId, user.sub);

    await this.subjectsRepository.delete(params.subjectId, user.sub);

    await this.reportCacheService.invalidateAllForOrg(
      membership.organizationId,
    );
  }
}
