import { stringConstants } from 'src/utils/string.constant';

export const emailTemplates = {
  [stringConstants.LANG_ES]: {
    sendCodeMessage: (userName: string, code: string, primaryColor: string) => `
    <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
      <div style="background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #fff; font-size: 28px; margin: 0;">Código de Restablecimiento de Contraseña</h1>
      </div>
      <div style="padding: 20px; text-align: center;">
        <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
          Hola <strong>${userName}</strong>,<br />
          Has solicitado restablecer tu contraseña. Por favor, usa el siguiente código dentro de las próximas 24 horas para completar el proceso:
        </p>
        <div style="margin: 30px auto; background-color: #f9f9f9; padding: 15px 20px; display: inline-block; border-radius: 5px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <span style="font-size: 28px; font-weight: bold; color: ${primaryColor}; letter-spacing: 2px;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #999; margin-top: 20px;">
          Si no solicitaste este restablecimiento de contraseña, por favor ignora este correo.
        </p>
      </div>
      <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
        <p style="font-size: 14px; color: #666;">¿Necesitas ayuda? Contáctanos en cualquier momento, ¡estamos aquí para ti!</p>
        <p style="font-size: 14px; color: #333;">– El Equipo OSM</p>
      </div>
    </div>`,

    sendWelcomeMessage: (userName: string, appUrl: string, primaryColor: string) => `
    <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
      <div style="background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #fff; font-size: 28px; margin: 0;">¡Bienvenido al Equipo OSM! 🎉</h1>
      </div>
      <div style="padding: 20px; text-align: center;">
        <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
          Hola <strong>${userName}</strong>, ¡estamos muy emocionados de tenerte aquí! Prepárate para explorar increíbles funciones diseñadas especialmente para ti. Pero primero, aseguremos tu cuenta.
        </p>
        <div style="margin: 20px 0;">
          <a href="${appUrl}/reset-password" 
             style="display: inline-block; background-color:${primaryColor}; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-size: 16px; font-weight: bold; transition: background-color 0.3s ease;">
            Restablecer tu Contraseña
          </a>
        </div>
        <p style="font-size: 16px; color: #666; margin-bottom: 20px;">Una vez que hayas restablecido tu contraseña, comienza a explorar y aprovecha al máximo tu nueva cuenta.</p>
      </div>
      <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
        <p style="font-size: 14px; color: #666;">¿Necesitas ayuda? Contáctanos en cualquier momento, ¡estamos aquí para ti!</p>
        <p style="font-size: 14px; color: #333;">– El Equipo OSM</p>
      </div>
    </div>`,

    sendCardAssignmentMessage: (userName: string, cardName: string, link: string) => `
    <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
      <div style="background-color: #007bff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #fff; font-size: 24px; margin: 0;">Nueva Asignación de Tarjeta</h1>
      </div>
      <div style="padding: 20px; text-align: center;">
        <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
          Hola <strong>${userName}</strong>,<br />
          Se te ha asignado la tarjeta <strong>${cardName}</strong>. Puedes verla usando el siguiente enlace:
        </p>
        <div style="margin: 20px 0;">
          <a href="${link}" 
             style="display: inline-block; background-color:#007bff; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-size: 16px; font-weight: bold; transition: background-color 0.3s ease;">
            Ver Tarjeta
          </a>
        </div>
        <p style="font-size: 14px; color: #999; margin-top: 20px;">
          Si tienes alguna pregunta, por favor contáctanos.
        </p>
      </div>
      <div style="background-color: #f9f9f9; padding: 15px; text-align: center; border-radius: 0 0 10px 10px;">
        <p style="font-size: 14px; color: #666;">– El Equipo OSM</p>
      </div>
    </div>`
  },

  [stringConstants.LANG_EN]: {
    sendCodeMessage: (userName: string, code: string, primaryColor: string) => `
    <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
      <div style="background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #fff; font-size: 28px; margin: 0;">Password Reset Code</h1>
      </div>
      <div style="padding: 20px; text-align: center;">
        <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
          Hello <strong>${userName}</strong>,<br />
          You requested to reset your password. Please use the following code within the next 24 hours to complete the process:
        </p>
        <div style="margin: 30px auto; background-color: #f9f9f9; padding: 15px 20px; display: inline-block; border-radius: 5px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <span style="font-size: 28px; font-weight: bold; color: ${primaryColor}; letter-spacing: 2px;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #999; margin-top: 20px;">
          If you did not request this password reset, please ignore this email.
        </p>
      </div>
      <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
        <p style="font-size: 14px; color: #666;">Need help? Reach out to us anytime—we're here for you!</p>
        <p style="font-size: 14px; color: #333;">– The OSM Team</p>
      </div>
    </div>`,

    sendWelcomeMessage: (userName: string, appUrl: string, primaryColor: string) => `
    <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
      <div style="background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #fff; font-size: 28px; margin: 0;">Welcome to OSM Team! 🎉</h1>
      </div>
      <div style="padding: 20px; text-align: center;">
        <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
          Hello <strong>${userName}</strong>, we're so excited to have you here! Get ready to explore amazing features designed just for you. But first, let's secure your account.
        </p>
        <div style="margin: 20px 0;">
          <a href="${appUrl}/reset-password" 
             style="display: inline-block; background-color:${primaryColor}; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-size: 16px; font-weight: bold; transition: background-color 0.3s ease;">
            Reset Your Password
          </a>
        </div>
        <p style="font-size: 16px; color: #666; margin-bottom: 20px;">Once you've reset your password, dive in and make the most of your new account.</p>
      </div>
      <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
        <p style="font-size: 14px; color: #666;">Need help? Reach out to us anytime—we're here for you!</p>
        <p style="font-size: 14px; color: #333;">– The OSM Team</p>
      </div>
    </div>`,

    sendCardAssignmentMessage: (userName: string, cardName: string, link: string) => `
    <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
      <div style="background-color: #007bff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #fff; font-size: 24px; margin: 0;">New Card Assignment</h1>
      </div>
      <div style="padding: 20px; text-align: center;">
        <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
          Hello <strong>${userName}</strong>,<br />
          You have been assigned the card <strong>${cardName}</strong>. You can view it using the following link:
        </p>
        <div style="margin: 20px 0;">
          <a href="${link}" 
             style="display: inline-block; background-color:#007bff; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-size: 16px; font-weight: bold; transition: background-color 0.3s ease;">
            View Card
          </a>
        </div>
        <p style="font-size: 14px; color: #999; margin-top: 20px;">
          If you have any questions, please contact us.
        </p>
      </div>
      <div style="background-color: #f9f9f9; padding: 15px; text-align: center; border-radius: 0 0 10px 10px;">
        <p style="font-size: 14px; color: #666;">– The OSM Team</p>
      </div>
    </div>`
  }
};
