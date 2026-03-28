import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import type { Membership } from '../../memberships/models/membership.model';
import { Student } from '../../students/models/student.model';
import { LinkStudentUserBodyDTO } from '../dtos/link-student-user.dto';
import { UnlinkStudentUserParamsDTO } from '../dtos/unlink-student-user.dto';
import { StudentUser } from '../models/student-user.model';
import { IStudentUsersService } from '../services/i.student-users.service';

export abstract class IStudentUsersController {
  protected readonly studentUsersService: IStudentUsersService;

  public constructor(studentUsersService: IStudentUsersService) {
    this.studentUsersService = studentUsersService;
  }

  public abstract create(
    studentId: string,
    body: LinkStudentUserBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<StudentUser>;
  public abstract delete(
    params: UnlinkStudentUserParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
  public abstract getByUser(
    membership: Membership,
    pagination: PaginationQueryDTO,
    user: JwtPayload,
  ): Promise<PaginatedResponse<Student>>;
}
