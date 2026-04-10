import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IDatabaseService } from '../../database/services/i.database.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { Topic } from '../models/topic.model';

export abstract class ITopicsRepository {
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
    name: string,
    subjectId: string,
    organizationId: string,
    userId: string,
  ): Promise<Topic>;
  public abstract getById(
    topicId: string,
    organizationId: string,
  ): Promise<Topic>;
  public abstract getByOrganizationId(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Topic>>;
  public abstract update(
    topicId: string,
    name: string | undefined,
    subjectId: string | undefined,
    userId: string,
  ): Promise<Topic>;
  public abstract delete(topicId: string, userId: string): Promise<void>;
  public abstract deactivateBySubjectId(
    subjectId: string,
    userId: string,
  ): Promise<void>;
  public abstract deactivateBySubjectIds(
    subjectIds: string[],
    userId: string,
  ): Promise<void>;
  public abstract deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void>;
  public abstract getActiveIdsBySubjectId(subjectId: string): Promise<string[]>;
  public abstract getActiveIdsBySubjectIds(
    subjectIds: string[],
  ): Promise<string[]>;
  public abstract countActiveByOrganizationId(
    organizationId: string,
  ): Promise<number>;
}
