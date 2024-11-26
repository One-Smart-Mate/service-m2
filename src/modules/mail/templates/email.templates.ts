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
export const sendWelcomeMessage = (
  userName: string,
  appUrl: string // Recibe la URL base como argumento
) => `
  <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff; position: relative; overflow: hidden;">
  
    <!-- Decorative Shapes -->
    <div style="position: absolute; top: -50px; left: -50px; background-color: #FF5A5F; width: 150px; height: 150px; border-radius: 50%; opacity: 0.2;"></div>
    <div style="position: absolute; bottom: -50px; right: -50px; background-color: #FF5A5F; width: 150px; height: 150px; border-radius: 50%; opacity: 0.2;"></div>
  
    <!-- Header -->
    <div style="background-color: #FF5A5F; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: #fff; font-size: 28px; margin: 0;">Welcome to OSM Team! 🎉</h1>
    </div>
  
    <!-- Main Content -->
    <div style="padding: 20px; text-align: center;">
      <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
        Hello <strong>${userName}</strong>, we’re so excited to have you here! Get ready to explore amazing features designed just for you. But first, let’s secure your account.
      </p>
      <div style="margin: 20px 0;">
        <a href="${appUrl}/reset-password" 
           style="display: inline-block; background-color: #FF5A5F; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-size: 16px; font-weight: bold; transition: background-color 0.3s ease;">
          Reset Your Password
        </a>
      </div>
      <p style="font-size: 16px; color: #666; margin-bottom: 20px;">Once you’ve reset your password, dive in and make the most of your new account.</p>
    </div>
  
    <!-- Footer -->
    <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
      <p style="font-size: 14px; color: #666;">Need help? Reach out to us anytime—we’re here for you!</p>
      <p style="font-size: 14px; color: #333;">– The OSM Team</p>
    </div>
</div>
`;
