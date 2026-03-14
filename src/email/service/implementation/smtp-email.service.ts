import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IEmailService } from '../i.email.service';

@Injectable()
export class SmtpEmailService extends IEmailService {
  private readonly transporter: nodemailer.Transporter;

  public constructor(@Inject(ConfigService) configService: ConfigService) {
    super(configService);
    this.transporter = nodemailer.createTransport({
      host: configService.getOrThrow<string>('SMTP_HOST'),
      port: configService.getOrThrow<number>('SMTP_PORT'),
      secure: false,
    });
  }

  public async sendPasswordResetEmail(
    to: string,
    resetToken: string,
  ): Promise<void> {
    const resetLink = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    await this.transporter.sendMail({
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

    await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject: `You've been invited to join ${organizationName}`,
      html: `<p>You've been invited to join <strong>${organizationName}</strong>. Click <a href="${invitesLink}">here</a> to view your pending invites.</p>`,
    });
  }
}
