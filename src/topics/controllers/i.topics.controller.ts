import type { JwtPayload } from '../../auth/models/jwt.model';
import { PaginationQueryDTO } from '../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import type { Membership } from '../../memberships/models/membership.model';
import { CreateTopicBodyDTO } from '../dtos/create-topic.dto';
import { DeleteTopicParamsDTO } from '../dtos/delete-topic.dto';
import { GetTopicParamsDTO } from '../dtos/get-topic.dto';
import {
  UpdateTopicBodyDTO,
  UpdateTopicParamsDTO,
} from '../dtos/update-topic.dto';
import { Topic } from '../models/topic.model';
import { ITopicsService } from '../services/i.topics.service';

export abstract class ITopicsController {
  protected readonly topicsService: ITopicsService;

  public constructor(topicsService: ITopicsService) {
    this.topicsService = topicsService;
  }

  public abstract create(
    body: CreateTopicBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Topic>;
  public abstract getById(
    params: GetTopicParamsDTO,
    membership: Membership,
  ): Promise<Topic>;
  public abstract getByOrganization(
    membership: Membership,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Topic>>;
  public abstract update(
    params: UpdateTopicParamsDTO,
    body: UpdateTopicBodyDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<Topic>;
  public abstract delete(
    params: DeleteTopicParamsDTO,
    membership: Membership,
    user: JwtPayload,
  ): Promise<void>;
}
