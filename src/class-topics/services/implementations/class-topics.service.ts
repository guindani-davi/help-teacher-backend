import { forwardRef, Inject, Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { IClassesService } from '../../../classes/services/i.classes.service';
import type { Membership } from '../../../memberships/models/membership.model';
import { IReportCacheService } from '../../../reports/services/i.report-cache.service';
import { ITopicsService } from '../../../topics/services/i.topics.service';
import { CreateClassTopicBodyDTO } from '../../dtos/create-class-topic.dto';
import { DeleteClassTopicParamsDTO } from '../../dtos/delete-class-topic.dto';
import { ClassTopicDetail } from '../../models/class-topic-detail.model';
import { ClassTopic } from '../../models/class-topic.model';
import { IClassTopicsRepository } from '../../repositories/i.class-topics.repository';
import { IClassTopicsService } from '../i.class-topics.service';

@Injectable()
export class ClassTopicsService extends IClassTopicsService {
  public constructor(
    @Inject(IClassTopicsRepository)
    classTopicsRepository: IClassTopicsRepository,
    @Inject(forwardRef(() => IClassesService)) classesService: IClassesService,
    @Inject(forwardRef(() => ITopicsService)) topicsService: ITopicsService,
    @Inject(IReportCacheService) reportCacheService: IReportCacheService,
  ) {
    super(
      classTopicsRepository,
      reportCacheService,
      classesService,
      topicsService,
    );
  }

  public async create(
    classId: string,
    body: CreateClassTopicBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<ClassTopic> {
    const [classEntity] = await Promise.all([
      this.classesService.getById(classId, membership.organizationId),
      this.topicsService.getById(body.topicId, membership.organizationId),
    ]);

    const result = await this.classTopicsRepository.create(
      classId,
      body.topicId,
      user.sub,
    );

    await this.reportCacheService.invalidateCache(
      membership.organizationId,
      classEntity.studentId,
    );

    return result;
  }

  public async delete(
    params: DeleteClassTopicParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void> {
    const classEntity = await this.classesService.getById(
      params.classId,
      membership.organizationId,
    );

    await this.classTopicsRepository.delete(
      params.classTopicId,
      params.classId,
      user.sub,
    );

    await this.reportCacheService.invalidateCache(
      membership.organizationId,
      classEntity.studentId,
    );
  }

  public async getByClassId(
    classId: string,
    membership: Membership,
  ): Promise<ClassTopicDetail[]> {
    await this.classesService.getById(classId, membership.organizationId);

    return this.classTopicsRepository.getByClassId(classId);
  }

  public async deactivateByTopicId(
    topicId: string,
    userId: string,
  ): Promise<void> {
    await this.classTopicsRepository.deactivateByTopicId(topicId, userId);
  }

  public async deactivateByClassId(
    classId: string,
    userId: string,
  ): Promise<void> {
    await this.classTopicsRepository.deactivateByClassId(classId, userId);
  }

  public async deactivateByClassIds(
    classIds: string[],
    userId: string,
  ): Promise<void> {
    await this.classTopicsRepository.deactivateByClassIds(classIds, userId);
  }

  public async deactivateByTopicIds(
    topicIds: string[],
    userId: string,
  ): Promise<void> {
    await this.classTopicsRepository.deactivateByTopicIds(topicIds, userId);
  }

  public async deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    await this.classTopicsRepository.deactivateByOrganizationId(
      organizationId,
      userId,
    );
  }
}
