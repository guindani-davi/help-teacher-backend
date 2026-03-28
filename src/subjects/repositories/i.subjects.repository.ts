import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IDatabaseService } from '../../database/services/i.database.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { Subject } from '../models/subject.model';

export abstract class ISubjectsRepository {
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
    organizationId: string,
    userId: string,
  ): Promise<Subject>;
  public abstract getById(
    subjectId: string,
    organizationId: string,
  ): Promise<Subject>;
  public abstract getByOrganizationId(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Subject>>;
  public abstract update(
    subjectId: string,
    name: string | undefined,
    userId: string,
  ): Promise<Subject>;
  public abstract delete(subjectId: string, userId: string): Promise<void>;
  public abstract deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void>;
  public abstract countActiveByOrganizationId(
    organizationId: string,
  ): Promise<number>;
}
