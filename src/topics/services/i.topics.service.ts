import { Injectable } from '@nestjs/common';
import { IClassTopicsService } from '../../class-topics/services/i.class-topics.service';
import { IReportCacheService } from '../../reports/services/i.report-cache.service';
import { ISubjectsService } from '../../subjects/services/i.subjects.service';

import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import type { Membership } from '../../memberships/models/membership.model';
import { CreateTopicBodyDTO } from '../dtos/create-topic.dto';
import { DeleteTopicParamsDTO } from '../dtos/delete-topic.dto';
import { GetTopicParamsDTO } from '../dtos/get-topic.dto';
import {
  UpdateTopicBodyDTO,
  UpdateTopicParamsDTO,
} from '../dtos/update-topic.dto';
import { Topic } from '../models/topic.model';
import { ITopicsRepository } from '../repositories/i.topics.repository';

@Injectable()
export abstract class ITopicsService {
  protected readonly topicsRepository: ITopicsRepository;
  protected readonly helperService: IHelpersService;
  protected readonly subjectsService: ISubjectsService;
  protected readonly classTopicsService: IClassTopicsService;
  protected readonly reportCacheService: IReportCacheService;

  public constructor(
    topicsRepository: ITopicsRepository,
    helperService: IHelpersService,
    subjectsService: ISubjectsService,
    classTopicsService: IClassTopicsService,
    reportCacheService: IReportCacheService,
  ) {
    this.topicsRepository = topicsRepository;
    this.helperService = helperService;
    this.subjectsService = subjectsService;
    this.classTopicsService = classTopicsService;
    this.reportCacheService = reportCacheService;
  }

  public abstract create(
    body: CreateTopicBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Topic>;
  public abstract getById(
    params: GetTopicParamsDTO | string,
    membership: Membership | string,
  ): Promise<Topic>;
  public abstract getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Topic>>;
  public abstract update(
    params: UpdateTopicParamsDTO,
    body: UpdateTopicBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Topic>;
  public abstract delete(
    params: DeleteTopicParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
  public abstract getActiveIdsBySubjectId(subjectId: string): Promise<string[]>;
  public abstract deactivateBySubjectId(
    subjectId: string,
    userId: string,
  ): Promise<void>;
}
