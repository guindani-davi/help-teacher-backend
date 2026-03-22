import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AsaasWebhookEventDTO {
  @IsString()
  @IsNotEmpty()
  public event: string;

  @IsOptional()
  public id?: string;

  @IsOptional()
  public dateCreated?: string;

  @IsOptional()
  public payment?: {
    subscription?: string;
    customer?: string;
    externalReference?: string;
    dateCreated?: string;
  };

  @IsOptional()
  public subscription?: {
    id?: string;
    customer?: string;
    externalReference?: string;
    status?: string;
  };
}
