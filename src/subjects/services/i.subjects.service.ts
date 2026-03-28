import { Injectable } from '@nestjs/common';
import { IClassTopicsService } from 'src/class-topics/services/i.class-topics.service';
import { IReportCacheService } from 'src/reports/services/i.report-cache.service';
import { ITopicsService } from 'src/topics/services/i.topics.service';
import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import type { Membership } from '../../memberships/models/membership.model';
import { CreateSubjectBodyDTO } from '../dtos/create-subject.dto';
import { DeleteSubjectParamsDTO } from '../dtos/delete-subject.dto';
import { GetSubjectParamsDTO } from '../dtos/get-subject.dto';
import {
  UpdateSubjectBodyDTO,
  UpdateSubjectParamsDTO,
} from '../dtos/update-subject.dto';
import { Subject } from '../models/subject.model';
import { ISubjectsRepository } from '../repositories/i.subjects.repository';

@Injectable()
export abstract class ISubjectsService {
  protected readonly subjectsRepository: ISubjectsRepository;
  protected readonly helperService: IHelpersService;
  protected readonly topicsService: ITopicsService;
  protected readonly classTopicsService: IClassTopicsService;
  protected readonly reportCacheService: IReportCacheService;

  public constructor(
    subjectsRepository: ISubjectsRepository,
    helperService: IHelpersService,
    topicsService: ITopicsService,
    classTopicsService: IClassTopicsService,
    reportCacheService: IReportCacheService,
  ) {
    this.subjectsRepository = subjectsRepository;
    this.helperService = helperService;
    this.topicsService = topicsService;
    this.classTopicsService = classTopicsService;
    this.reportCacheService = reportCacheService;
  }

  public abstract create(
    body: CreateSubjectBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Subject>;
  public abstract getById(
    params: GetSubjectParamsDTO | string,
    membership: Membership | string,
  ): Promise<Subject>;
  public abstract getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Subject>>;
  public abstract update(
    params: UpdateSubjectParamsDTO,
    body: UpdateSubjectBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Subject>;
  public abstract delete(
    params: DeleteSubjectParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
}
