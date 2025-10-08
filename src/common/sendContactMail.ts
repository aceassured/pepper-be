import * as nodemailer from 'nodemailer';
import { ContactDto } from '../user/dto/contact.dto';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendContactMail = async (contact: ContactDto) => {
    const { name, email, phone, message } = contact;

    // Admin Email
    const adminOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: 'New Contact Form Submission',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px; border: 1px solid #e0e0e0; color: #1F2937;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://res.cloudinary.com/dxzynb5wu/image/upload/v1759910577/div_exyjwr.png" alt="Kumbukkai Pepper" style="height: 60px;">
        </div>
        <h2 style="color: #111827; text-align: center;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone/WhatsApp:</strong> ${phone}</p>` : ''}
        <p><strong>Message:</strong><br/> ${message}</p>
        <hr style="border: none; border-top: 1px solid #111827; margin: 20px 0;">
        <p style="text-align: center; font-size: 12px; color: #111827;">
          This message was sent from the Kumbukkai Pepper Contact Form.
        </p>
      </div>
    `,
    };

    // User Thank You Email
    const userOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Thank You for Contacting Kumbukkai Pepper',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px; border: 1px solid #e0e0e0; color: #1F2937;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://res.cloudinary.com/dxzynb5wu/image/upload/v1759910577/div_exyjwr.png" alt="Kumbukkai Pepper" style="height: 60px;">
        </div>
        <h2 style="color: #111827; text-align: center;">Thank You, ${name}!</h2>
        <p style="text-align: center;">We have received your message and our team will get back to you within 24–48 hours.</p>
        <p style="text-align: center;"><strong>Your Message:</strong></p>
        <p style="background-color: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #1F2937; color: #111827;">${message}</p>
        <p style="text-align: center; font-size: 12px; color: #1F2937; margin-top: 20px;">
          Kumbukkai Pepper Team
        </p>
      </div>
    `,
    };

    await transporter.sendMail(adminOptions);
    await transporter.sendMail(userOptions);
};
