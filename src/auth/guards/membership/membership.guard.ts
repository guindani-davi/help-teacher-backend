import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { IDatabaseService } from '../../../database/service/i.database.service';
import { IHelpersService } from '../../../helpers/service/i.helpers.service';
import { Membership } from '../../../organizations/model/membership.model';
import { RolesEnum } from '../../enums/roles.enum';
import type { JwtPayload } from '../../payloads/jwt.payload';

@Injectable()
export class MembershipGuard implements CanActivate {
  private readonly databaseService: IDatabaseService;
  private readonly helperService: IHelpersService;

  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
    @Inject(IHelpersService) helperService: IHelpersService,
  ) {
    this.databaseService = databaseService;
    this.helperService = helperService;
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload | undefined = request.user;
    const slug: string | undefined = request.params.slug;

    if (!user || !slug) {
      throw new ForbiddenException();
    }

    const organization = await this.databaseService
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (!organization.data) {
      throw new ForbiddenException();
    }

    const membership = await this.databaseService
      .from('memberships')
      .select()
      .eq('organization_id', organization.data.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!membership.data) {
      throw new ForbiddenException();
    }

    const { createdAtDate, updatedAtDate } =
      this.helperService.parseEntitiesDates(
        membership.data.created_at,
        membership.data.updated_at,
      );

    request.membership = new Membership(
      membership.data.id,
      membership.data.user_id,
      membership.data.organization_id,
      membership.data.roles as RolesEnum[],
      membership.data.is_active,
      membership.data.created_by,
      membership.data.updated_by,
      createdAtDate,
      updatedAtDate,
    );

    return true;
  }
}
