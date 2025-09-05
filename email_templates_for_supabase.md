# Email Templates for Supabase Dashboard

## 1. Confirmation Email Template

**Subject:** Email Confirmation

**HTML Content:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Bexforte</title>
  <style>
    @media only screen and (max-width: 480px) {
      .container {
        max-width: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
      }
      .header {
        padding: 20px !important;
      }
      .content {
        padding: 20px !important;
      }
      .button {
        width: 100% !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; padding: 20px; max-width: 600px; margin: 0 auto; color: #1f2937; background-color: #f9fafb;">
  <div style="text-align: center; margin-bottom: 24px;">
    <img src="https://www.bexforte.com/favicon.ico" alt="Bexforte" style="height: 32px; width: 32px;">
  </div>

  <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="margin: 0 0 16px; color: #1f2937; font-size: 28px; font-weight: 700;">Welcome to Bexforte! 🎉</h1>
      <p style="margin: 0; color: #6b7280; font-size: 16px;">Your account has been created successfully</p>
    </div>

    <div style="margin: 32px 0; text-align: center;">
      <p style="font-weight: 500; color: #1f2937; margin-bottom: 16px; font-size: 16px;">
        Please verify your email address to activate your account:
      </p>
      <a href="{{ .ConfirmationURL }}"
         style="display: inline-block; background-color: #7c5295; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Verify My Email
      </a>
    </div>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        • This link will expire in 24 hours<br>
        • If you didn't create this account, you can safely ignore this email
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 32px; color: #6b7280; font-size: 14px;">
    <p style="margin-bottom: 8px;">Best regards,<br>The Bexforte Team</p>
    <p>© 2025 Bexforte. All rights reserved.</p>
  </div>
</body>
</html>
```

## 2. Password Reset Template

**Subject:** Reset your password

**HTML Content:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - Bexforte</title>
  <style>
    @media only screen and (max-width: 480px) {
      .container {
        max-width: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
      }
      .header {
        padding: 20px !important;
      }
      .content {
        padding: 20px !important;
      }
      .button {
        width: 100% !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; padding: 20px; max-width: 600px; margin: 0 auto; color: #1f2937; background-color: #f9fafb;">
  <div style="text-align: center; margin-bottom: 24px;">
    <img src="https://www.bexforte.com/favicon.ico" alt="Bexforte" style="height: 32px; width: 32px;">
  </div>

  <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="margin: 0 0 16px; color: #1f2937; font-size: 28px; font-weight: 700;">Reset Your Password</h1>
      <p style="margin: 0; color: #6b7280; font-size: 16px;">We received a request to reset your password</p>
    </div>

    <div style="margin: 32px 0; text-align: center;">
      <p style="font-weight: 500; color: #1f2937; margin-bottom: 16px; font-size: 16px;">
        Click the button below to reset your password:
      </p>
      <a href="{{ .ConfirmationURL }}"
         style="display: inline-block; background-color: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Reset My Password
      </a>
    </div>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        • This link will expire in 1 hour<br>
        • If you didn't request this reset, you can safely ignore this email
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 32px; color: #6b7280; font-size: 14px;">
    <p style="margin-bottom: 8px;">Best regards,<br>The Bexforte Team</p>
    <p>© 2025 Bexforte. All rights reserved.</p>
  </div>
</body>
</html>
```

## 3. Invite Template

**Subject:** You have been invited

**HTML Content:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to Bexforte</title>
  <style>
    @media only screen and (max-width: 480px) {
      .container {
        max-width: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
      }
      .header {
        padding: 20px !important;
      }
      .content {
        padding: 20px !important;
      }
      .button {
        width: 100% !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; padding: 20px; max-width: 600px; margin: 0 auto; color: #1f2937; background-color: #f9fafb;">
  <div style="text-align: center; margin-bottom: 24px;">
    <img src="https://www.bexforte.com/favicon.ico" alt="Bexforte" style="height: 32px; width: 32px;">
  </div>

  <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="margin: 0 0 16px; color: #1f2937; font-size: 28px; font-weight: 700;">You're Invited! 🎉</h1>
      <p style="margin: 0; color: #6b7280; font-size: 16px;">Join Bexforte and start collaborating</p>
    </div>

    <div style="margin: 32px 0; text-align: center;">
      <p style="font-weight: 500; color: #1f2937; margin-bottom: 16px; font-size: 16px;">
        Click the button below to accept your invitation:
      </p>
      <a href="{{ .ConfirmationURL }}"
         style="display: inline-block; background-color: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </div>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        • This invitation will expire in 7 days<br>
        • If you didn't expect this invitation, you can safely ignore this email
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 32px; color: #6b7280; font-size: 14px;">
    <p style="margin-bottom: 8px;">Best regards,<br>The Bexforte Team</p>
    <p>© 2025 Bexforte. All rights reserved.</p>
  </div>
</body>
</html>
```

## Configuration Steps:

1. **Go to Supabase Dashboard → Authentication → Email Templates**
2. **For each template (Confirmation, Recovery, Invite):**
   - Click "Edit"
   - Replace the default HTML with the content above
   - Save changes
3. **Go to Authentication → SMTP Settings**
4. **Fill in the SMTP configuration as specified above**
5. **Test the email functionality**
