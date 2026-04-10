import { DependencyStatusEnum } from '../enums/dependency-status.enum';

export class DependencyStatus {
  public readonly name: string;
  public readonly status: DependencyStatusEnum;
  public readonly latencyMs: number | null;

  public constructor(
    name: string,
    status: DependencyStatusEnum,
    latencyMs: number | null,
  ) {
    this.name = name;
    this.status = status;
    this.latencyMs = latencyMs;
  }
}
