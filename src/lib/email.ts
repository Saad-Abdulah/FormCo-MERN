import sgMail from '@sendgrid/mail';

// Set the API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const msg = {
      to: options.to,
      from: process.env.SENDGRID_FROM_EMAIL || 'sadibhatti274@gmail.com', // Use your verified sender
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    await sgMail.send(msg);
    console.log('Email sent successfully to:', options.to);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

export const sendVerificationEmail = async (email: string, verificationCode: string, organizationName: string) => {
  const subject = 'Verify your organization email - FormCo';
  const text = `Your verification code for ${organizationName} is: ${verificationCode}. This code will expire in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">FormCo</h1>
        <p style="color: #6b7280; margin: 5px 0;">Competition Management Platform</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px; border-left: 4px solid #2563eb;">
        <h2 style="color: #1f2937; margin-top: 0;">Email Verification Required</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          Hello! You're registering <strong>${organizationName}</strong> on FormCo.
        </p>
        <p style="color: #4b5563; line-height: 1.6;">
          Please use the verification code below to complete your registration:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #2563eb; color: white; font-size: 24px; font-weight: bold; padding: 15px 30px; border-radius: 6px; display: inline-block; letter-spacing: 2px;">
            ${verificationCode}
          </div>
        </div>
        
        <p style="color: #ef4444; font-size: 14px;">
          ⚠️ This code will expire in 10 minutes for security purposes.
        </p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          If you didn't request this verification, please ignore this email.
        </p>
      </div>
    </div>
  `;

  return await sendEmail({ to: email, subject, text, html });
}; 