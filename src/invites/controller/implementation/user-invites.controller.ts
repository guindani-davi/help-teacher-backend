import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { AuthGuard } from '../../../auth/guards/jwt/jwt.guard';
import type { JwtPayload } from '../../../auth/payloads/jwt.payload';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/responses/paginated.response';
import { AcceptInviteParamsDTO } from '../../dtos/accept-invite.dto';
import { GetInviteParamsDTO } from '../../dtos/get-invite.dto';
import { RejectInviteParamsDTO } from '../../dtos/reject-invite.dto';
import { Invite } from '../../model/invite.model';
import { IInvitesService } from '../../service/i.invites.service';
import { IUserInvitesController } from '../i.user-invites.controller';

@Controller('invites')
@UseGuards(AuthGuard)
export class UserInvitesController extends IUserInvitesController {
  public constructor(@Inject(IInvitesService) invitesService: IInvitesService) {
    super(invitesService);
  }

  @Get('pending')
  public async getPendingInvites(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Invite>> {
    return this.invitesService.getPendingInvites(user, pagination);
  }

  @Get(':inviteId')
  public async getInviteById(
    @Param() params: GetInviteParamsDTO,
    @CurrentUser() user: JwtPayload,
  ): Promise<Invite> {
    return this.invitesService.getInviteById(params, user);
  }

  @Post(':inviteId/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async acceptInvite(
    @Param() params: AcceptInviteParamsDTO,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.invitesService.acceptInvite(params, user);
  }

  @Post(':inviteId/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async rejectInvite(
    @Param() params: RejectInviteParamsDTO,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.invitesService.rejectInvite(params, user);
  }
}
