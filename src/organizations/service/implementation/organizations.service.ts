import { Inject, Injectable } from '@nestjs/common';
import { RolesEnum } from '../../../auth/enums/roles.enum';
import { JwtPayload } from '../../../auth/payloads/jwt.payload';
import { PaginationQueryDTO } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/responses/paginated.response';
import { IHelpersService } from '../../../helpers/service/i.helpers.service';
import { CreateOrganizationBodyDTO } from '../../dtos/create-organization.dto';
import { DeleteMemberParamsDTO } from '../../dtos/delete-member.dto';
import { DeleteOrganizationParamsDTO } from '../../dtos/delete-organization.dto';
import { GetMembershipParamsDTO } from '../../dtos/get-membership.dto';
import { GetOrganizationBySlugParamsDTO } from '../../dtos/get-organization.dto';
import { TransferOwnershipParamsDTO } from '../../dtos/transfer-ownership.dto';
import {
  UpdateMemberBodyDTO,
  UpdateMemberParamsDTO,
} from '../../dtos/update-member.dto';
import {
  UpdateOrganizationBySlugBodyDTO,
  UpdateOrganizationBySlugParamsDTO,
} from '../../dtos/update-organization.dto';
import { ForbiddenOperationException } from '../../exceptions/forbidden-operation.exception';
import { SlugAlreadyExistsException } from '../../exceptions/slug-already-exists.exception';
import { Membership } from '../../model/membership.model';
import { Organization } from '../../model/organization.model';
import { IOrganizationsRepository } from '../../repository/i.organizations.repository';
import { IOrganizationsService } from '../i.organizations.service';

@Injectable()
export class OrganizationsService extends IOrganizationsService {
  public constructor(
    @Inject(IOrganizationsRepository)
    organizationsRepository: IOrganizationsRepository,
    @Inject(IHelpersService) helperService: IHelpersService,
  ) {
    super(organizationsRepository, helperService);
  }

  public async createOrganization(
    body: CreateOrganizationBodyDTO,
    user: JwtPayload,
  ): Promise<Organization> {
    const slug = await this.generateUniqueSlug(body.name);

    return this.organizationsRepository.createOrganization(body, slug, user);
  }

  public async getOrganizationBySlug(
    params: GetOrganizationBySlugParamsDTO,
  ): Promise<Organization> {
    return this.organizationsRepository.getOrganizationBySlug(params);
  }

  public async updateOrganization(
    params: UpdateOrganizationBySlugParamsDTO,
    body: UpdateOrganizationBySlugBodyDTO,
    user: JwtPayload,
  ): Promise<Organization> {
    let newSlug: string | null = null;

    if (body.name) {
      newSlug = await this.generateUniqueSlug(body.name);
    }

    return this.organizationsRepository.updateOrganization(
      params,
      body,
      newSlug,
      user,
    );
  }

  public async getMembership(
    params: GetMembershipParamsDTO,
    user: JwtPayload,
  ): Promise<Membership> {
    const organization =
      await this.organizationsRepository.getOrganizationBySlug(params);

    return this.organizationsRepository.getMembership(organization.id, user);
  }

  public async getMembers(
    params: GetOrganizationBySlugParamsDTO,
    pagination: PaginationQueryDTO,
  ): Promise<PaginatedResponse<Membership>> {
    const organization =
      await this.organizationsRepository.getOrganizationBySlug(params);

    return this.organizationsRepository.getMembers(organization.id, pagination);
  }

  public async updateMember(
    params: UpdateMemberParamsDTO,
    body: UpdateMemberBodyDTO,
    callerMembership: Membership,
    user: JwtPayload,
  ): Promise<Membership> {
    if (body.roles?.includes(RolesEnum.OWNER)) {
      throw new ForbiddenOperationException(
        'Cannot assign owner role directly',
      );
    }

    const targetMembership =
      await this.organizationsRepository.getMembershipById(params.memberId);

    if (targetMembership.isOwner()) {
      throw new ForbiddenOperationException(
        'You do not have permission to update this member',
      );
    }

    if (
      callerMembership.isAdmin() &&
      !callerMembership.isOwner() &&
      targetMembership.isAdmin()
    ) {
      throw new ForbiddenOperationException(
        'You do not have permission to update this member',
      );
    }

    return this.organizationsRepository.updateMember(params, body, user);
  }

  public async deleteOrganization(
    params: DeleteOrganizationParamsDTO,
    user: JwtPayload,
  ): Promise<void> {
    await this.organizationsRepository.deleteOrganization(params, user);
  }

  public async deleteMember(
    params: DeleteMemberParamsDTO,
    callerMembership: Membership,
    user: JwtPayload,
  ): Promise<void> {
    const targetMembership =
      await this.organizationsRepository.getMembershipById(params.memberId);

    if (targetMembership.isOwner()) {
      throw new ForbiddenOperationException(
        'You do not have permission to remove this member',
      );
    }

    if (
      callerMembership.isAdmin() &&
      !callerMembership.isOwner() &&
      targetMembership.isAdmin()
    ) {
      throw new ForbiddenOperationException(
        'You do not have permission to remove this member',
      );
    }

    await this.organizationsRepository.deleteMember(params, user);
  }

  public async transferOwnership(
    params: TransferOwnershipParamsDTO,
    callerMembership: Membership,
    user: JwtPayload,
  ): Promise<Membership> {
    const targetMembership =
      await this.organizationsRepository.getMembershipById(params.memberId);

    if (targetMembership.isOwner()) {
      throw new ForbiddenOperationException(
        'Target member is already the owner',
      );
    }

    return this.organizationsRepository.transferOwnership(
      params,
      callerMembership,
      user,
    );
  }

  protected async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = this.helperService.generateSlug(name);
    let slug = baseSlug;
    let suffix = 2;

    while (await this.organizationsRepository.slugExists(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    if (suffix > 100) {
      throw new SlugAlreadyExistsException();
    }

    return slug;
  }
}
