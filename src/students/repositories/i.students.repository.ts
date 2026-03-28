import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IDatabaseService } from '../../database/services/i.database.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { Student } from '../models/student.model';

export abstract class IStudentsRepository {
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
    surname: string,
    organizationId: string,
    userId: string,
  ): Promise<Student>;
  public abstract getById(
    studentId: string,
    organizationId: string,
  ): Promise<Student>;
  public abstract getByOrganizationId(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Student>>;
  public abstract update(
    studentId: string,
    name: string | undefined,
    surname: string | undefined,
    userId: string,
  ): Promise<Student>;
  public abstract delete(studentId: string, userId: string): Promise<void>;
  public abstract deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void>;
  public abstract countActiveByOrganizationId(
    organizationId: string,
  ): Promise<number>;
}
