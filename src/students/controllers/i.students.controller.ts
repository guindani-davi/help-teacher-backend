import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import type { Membership } from '../../memberships/models/membership.model';
import { CreateStudentBodyDTO } from '../dtos/create-student.dto';
import { DeleteStudentParamsDTO } from '../dtos/delete-student.dto';
import { GetStudentParamsDTO } from '../dtos/get-student.dto';
import {
  UpdateStudentBodyDTO,
  UpdateStudentParamsDTO,
} from '../dtos/update-student.dto';
import { Student } from '../models/student.model';
import { IStudentsService } from '../services/i.students.service';

export abstract class IStudentsController {
  protected readonly studentsService: IStudentsService;

  public constructor(studentsService: IStudentsService) {
    this.studentsService = studentsService;
  }

  public abstract create(
    body: CreateStudentBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Student>;
  public abstract getById(
    params: GetStudentParamsDTO,
    membership: Membership,
  ): Promise<Student>;
  public abstract getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Student>>;
  public abstract update(
    params: UpdateStudentParamsDTO,
    body: UpdateStudentBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Student>;
  public abstract delete(
    params: DeleteStudentParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
}
