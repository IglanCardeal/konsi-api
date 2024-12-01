import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { RedisService } from '../redis/redis.service';
import { BenefitsApiResponseMapped, BenefitsApiResponse } from './inss.dto';

@Injectable()
export class INSSService {
  private apiUrl: string;
  private apiUser: string;
  private apiPassword: string;
  private apiBenfitsRoutePath: string;
  private apiAuthTokenRoutePath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly redisService: RedisService,
  ) {
    this.apiUrl = this.configService.getOrThrow<string>('INSS_API_HOST');
    this.apiUser = this.configService.getOrThrow<string>('INSS_API_USER');
    this.apiPassword =
      this.configService.getOrThrow<string>('INSS_API_PASSWORD');
    this.apiBenfitsRoutePath = this.configService.getOrThrow<string>(
      'INSS_API_BENEFITS_PATH',
    );
    this.apiAuthTokenRoutePath = this.configService.getOrThrow<string>(
      'INSS_API_AUTH_TOKEN_PATH',
    );
  }

  async getBenefitsData(
    cpf: string,
    clearCacheToken: boolean = false,
  ): Promise<BenefitsApiResponseMapped[]> {
    try {
      this.logger.info(
        `[${INSSService.name}.getBenefitsData()] Making api call`,
        { cpf },
      );

      const token = await this.getApiAuthToken(clearCacheToken);
      const path = this.apiBenfitsRoutePath.replace('{cpf}', cpf);
      const response = await fetch(`${this.apiUrl}${path}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 && !clearCacheToken) {
        this.logger.info(
          `[${INSSService.name}.getBenefitsData()] Token expired. Getting new auth token.`,
        );
        return this.getBenefitsData(cpf, true);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { data } = await response.json();
      const benefitsArr = data.beneficios as BenefitsApiResponse[];

      if (!benefitsArr?.length) {
        throw new Error(`HTTP error! Missing benefits data`);
      }

      return benefitsArr.map(this.mapBenefitData);
    } catch (error) {
      this.logger.error(
        `[${INSSService.name}.getBenefitsData()] Error while getting benefits data`,
        error,
      );
      throw error;
    }
  }

  private async getApiAuthToken(clearTokenCache = false): Promise<string> {
    try {
      const cachedToken = await this.redisService.get('inss-api-token');

      if (cachedToken && !clearTokenCache) return cachedToken;

      const params = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          username: this.apiUser,
          password: this.apiPassword,
        }),
      };
      const response = await fetch(
        `${this.apiUrl}${this.apiAuthTokenRoutePath}`,
        params,
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const {
        data: { token },
      } = await response.json();

      if (!token) throw new Error(`HTTP error! Missing auth token`);

      await this.redisService.set('inss-api-token', token);

      return token;
    } catch (error) {
      this.logger.error(
        `[${INSSService.name}.getApiAuthToken()] Error while getting token`,
        error,
      );
      throw error;
    }
  }

  private mapBenefitData(data: BenefitsApiResponse): BenefitsApiResponseMapped {
    return {
      number: data.numero_beneficio,
      code: data.codigo_tipo_beneficio,
    };
  }
}
