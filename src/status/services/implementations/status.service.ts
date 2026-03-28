import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IDatabaseService } from '../../../database/services/i.database.service';
import { DependencyStatusEnum } from '../../enums/dependency-status.enum';
import { OverallStatusEnum } from '../../enums/overall-status.enum';
import { DependencyStatus } from '../../models/dependency-status.model';
import { StatusResponse } from '../../models/status-response.model';
import { IStatusService } from '../i.status.service';

@Injectable()
export class StatusService extends IStatusService {
  private readonly logger: Logger;
  private readonly appVersion: string;

  public constructor(
    @Inject(IDatabaseService) databaseService: IDatabaseService,
    @Inject(ConfigService) configService: ConfigService,
  ) {
    super(databaseService, configService);
    this.logger = new Logger(StatusService.name);
    this.appVersion = '1.0.0';
  }

  public async getStatus(): Promise<StatusResponse> {
    const dependencies = await this.checkDependencies();

    const databaseDep = dependencies.find((d) => d.name === 'database');
    const allCriticalUp = databaseDep?.status === DependencyStatusEnum.UP;
    const allUp = dependencies.every(
      (d) =>
        d.status === DependencyStatusEnum.UP ||
        d.status === DependencyStatusEnum.CONFIGURED,
    );

    let overallStatus: OverallStatusEnum;

    if (!allCriticalUp) {
      overallStatus = OverallStatusEnum.UNHEALTHY;
    } else if (!allUp) {
      overallStatus = OverallStatusEnum.DEGRADED;
    } else {
      overallStatus = OverallStatusEnum.HEALTHY;
    }

    return new StatusResponse(
      this.appVersion,
      this.configService.get<string>('NODE_ENV', 'development'),
      process.version,
      overallStatus,
      dependencies,
    );
  }

  private async checkDependencies(): Promise<DependencyStatus[]> {
    const results = await Promise.allSettled([
      this.checkDatabase(),
      this.checkStorage(),
      this.checkPayments(),
    ]);

    const dependencies: DependencyStatus[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        dependencies.push(result.value);
      }
    }

    dependencies.push(this.checkEmail());

    return dependencies;
  }

  private async checkDatabase(): Promise<DependencyStatus> {
    const start = Date.now();

    try {
      const { error } = await this.databaseService
        .from('users')
        .select('id')
        .limit(1);

      const latencyMs = Date.now() - start;

      if (error) {
        this.logger.warn(`Database health check failed: ${error.message}`);
        return new DependencyStatus(
          'database',
          DependencyStatusEnum.DOWN,
          latencyMs,
        );
      }

      return new DependencyStatus(
        'database',
        DependencyStatusEnum.UP,
        latencyMs,
      );
    } catch (error) {
      const latencyMs = Date.now() - start;
      this.logger.warn(`Database health check error: ${String(error)}`);
      return new DependencyStatus(
        'database',
        DependencyStatusEnum.DOWN,
        latencyMs,
      );
    }
  }

  private async checkStorage(): Promise<DependencyStatus> {
    const start = Date.now();

    try {
      const { error } = await this.databaseService.storage.listBuckets();
      const latencyMs = Date.now() - start;

      if (error) {
        this.logger.warn(`Storage health check failed: ${error.message}`);
        return new DependencyStatus(
          'storage',
          DependencyStatusEnum.DOWN,
          latencyMs,
        );
      }

      return new DependencyStatus(
        'storage',
        DependencyStatusEnum.UP,
        latencyMs,
      );
    } catch (error) {
      const latencyMs = Date.now() - start;
      this.logger.warn(`Storage health check error: ${String(error)}`);
      return new DependencyStatus(
        'storage',
        DependencyStatusEnum.DOWN,
        latencyMs,
      );
    }
  }

  private async checkPayments(): Promise<DependencyStatus> {
    const start = Date.now();

    try {
      const apiUrl = this.configService.getOrThrow<string>('ASAAS_API_URL');
      const apiKey = this.configService.getOrThrow<string>('ASAAS_API_KEY');

      const response = await fetch(`${apiUrl}/v3/finance/getCurrentBalance`, {
        method: 'GET',
        headers: {
          access_token: apiKey,
        },
        signal: AbortSignal.timeout(5000),
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        this.logger.warn(
          `Payments health check failed with status: ${response.status}`,
        );
        return new DependencyStatus(
          'payments',
          DependencyStatusEnum.DOWN,
          latencyMs,
        );
      }

      return new DependencyStatus(
        'payments',
        DependencyStatusEnum.UP,
        latencyMs,
      );
    } catch (error) {
      const latencyMs = Date.now() - start;
      this.logger.warn(`Payments health check error: ${String(error)}`);
      return new DependencyStatus(
        'payments',
        DependencyStatusEnum.DOWN,
        latencyMs,
      );
    }
  }

  private checkEmail(): DependencyStatus {
    const hasApiKey = !!this.configService.get<string>('RESEND_API_KEY');
    return new DependencyStatus(
      'email',
      hasApiKey ? DependencyStatusEnum.CONFIGURED : DependencyStatusEnum.DOWN,
      null,
    );
  }
}
