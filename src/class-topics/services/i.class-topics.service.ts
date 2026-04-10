import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../auth/models/jwt.model';
import { IClassesService } from '../../classes/services/i.classes.service';
import type { Membership } from '../../memberships/models/membership.model';
import { IReportCacheService } from '../../reports/services/i.report-cache.service';
import { ITopicsService } from '../../topics/services/i.topics.service';
import { CreateClassTopicBodyDTO } from '../dtos/create-class-topic.dto';
import { DeleteClassTopicParamsDTO } from '../dtos/delete-class-topic.dto';
import { ClassTopicDetail } from '../models/class-topic-detail.model';
import { ClassTopic } from '../models/class-topic.model';
import { IClassTopicsRepository } from '../repositories/i.class-topics.repository';

@Injectable()
export abstract class IClassTopicsService {
  protected readonly classTopicsRepository: IClassTopicsRepository;
  protected readonly classesService: IClassesService;
  protected readonly topicsService: ITopicsService;
  protected readonly reportCacheService: IReportCacheService;

  public constructor(
    classTopicsRepository: IClassTopicsRepository,
    reportCacheService: IReportCacheService,
    classesService: IClassesService,
    topicsService: ITopicsService,
  ) {
    this.classTopicsRepository = classTopicsRepository;
    this.reportCacheService = reportCacheService;
    this.classesService = classesService;
    this.topicsService = topicsService;
  }

  public abstract create(
    classId: string,
    body: CreateClassTopicBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<ClassTopic>;
  public abstract delete(
    params: DeleteClassTopicParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
  public abstract getByClassId(
    classId: string,
    membership: Membership,
  ): Promise<ClassTopicDetail[]>;
  public abstract deactivateByTopicId(
    topicId: string,
    userId: string,
  ): Promise<void>;
  public abstract deactivateByClassId(
    classId: string,
    userId: string,
  ): Promise<void>;
  public abstract deactivateByClassIds(
    classIds: string[],
    userId: string,
  ): Promise<void>;
  public abstract deactivateByTopicIds(
    topicIds: string[],
    userId: string,
  ): Promise<void>;
  public abstract deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void>;
}
