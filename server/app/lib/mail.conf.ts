import nodemailer from 'nodemailer';
import Mailgen from 'mailgen';
import envConf from '../../envConf';

const transporter = nodemailer.createTransport({
  host: envConf.MAILTRAP_HOST,
  port: envConf.MAILTRAP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: envConf.MAILTRAP_USER,
    pass: envConf.MAILTRAP_PASSWORD,
  },
} as nodemailer.TransportOptions);

const mailGenerator = new Mailgen({
  theme: 'default',
  product: {
    name: 'Auth System - UnknownBug Tech',
    link: 'https://authsystem.unknownbug.tech/',
    // logo: 'https://unknownbug.tech/logo.png', // Replace with your logo URL
  },
});

export const generateVerificationEmail = (
  name: string,
  verificationURL: string
) => {
  const email = {
    body: {
      name: name,
      intro:
        'Welcome to auth system! a system just for testing how authentication works.',
      action: {
        instructions:
          'To verify your email address, please click the button below:',
        button: {
          color: '#22BC66', // Optional action button color
          text: 'Confirm your email',
          link: verificationURL,
        },
      },
    },
  };

  return {
    emailBody: mailGenerator.generate(email),
    emailText: mailGenerator.generatePlaintext(email),
  };
};
export const generatePasswordResetMail = (
  name: string,
  verificationURL: string
) => {
  const email = {
    body: {
      name: name,
      intro:
        'Welcome to auth system! a system just for testing how authentication works.\nBelow is the given URL for updating your password',
      action: {
        instructions:
          'To verify your email address, please click the button below:',
        button: {
          color: '#22BC66', // Optional action button color
          text: 'Confirm your email',
          link: verificationURL,
        },
      },
      outro:"If it was not you then report it"
    },
  };

  return {
    emailBody: mailGenerator.generate(email),
    emailText: mailGenerator.generatePlaintext(email),
  };
};

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
) {
  try {
    const info = await transporter.sendMail({
      from: envConf.MAILTRAP_FROM_EMAIL,
      to,
      subject,
      html,
      text: text ?? undefined, // Optional plain text version
    });

    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}
