export const sendCodeMessage = (userName: string, code: string) => {
  return `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; text-align: center; max-width: 600px; margin: auto; padding: 20px;">
            <h1 style="color: #e73773;">M2</h1>
            <p>Hello ${userName},</p>
            <p>You have requested to reset your password. Please use the following code to reset your password. This code is valid for only 24 hours.</p>
            <div style="margin: 20px 0;">
              <span style="font-size: 24px; font-weight: bold; color: #e73773; background-color: #f9f9f9; padding: 10px; border-radius: 5px;">${code}</span>
            </div>
            <p>If you did not request a password reset, please ignore this email.</p>
            <p>Thank you,</p>
            <p>The M2 Team</p>
          </div>
        `;
};
