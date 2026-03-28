import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { IDatabaseService } from '../../database/services/i.database.service';
import { IHelpersService } from '../../helpers/services/i.helpers.service';
import { Student } from '../../students/models/student.model';
import { StudentUser } from '../models/student-user.model';

export abstract class IStudentUsersRepository {
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
    studentId: string,
    userId: string,
    createdBy: string,
  ): Promise<StudentUser>;
  public abstract delete(studentUserId: string, userId: string): Promise<void>;
  public abstract getById(studentUserId: string): Promise<StudentUser>;
  public abstract countActiveForUser(
    userId: string,
    organizationId: string,
  ): Promise<number>;
  public abstract getStudentsByUserId(
    userId: string,
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Student>>;
  public abstract deactivateByStudentId(
    studentId: string,
    userId: string,
  ): Promise<void>;
  public abstract deactivateByOrganizationId(
    organizationId: string,
    userId: string,
  ): Promise<void>;
  public abstract getActiveUserIdsForStudent(
    studentId: string,
  ): Promise<string[]>;
}
