import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { IEmailService } from '../i.email.service';

@Injectable()
export class ResendEmailService extends IEmailService {
  private readonly resend: Resend;

  public constructor(@Inject(ConfigService) configService: ConfigService) {
    super(configService);
    this.resend = new Resend(
      configService.getOrThrow<string>('RESEND_API_KEY'),
    );
  }

  public async sendPasswordResetEmail(
    to: string,
    resetToken: string,
  ): Promise<void> {
    const resetLink = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    await this.resend.emails.send({
      from: this.fromAddress,
      to,
      subject: 'Reset your password',
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });
  }

  public async sendInviteEmail(
    to: string,
    organizationName: string,
  ): Promise<void> {
    const invitesLink = `${this.frontendUrl}/invites`;

    await this.resend.emails.send({
      from: this.fromAddress,
      to,
      subject: `You've been invited to join ${organizationName}`,
      html: `<p>You've been invited to join <strong>${organizationName}</strong>. Click <a href="${invitesLink}">here</a> to view your pending invites.</p>`,
    });
  }
}
