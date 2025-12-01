// sendSummaryReport.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendRefundRequestEmail = async (refundRequest) => {
  const {
    orderId,
    productName,
    quantity,
    totalAmountInPaise,
    fullName,
    email,
    phone,
    deliveryAddress,
    state,
    district,
    pincode,
    refundRequestDate,
    paymentMethod,
    deliveryDate,
    deliveryLocation,
    status,
    refundStatus,
  } = refundRequest;

  const mailOptions = {
    from: "Kumbuckal Pepper Nursery <no-reply@kumbuckalpepper.com>",
    to: process.env.ADMIN_EMAIL || "kumbuckalpepper@gmail.com",
    subject: `Refund Request Raised - Order ${orderId}`,
    html: `
  <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6; background-color:#f9fafb;">
    <div style="padding: 20px; text-align: center;">
      <img src="https://res.cloudinary.com/dxzynb5wu/image/upload/v1762773774/K_p_favicon_otfe0b.png" alt="Kumbuckal Pepper" style="max-width: 200px;"/>
      <h2 style="margin: 20px 0 10px; color:#4b0082;">Refund Request Raised</h2>
      <p style="margin: 0; font-size: 14px; color: #555;">A user has raised a refund request. Please review the details below.</p>
    </div>

    <div style="padding: 20px; background: #ffffff; border: 1px solid #e0e0e0; margin-top: 20px; border-radius: 8px;">
      <h3 style="color: #111;">Order Details</h3>
      <p style="color:#111;"><strong style="color:#111;">Order ID:</strong> ${orderId}</p>
      <p style="color:#111;"><strong style="color:#111;">Product Name:</strong> ${productName}</p>
      <p style="color:#111;"><strong style="color:#111;">Quantity:</strong> ${quantity}</p>
      <p style="color:#111;"><strong style="color:#111;">Total Amount:</strong> ₹${totalAmountInPaise}</p>
      <p style="color:#111;"><strong style="color:#111;">Payment Method:</strong> ${paymentMethod}</p>
      <p style="color:#111;"><strong style="color:#111;">Delivery Date:</strong> ${new Date(deliveryDate).toLocaleDateString()}</p>
      <p style="color:#111;"><strong style="color:#111;">Delivery Location:</strong> ${deliveryLocation}</p>
      <p style="color:#111;"><strong style="color:#111;">Delivery Address:</strong> ${deliveryAddress}</p>
    </div>

    <div style="padding: 20px; background: #ffffff; border: 1px solid #e0e0e0; margin-top: 20px; border-radius: 8px;">
      <h3 style="color: #111;">User Details</h3>
      <p style="color:#111;"><strong style="color:#111;">Name:</strong> ${fullName}</p>
      <p style="color:#111;"><strong style="color:#111;">Email:</strong> ${email}</p>
      <p style="color:#111;"><strong style="color:#111;">Phone:</strong> ${phone}</p>
      <p style="color:#111;"><strong style="color:#111;">Address:</strong> ${deliveryAddress}, ${district}, ${state} - ${pincode}</p>
      <p style="color:#111;"><strong style="color:#111;">Refund Request Date:</strong> ${new Date(refundRequestDate).toLocaleString()}</p>
      <p style="color:#111;"><strong style="color:#111;">Status:</strong> ${status}</p>
      <p style="color:#111;"><strong style="color:#111;">Refund Status:</strong> ${refundStatus}</p>
    </div>

    <div style="text-align: center; padding: 20px; font-size: 12px; color: #777;">
      <p>© 2025 Kumbuckal Pepper Nursery. All rights reserved.</p>
      <p>Trusted by farmers across India | Safe Delivery | Expert Support</p>
    </div>
  </div>
`

  };

  try {
    await resend.emails.send(mailOptions);
  } catch (error) {
    console.error("Error sending refund request email:", error);
  }
};
