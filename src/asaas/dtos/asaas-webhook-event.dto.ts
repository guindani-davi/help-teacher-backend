import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AsaasWebhookEventDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  public event: string;

  @IsOptional()
  @MaxLength(255)
  public id?: string;

  @IsOptional()
  @MaxLength(255)
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
