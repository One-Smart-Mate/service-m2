export const sendCodeMessage = (userName: string, code: string, primaryColor: string) => {
  return `
  <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
    
    <!-- Header -->
    <div style="background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: #fff; font-size: 28px; margin: 0;">Password Reset Code</h1>
    </div>

    <!-- Main Content -->
    <div style="padding: 20px; text-align: center;">
      <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
        Hello <strong>${userName}</strong>,<br />
        You requested to reset your password. Please use the following code within the next 24 hours to complete the process:
      </p>

      <!-- Code Section -->
      <div style="margin: 30px auto; background-color: #f9f9f9; padding: 15px 20px; display: inline-block; border-radius: 5px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <span style="font-size: 28px; font-weight: bold; color: ${primaryColor}; letter-spacing: 2px;">${code}</span>
      </div>

      <p style="font-size: 14px; color: #999; margin-top: 20px;">
        If you did not request this password reset, please ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
      <p style="font-size: 14px; color: #666;">Need help? Reach out to us anytime—we’re here for you!</p>
      <p style="font-size: 14px; color: #333;">– The OSM Team</p>
    </div>
  </div>`;
};

export const sendWelcomeMessage = (userName: string, appUrl: string, primaryColor: string) => { 
  return `
  <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background-color: #fff;">
  
    <!-- Header -->
    <div style="background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: #fff; font-size: 28px; margin: 0;">Welcome to OSM Team! 🎉</h1>
    </div>
  
    <!-- Main Content -->
    <div style="padding: 20px; text-align: center;">
      <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
        Hello <strong>${userName}</strong>, we’re so excited to have you here! Get ready to explore amazing features designed just for you. But first, let’s secure your account.
      </p>
      <div style="margin: 20px 0;">
        <a href="${appUrl}/reset-password" 
           style="display: inline-block; background-color:${primaryColor}; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-size: 16px; font-weight: bold; transition: background-color 0.3s ease;">
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
  </div>`;
};
