import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { LocaleEnum } from '../../../i18n/enums/locale.enum';
import { II18nService } from '../../../i18n/services/i.i18n.service';
import { IEmailService } from '../i.email.service';

@Injectable()
export class EmailService extends IEmailService {
  private readonly fromAddress: string;
  private readonly frontendUrl: string;
  private readonly resend: Resend;
  private readonly configService: ConfigService;

  public constructor(
    @Inject(ConfigService) configService: ConfigService,
    @Inject(II18nService) i18nService: II18nService,
  ) {
    super(i18nService);
    this.configService = configService;
    this.fromAddress = this.configService.getOrThrow<string>('EMAIL_FROM');
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
  }

  public async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    locale: LocaleEnum,
  ): Promise<void> {
    const resetLink = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    const subject = this.i18nService.t(locale, 'emails.passwordReset.subject');
    const html = this.i18nService.t(locale, 'emails.passwordReset.body', {
      link: resetLink,
    });

    await this.resend.emails.send({
      from: this.fromAddress,
      to,
      subject,
      html,
    });
  }

  public async sendInviteEmail(
    to: string,
    organizationName: string,
    locale: LocaleEnum,
  ): Promise<void> {
    const invitesLink = `${this.frontendUrl}/invites`;
    const safeName = this.escapeHtml(organizationName);

    const subject = this.i18nService.t(locale, 'emails.invite.subject', {
      orgName: organizationName,
    });
    const html = this.i18nService.t(locale, 'emails.invite.body', {
      orgName: safeName,
      link: invitesLink,
    });

    await this.resend.emails.send({
      from: this.fromAddress,
      to,
      subject,
      html,
    });
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
