import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { AllowedRoles } from '../../../auth/decorators/roles.decorator';
import { RolesEnum } from '../../../auth/enums/roles.enum';
import { MembershipGuard } from '../../../auth/guards/membership.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import type { JwtPayload } from '../../../auth/models/jwt.model';
import { CreateOrganizationBodyDTO } from '../../dtos/create-organization.dto';
import { DeleteOrganizationParamsDTO } from '../../dtos/delete-organization.dto';
import { GetOrganizationBySlugParamsDTO } from '../../dtos/get-organization.dto';
import {
  UpdateOrganizationBySlugBodyDTO,
  UpdateOrganizationBySlugParamsDTO,
} from '../../dtos/update-organization.dto';
import { UploadLogoParamsDTO } from '../../dtos/upload-logo.dto';
import { Organization } from '../../models/organization.model';
import { IOrganizationsService } from '../../services/i.organizations.service';
import { IOrganizationsController } from '../i.organizations.controller';

@Controller('organizations')
export class OrganizationsController extends IOrganizationsController {
  public constructor(
    @Inject(IOrganizationsService)
    organizationsService: IOrganizationsService,
  ) {
    super(organizationsService);
  }

  @Post()
  public async createOrganization(
    @Body() body: CreateOrganizationBodyDTO,
    @CurrentUser() user: JwtPayload,
  ): Promise<Organization> {
    return this.organizationsService.createOrganization(body, user);
  }

  @Get(':slug')
  @UseGuards(MembershipGuard)
  public async getOrganizationBySlug(
    @Param() params: GetOrganizationBySlugParamsDTO,
  ): Promise<Organization> {
    return this.organizationsService.getOrganizationBySlug(params);
  }

  @Patch(':slug')
  @UseGuards(MembershipGuard, RolesGuard)
  @AllowedRoles(RolesEnum.OWNER)
  public async updateOrganization(
    @Param() params: UpdateOrganizationBySlugParamsDTO,
    @Body() body: UpdateOrganizationBySlugBodyDTO,
    @CurrentUser() user: JwtPayload,
  ): Promise<Organization> {
    return this.organizationsService.updateOrganization(params, body, user);
  }

  @Delete(':slug')
  @UseGuards(MembershipGuard, RolesGuard)
  @AllowedRoles(RolesEnum.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteOrganization(
    @Param() params: DeleteOrganizationParamsDTO,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.organizationsService.deleteOrganization(params, user);
  }

  @Put(':slug/logo')
  @UseGuards(MembershipGuard, RolesGuard)
  @AllowedRoles(RolesEnum.OWNER, RolesEnum.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  public async uploadLogo(
    @Param() params: UploadLogoParamsDTO,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(png|jpeg)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ): Promise<Organization> {
    return this.organizationsService.uploadLogo(params.slug, file, user);
  }
}
