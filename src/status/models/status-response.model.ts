import { OverallStatusEnum } from '../enums/overall-status.enum';
import { DependencyStatus } from './dependency-status.model';

export class StatusResponse {
  public readonly version: string;
  public readonly environment: string;
  public readonly nodeVersion: string;
  public readonly status: OverallStatusEnum;
  public readonly dependencies: DependencyStatus[];

  public constructor(
    version: string,
    environment: string,
    nodeVersion: string,
    status: OverallStatusEnum,
    dependencies: DependencyStatus[],
  ) {
    this.version = version;
    this.environment = environment;
    this.nodeVersion = nodeVersion;
    this.status = status;
    this.dependencies = dependencies;
  }
}
