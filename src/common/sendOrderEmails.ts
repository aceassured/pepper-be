import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🌿 Send email to admin when a new order is placed
export const sendAdminNewOrderEmail = async (order: any) => {
  const options = {
    from: `"Kumbukkal Pepper Nursery" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `🛒 New Order Received - ${order.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #fafafa;">
        <h2 style="color: #333;">New Order Received</h2>
        <p style="color: #555;">A new order has been placed on <strong>Kumbukkal Pepper Nursery</strong>.</p>

        <h3 style="color: #222; margin-top: 25px;">Order Details</h3>
        <table style="width:100%; border-collapse: collapse;">
          <tr><td><strong>Order ID:</strong></td><td>${order.orderId}</td></tr>
          <tr><td><strong>Customer Name:</strong></td><td>${order.fullName}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${order.email}</td></tr>
          <tr><td><strong>Phone:</strong></td><td>${order.phone}</td></tr>
          <tr><td><strong>Product:</strong></td><td>${order.productName}</td></tr>
          <tr><td><strong>Quantity:</strong></td><td>${order.quantity}</td></tr>
          <tr><td><strong>Total Amount:</strong></td><td>₹${order.totalAmountInPaise / 100}</td></tr>
          <tr><td><strong>Delivery Location:</strong></td><td>${order.deliveryLocation}</td></tr>
          <tr><td><strong>Delivery Address:</strong></td><td>${order.deliveryAddress}</td></tr>
          <tr><td><strong>Delivery Date:</strong></td><td>${new Date(order.deliveryDate).toLocaleDateString()}</td></tr>
          <tr><td><strong>Payment Method:</strong></td><td>${order.paymentMethod}</td></tr>
          <tr><td><strong>Payment Status:</strong></td><td>${order.status}</td></tr>
        </table>

        <p style="color: #555; margin-top: 30px;">Please review the order in the admin dashboard.</p>
      </div>
    `,
  };

  await transporter.sendMail(options);
};

// 🌿 Send confirmation email to the customer
export const sendCustomerOrderConfirmation = async (order: any) => {
  const options = {
    from: `"Kumbukkal Pepper Nursery" <${process.env.EMAIL_USER}>`,
    to: order.email,
    subject: `🌱 Thank You for Your Order - ${order.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: auto; border: 1px solid #ddd; border-radius: 8px; background: #ffffff;">
        <div style="text-align: center; background: #f9f9f9; padding: 20px; border-bottom: 1px solid #eee;">
          <img src="https://res.cloudinary.com/dxzynb5wu/image/upload/v1759910577/div_exyjwr.png" alt="Kumbukkal Pepper Nursery" style="width: 140px; margin-bottom: 10px;">
          <h2 style="color: #222;">Thank You for Your Order!</h2>
          <p style="color: #555; font-size: 14px;">We’ve received your order and will begin processing it soon.</p>
        </div>

        <div style="padding: 20px;">
          <h3 style="color: #333;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr><td><strong>Order ID:</strong></td><td>${order.orderId}</td></tr>
            <tr><td><strong>Product:</strong></td><td>${order.productName}</td></tr>
            <tr><td><strong>Quantity:</strong></td><td>${order.quantity}</td></tr>
            <tr><td><strong>Total Amount:</strong></td><td>₹${order.totalAmountInPaise / 100}</td></tr>
            <tr><td><strong>Delivery Location:</strong></td><td>${order.deliveryLocation}</td></tr>
            <tr><td><strong>Delivery Address:</strong></td><td>${order.deliveryAddress}</td></tr>
            <tr><td><strong>Delivery Date:</strong></td><td>${new Date(order.deliveryDate).toLocaleDateString()}</td></tr>
            <tr><td><strong>Payment Method:</strong></td><td>${order.paymentMethod}</td></tr>
          </table>

          <div style="margin-top: 30px; text-align: center;">
            <p style="color: #444;">We’ll notify you when your saplings are ready for delivery.</p>
            <p style="font-size: 13px; color: #888;">Delivery period: <strong>10–12 months from order confirmation</strong></p>
          </div>
        </div>

        <div style="background: #f9f9f9; padding: 15px; text-align: center; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #777;">
            Thank you for choosing <strong>Kumbukkal Pepper Nursery</strong> — World's Largest Pepper Nursery.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(options);
};
