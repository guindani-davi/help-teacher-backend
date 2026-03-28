import { forwardRef, Inject, Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { IClassTopicsService } from '../../../class-topics/services/i.class-topics.service';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/models/paginated-response.model';
import { IHelpersService } from '../../../helpers/services/i.helpers.service';
import type { Membership } from '../../../memberships/models/membership.model';
import { IReportCacheService } from '../../../reports/services/i.report-cache.service';
import { ISubjectsService } from '../../../subjects/services/i.subjects.service';
import { CreateTopicBodyDTO } from '../../dtos/create-topic.dto';
import { DeleteTopicParamsDTO } from '../../dtos/delete-topic.dto';
import { GetTopicParamsDTO } from '../../dtos/get-topic.dto';
import {
  UpdateTopicBodyDTO,
  UpdateTopicParamsDTO,
} from '../../dtos/update-topic.dto';
import { Topic } from '../../models/topic.model';
import { ITopicsRepository } from '../../repositories/i.topics.repository';
import { ITopicsService } from '../i.topics.service';

@Injectable()
export class TopicsService extends ITopicsService {
  public constructor(
    @Inject(ITopicsRepository) topicsRepository: ITopicsRepository,
    @Inject(IHelpersService) helperService: IHelpersService,
    @Inject(forwardRef(() => ISubjectsService))
    subjectsService: ISubjectsService,
    @Inject(forwardRef(() => IClassTopicsService))
    classTopicsService: IClassTopicsService,
    @Inject(forwardRef(() => IReportCacheService))
    reportCacheService: IReportCacheService,
  ) {
    super(
      topicsRepository,
      helperService,
      subjectsService,
      classTopicsService,
      reportCacheService,
    );
  }

  public async create(
    body: CreateTopicBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Topic> {
    const organizationId = membership.organizationId;

    await this.subjectsService.getById(body.subjectId, organizationId);

    return this.topicsRepository.create(
      body.name,
      body.subjectId,
      organizationId,
      user.sub,
    );
  }

  public async getById(
    params: GetTopicParamsDTO | string,
    membership: Membership | string,
  ): Promise<Topic> {
    const topicId = typeof params === 'string' ? params : params.topicId;
    const organizationId =
      typeof membership === 'string' ? membership : membership.organizationId;

    return this.topicsRepository.getById(topicId, organizationId);
  }

  public async getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Topic>> {
    return this.topicsRepository.getByOrganizationId(
      membership.organizationId,
      pagination,
    );
  }

  public async update(
    params: UpdateTopicParamsDTO,
    body: UpdateTopicBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Topic> {
    const organizationId = membership.organizationId;

    await this.topicsRepository.getById(params.topicId, organizationId);

    if (body.subjectId) {
      await this.subjectsService.getById(body.subjectId, organizationId);
    }

    const result = await this.topicsRepository.update(
      params.topicId,
      body.name,
      body.subjectId,
      user.sub,
    );

    await this.reportCacheService.invalidateAllForOrg(
      membership.organizationId,
    );

    return result;
  }

  public async delete(
    params: DeleteTopicParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void> {
    await this.topicsRepository.getById(
      params.topicId,
      membership.organizationId,
    );

    await this.classTopicsService.deactivateByTopicId(params.topicId, user.sub);

    await this.topicsRepository.delete(params.topicId, user.sub);

    await this.reportCacheService.invalidateAllForOrg(
      membership.organizationId,
    );
  }

  public async getActiveIdsBySubjectId(subjectId: string): Promise<string[]> {
    return this.topicsRepository.getActiveIdsBySubjectId(subjectId);
  }

  public async deactivateBySubjectId(
    subjectId: string,
    userId: string,
  ): Promise<void> {
    await this.topicsRepository.deactivateBySubjectId(subjectId, userId);
  }
}
