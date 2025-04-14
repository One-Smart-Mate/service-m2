import { stringConstants } from 'src/utils/string.constant';

const getEmailTemplate = (lang: typeof stringConstants.LANG_ES | typeof stringConstants.LANG_EN) => {
  const t = stringConstants.emailTemplates[lang];
  
  return {
    sendCodeMessage: (userName: string, code: string, primaryColor: string) => `
    <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
      <div style="background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #fff; font-size: 28px; margin: 0;">${t.resetPassword.subject}</h1>
      </div>
      <div style="padding: 20px; text-align: center;">
        <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
          ${t.resetPassword.greeting} <strong>${userName}</strong>,<br />
          ${t.resetPassword.message}
        </p>
        <div style="margin: 30px auto; background-color: #f9f9f9; padding: 15px 20px; display: inline-block; border-radius: 5px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <span style="font-size: 28px; font-weight: bold; color: ${primaryColor}; letter-spacing: 2px;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #999; margin-top: 20px;">
          ${t.resetPassword.warning}
        </p>
      </div>
      <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
        <p style="font-size: 14px; color: #666;">${t.resetPassword.help}</p>
        <p style="font-size: 14px; color: #333;">${t.resetPassword.team}</p>
      </div>
    </div>`,

    sendWelcomeMessage: (userName: string, appUrl: string, primaryColor: string) => `
    <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
      <div style="background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #fff; font-size: 28px; margin: 0;">${t.welcome.subject}</h1>
      </div>
      <div style="padding: 20px; text-align: center;">
        <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
          ${t.welcome.greeting} <strong>${userName}</strong>, ${t.welcome.message}
        </p>
        <div style="margin: 20px 0;">
          <a href="${appUrl}/reset-password" 
             style="display: inline-block; background-color:${primaryColor}; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-size: 16px; font-weight: bold; transition: background-color 0.3s ease;">
            ${t.welcome.button}
          </a>
        </div>
        <p style="font-size: 16px; color: #666; margin-bottom: 20px;">${t.welcome.footer}</p>
      </div>
      <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
        <p style="font-size: 14px; color: #666;">${t.welcome.help}</p>
        <p style="font-size: 14px; color: #333;">${t.welcome.team}</p>
      </div>
    </div>`,

    sendCardAssignmentMessage: (userName: string, cardName: string, link: string, primaryColor: string) => `
    <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
      <div style="background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #fff; font-size: 28px; margin: 0;">${t.cardAssignment.subject}</h1>
      </div>
      <div style="padding: 20px; text-align: center;">
        <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
          ${t.cardAssignment.greeting} <strong>${userName}</strong>,<br />
          ${t.cardAssignment.message} <strong>${cardName}</strong>. ${t.cardAssignment.footer}
        </p>
        <div style="margin: 20px 0;">
          <a href="${link}" 
             style="display: inline-block; background-color:${primaryColor}; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-size: 16px; font-weight: bold; transition: background-color 0.3s ease;">
            ${t.cardAssignment.button}
          </a>
        </div>
      </div>
      <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
        <p style="font-size: 14px; color: #666;">${t.cardAssignment.help}</p>
        <p style="font-size: 14px; color: #333;">${t.cardAssignment.team}</p>
      </div>
    </div>`
  };
};

export const emailTemplates = {
  [stringConstants.LANG_ES]: getEmailTemplate(stringConstants.LANG_ES),
  [stringConstants.LANG_EN]: getEmailTemplate(stringConstants.LANG_EN)
};
