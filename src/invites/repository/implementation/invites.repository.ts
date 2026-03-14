import { Inject, Injectable } from '@nestjs/common';
import { RolesEnum } from '../../../auth/enums/roles.enum';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { PaginatedResponse } from '../../../common/responses/paginated.response';
import { DatabaseException } from '../../../database/exceptions/database.exception';
import { IDatabaseService } from '../../../database/service/i.database.service';
import { Database } from '../../../database/types';
import { IHelpersService } from '../../../helpers/service/i.helpers.service';
import { InviteStatusEnum } from '../../enums/invite-status.enum';
import { Invite } from '../../model/invite.model';
import { IInvitesRepository } from '../i.invites.repository';

@Injectable()
export class InvitesRepository extends IInvitesRepository {
  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
    @Inject(IHelpersService) helperService: IHelpersService,
  ) {
    super(databaseService, helperService);
  }

  public async createInvite(
    organizationId: string,
    email: string,
    roles: RolesEnum[],
    invitedBy: string,
    expiresAt: Date,
  ): Promise<Invite> {
    const insertData: Database['public']['Tables']['invites']['Insert'] = {
      organization_id: organizationId,
      email,
      roles,
      invited_by: invitedBy,
      expires_at: expiresAt.toISOString(),
    };

    const result = await this.databaseService
      .from('invites')
      .insert(insertData)
      .select()
      .single();

    if (result.error || !result.data) {
      throw new DatabaseException();
    }

    return this.mapToEntity(result.data);
  }

  public async getInviteById(inviteId: string): Promise<Invite> {
    const result = await this.databaseService
      .from('invites')
      .select()
      .eq('id', inviteId)
      .single();

    if (!result.data) {
      throw new EntityNotFoundException('Invite');
    }

    return this.mapToEntity(result.data);
  }

  public async getOrganizationInvites(
    organizationId: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Invite>> {
    const { from, to } = pagination.getRange();

    const result = await this.databaseService
      .from('invites')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (result.error) {
      throw new DatabaseException();
    }

    const items = result.data.map((row) => this.mapToEntity(row));
    return new PaginatedResponse(
      items,
      result.count ?? 0,
      pagination.page,
      pagination.limit,
    );
  }

  public async getPendingInvitesByEmail(
    email: string,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Invite>> {
    const { from, to } = pagination.getRange();

    const result = await this.databaseService
      .from('invites')
      .select('*', { count: 'exact' })
      .eq('email', email)
      .eq('status', InviteStatusEnum.PENDING)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .range(from, to);

    if (result.error) {
      throw new DatabaseException();
    }

    const items = result.data.map((row) => this.mapToEntity(row));
    return new PaginatedResponse(
      items,
      result.count ?? 0,
      pagination.page,
      pagination.limit,
    );
  }

  public async hasPendingInvite(
    organizationId: string,
    email: string,
  ): Promise<boolean> {
    const result = await this.databaseService
      .from('invites')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', email)
      .eq('status', InviteStatusEnum.PENDING)
      .gt('expires_at', new Date().toISOString())
      .single();

    return !!result.data;
  }

  public async updateInviteStatus(
    inviteId: string,
    status: InviteStatusEnum,
  ): Promise<void> {
    const now = new Date().toISOString();

    const updateData: Database['public']['Tables']['invites']['Update'] = {
      status,
      updated_at: now,
      responded_at:
        status === InviteStatusEnum.ACCEPTED ||
        status === InviteStatusEnum.REJECTED
          ? now
          : undefined,
    };

    const result = await this.databaseService
      .from('invites')
      .update(updateData)
      .eq('id', inviteId);

    if (result.error) {
      throw new DatabaseException();
    }
  }

  public async isAlreadyMember(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    const result = await this.databaseService
      .from('memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    return !!result.data;
  }

  public async createMembership(
    userId: string,
    organizationId: string,
    roles: RolesEnum[],
    createdBy: string,
  ): Promise<void> {
    const result = await this.databaseService.from('memberships').insert({
      user_id: userId,
      organization_id: organizationId,
      roles,
      created_by: createdBy,
    });

    if (result.error) {
      throw new DatabaseException();
    }
  }

  protected mapToEntity(
    data: Database['public']['Tables']['invites']['Row'],
  ): Invite {
    const { createdAtDate, updatedAtDate } =
      this.helperService.parseEntitiesDates(data.created_at, data.updated_at);

    return new Invite(
      data.id,
      data.organization_id,
      data.email,
      data.roles as RolesEnum[],
      data.status as InviteStatusEnum,
      data.invited_by,
      new Date(data.expires_at),
      data.responded_at ? new Date(data.responded_at) : null,
      createdAtDate,
      updatedAtDate,
    );
  }
}
