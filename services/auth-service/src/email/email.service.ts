import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.fromEmail = this.configService.get('EMAIL_FROM', 'onboarding@resend.dev');

    this.logger.log(`Email service initialized with from: ${this.fromEmail}`);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    this.logger.log(`Sending password reset email to: ${email}`);

    const { data, error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: email,
      subject: 'Recuperacao de Senha - Meus Albuns de Fotos',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Recuperacao de Senha</h1>
          <p>Voce solicitou a recuperacao de senha da sua conta.</p>
          <p>Clique no botao abaixo para criar uma nova senha:</p>
          <a href="${resetUrl}"
             style="display: inline-block;
                    background-color: #2563eb;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 16px 0;">
            Redefinir Senha
          </a>
          <p style="color: #666; font-size: 14px;">
            Este link expira em 1 hora.
          </p>
          <p style="color: #666; font-size: 14px;">
            Se voce nao solicitou esta recuperacao, ignore este email.
          </p>
        </div>
      `,
    });

    if (error) {
      this.logger.error(`Failed to send email: ${JSON.stringify(error)}`);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    this.logger.log(`Email sent successfully. ID: ${data?.id}`);
  }
}
