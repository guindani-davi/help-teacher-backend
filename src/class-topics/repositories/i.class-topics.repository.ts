import { IDatabaseService } from '../../database/services/i.database.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { ClassTopicDetail } from '../models/class-topic-detail.model';
import { ClassTopic } from '../models/class-topic.model';

export abstract class IClassTopicsRepository {
  protected readonly databaseService: IDatabaseService;
  protected readonly helperService: IHelpersService;

  public constructor(
    databaseService: IDatabaseService,
    helperService: IHelpersService,
  ) {
    this.databaseService = databaseService;
    this.helperService = helperService;
  }

  public abstract create(
    classId: string,
    topicId: string,
    createdBy: string,
  ): Promise<ClassTopic>;
  public abstract delete(
    classTopicId: string,
    classId: string,
    userId: string,
  ): Promise<void>;
  public abstract getByClassId(classId: string): Promise<ClassTopicDetail[]>;
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
