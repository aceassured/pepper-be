import * as nodemailer from 'nodemailer'


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})


export const sendOtpToUser = (email: string, otp: string) => {
    // 
    const options = {
        from: 'no-reply@gmail.com',
        to: email,
        subject: 'OTP for Password Recovery',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Password Recovery OTP</h2>
            <p style="font-size: 14px; color: #555;">
              Please use the following One-Time Password (OTP) to verify your identity and reset your password.
            </p>
            <p style="font-size: 14px; color: #555; margin-bottom: 20px;">
              This OTP is valid only for <strong>5 minutes</strong>.
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #222; background-color: #fff; padding: 12px 24px; border: 1px dashed #888; border-radius: 6px;">
                ${otp}
              </span>
            </div>
            <p style="font-size: 12px; color: #999; text-align: center;">
              If you did not request this, please ignore this email.
            </p>
          </div>
        `,
    };
    transporter.sendMail(options)
}