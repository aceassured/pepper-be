// sendSummaryReport.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);


const formatPaiseToINR = (paise: number) => {
  const rupees = typeof paise === 'number' ? paise / 100 : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(rupees);
};

const formatDateReadable = (dateInput: string | Date) => {
  const d = new Date(dateInput);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const sendSummaryReport = async (summaryResponse: any) => {
  try {
    if (!summaryResponse || !summaryResponse.dashboardData) {
      throw new Error('Invalid summary payload');
    }

    const data = summaryResponse.dashboardData;

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const period = `${formatDateReadable(start)} – ${formatDateReadable(end)}`;

    const formattedRevenue = formatPaiseToINR(data.totalRevenue);
    const formattedPending = formatPaiseToINR(data.totalPendingRevenue);

    const subject = `Kumbukkal Pepper Nursery - ${data.value} Summary Report (${period})`;

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 760px; margin: 0 auto; border: 1px solid #e6e9ee; border-radius: 8px; overflow: hidden; background: #fff;">

        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7fafc; padding:18px 20px;">
          <tr>
            <td width="70" valign="middle">
              <img src="https://res.cloudinary.com/dxzynb5wu/image/upload/v1762773774/K_p_favicon_otfe0b.png" alt="Kumbukkal Pepper Nursery"
                   style="width:60px; height:60px; border-radius:6px; display:block; object-fit:cover;">
            </td>
            <td valign="middle" style="text-align:left;">
              <h2 style="margin:0; font-size:18px; color:#12263a;">Kumbukkal Pepper Nursery</h2>
              <p style="margin:4px 0 0; font-size:13px; color:#4a5568;">${data.value} Summary Report</p>
              <p style="margin:4px 0 0; font-size:12px; color:#718096;">Period: <strong style="color:#1f2937">${period}</strong></p>
            </td>
          </tr>
        </table>

        <!-- Body -->
        <div style="padding:20px;">
          <p style="margin:0 0 16px 0; color:#374151; font-size:14px;">Hello Admin,</p>

          <!-- Summary Cards (Stacked tables so they show 1 per row) -->
          ${[
        { label: 'Visitors', value: data.totalVisitors, bg: '#fbfdff', color: '#0f172a' },
        { label: 'Orders', value: data.totalOrders, bg: '#fbfdff', color: '#0f172a' },
        { label: 'Total Revenue', value: formattedRevenue, bg: '#fff8f0', color: '#92400e' },
        { label: 'Pending Revenue', value: formattedPending, bg: '#fff8f0', color: '#92400e' },
      ]
        .map(
          (item) => `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td style="background:${item.bg}; border:1px solid #eef2f7; border-radius:10px; padding:14px; text-align:center;">
                    <div style="font-size:12px; color:#667085;">${item.label}</div>
                    <div style="font-weight:700; font-size:18px; color:${item.color}; margin-top:6px;">${item.value}</div>
                  </td>
                </tr>
              </table>
            `
        )
        .join('')}

          <!-- Summary Table -->
          <div style="margin-top:16px; border-top:1px dashed #e6edf5; padding-top:16px;">
            <h4 style="margin:0 0 8px 0; color:#0f172a; font-size:15px;">Quick Summary</h4>
            <table width="100%" style="border-collapse:collapse; font-size:13px; color:#334155;">
              <tbody>
                <tr><td style="padding:8px 0; width:160px; color:#64748b;">Report Type</td><td style="padding:8px 0;"><strong>${data.value}</strong></td></tr>
                <tr><td style="padding:8px 0; color:#64748b;">Date Range</td><td style="padding:8px 0;"><strong>${period}</strong></td></tr>
                <tr><td style="padding:8px 0; color:#64748b;">Total Visitors</td><td style="padding:8px 0;"><strong>${data.totalVisitors}</strong></td></tr>
                <tr><td style="padding:8px 0; color:#64748b;">Total Orders</td><td style="padding:8px 0;"><strong>${data.totalOrders}</strong></td></tr>
                <tr><td style="padding:8px 0; color:#64748b;">Total Revenue</td><td style="padding:8px 0;"><strong>${formattedRevenue}</strong></td></tr>
                <tr><td style="padding:8px 0; color:#64748b;">Pending Revenue</td><td style="padding:8px 0;"><strong>${formattedPending}</strong></td></tr>
              </tbody>
            </table>
          </div>

          <!-- Button + text (text goes below on mobile automatically due to stacking nature) -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
            <tr>
              <td align="center">
                <a href="https://kumbukkal-pepper-admin-fe.vercel.app/dashboard" style="display:inline-block; padding:10px 14px; background:#0f172a; color:#fff; text-decoration:none; border-radius:6px; font-size:13px;">Open Admin Dashboard</a>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:8px;">
                <span style="color:#94a3b8; font-size:12px;">(or view details in your admin panel)</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Footer -->
        <div style="background:#f7fafc; padding:12px 18px; text-align:center; font-size:12px; color:#64748b;">
          <div>Kumbukkal Pepper Nursery — World's Largest Pepper Nursery</div>
          <div style="margin-top:6px;">Contact: ${process.env.EMAIL_USER}</div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: "Kumbukkal Pepper Nursery <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL || 'venkatatrinadh@aceassured.com',
      subject,
      html,
    };

    const info = await resend.emails.send(mailOptions);
    return { success: true, info };
  } catch (err) {
    console.error('Failed to send summary report email:', err);
    return { success: false, error: err?.message || err };
  }
};
