// src/orders/invoice.template.ts
export function buildInvoiceHtml(order: any) {
    // helper parsers
    const formatDate = (d: string | Date | null) => {
        if (!d) return '';
        const dt = new Date(d);
        return dt.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    };
    const rupee = (paise: number | string | null) => {
        if (!paise && paise !== 0) return '₹0.00';
        const p = typeof paise === 'string' ? parseInt(paise, 10) : paise;
        return `₹${(p / 100).toFixed(2)}`;
    };

    const logoUrl = 'https://res.cloudinary.com/dxzynb5wu/image/upload/v1759910577/div_exyjwr.png';

    // Choose first progressTracker record if present
    const tracker = (order.progressTracker && order.progressTracker[0]) || {};

    const invoiceDate = formatDate(order.createdAt);
    const deliveryDate = formatDate(order.deliveryDate);

    const qty = order.quantity ?? 1;
    const pricePerUnit = Number(order.pricePerUnitInPaise ?? 0);
    const subtotalPaise = Number(order.totalAmountInPaise ?? pricePerUnit * qty);

    // tax & totals - your sample shows tax and total; here tax is computed as sample (we'll use 18% for example)
    const taxPaise = Math.round(subtotalPaise * 0.18); // change if needed
    const totalPaise = subtotalPaise + taxPaise;

    return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Invoice ${order.orderId}</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; margin: 24px; }
      .header { display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
      .logo { width: 220px; }
      .title { text-align: right; font-size: 14px; font-weight: bold; }
      .section { display:flex; justify-content: space-between; margin-top: 8px; }
      .col { width: 48%; }
      h4 { margin: 4px 0; font-size: 13px; }
      .small { font-size: 11px; color: #333; }
      table { width: 100%; border-collapse: collapse; margin-top: 14px; }
      th, td { border: 1px solid #777; padding: 8px; text-align: left; }
      th { background: #f0f0f0; }
      .right { text-align: right; }
      .no-border { border: none; }
      .totals { width: 50%; float: right; margin-top: 8px; }
      .totals table td { border: none; padding: 6px 8px; }
      .footer { margin-top: 24px; font-size: 11px; }
      .small-muted { font-size: 11px; color: #555; }
      .meta-row { display:flex; gap: 16px; margin-top: 8px; font-size: 12px; }
      .meta-item { min-width: 160px; }
      .badge { font-size: 11px; color:#444; padding:4px 6px; border: 1px solid #ddd; display:inline-block; }
    </style>
  </head>
  <body>
    <div class="header">
      <div><img src="${logoUrl}" class="logo" /></div>
      <div class="title">
        <div>Tax Invoice/Bill of Supply/Cash Memo</div>
        <div style="font-size:11px;color:#666;">(Original for Recipient)</div>
      </div>
    </div>

    <div class="section">
      <div class="col">
        <h4>Seller Details :</h4>
        <div class="small">
          Logicplex It Solutions Private Limited<br/>
          4, 737, Kheny Plaza, 1st Stage 2nd Cross, CMH Road,<br/>
          Indiranagar, Bengaluru, Bengaluru Urban, Karnataka, 560038, IN<br/><br/>
          <strong>Seller Number :</strong> 8660095813<br/>
          <strong>GST Registration No :</strong> 29AAFCL7395B1Z8
        </div>
      </div>

      <div class="col">
        <h4>Billing Address :</h4>
        <div class="small">
          ${order.fullName || 'Customer Name'}<br/>
          ${order.deliveryAddress || ''}<br/>
          ${order.state || ''}, ${order.district || ''}, ${order.pincode || ''}<br/>
          ${order.email || ''} ${order.phone ? ', ' + order.phone : ''}
        </div>

        <h4 style="margin-top:14px;">Shipping Address :</h4>
        <div class="small">
          ${order.fullName || 'Customer Name'}<br/>
          ${order.deliveryAddress || ''}<br/>
          ${order.state || ''}, ${order.district || ''}, ${order.pincode || ''}<br/>
          ${order.email || ''} ${order.phone ? ', ' + order.phone : ''}
        </div>
      </div>
    </div>

    <div class="meta-row">
      <div class="meta-item"><strong>Order Status :</strong> ${order.status ?? 'N/A'}</div>
      <div class="meta-item"><strong>Invoice Number :</strong> ${order.orderId ?? 'INV-000'}</div>
      <div class="meta-item"><strong>Order Date :</strong> ${invoiceDate}</div>
      <div class="meta-item"><strong>Place of supply :</strong> ${order.state || ''}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>PRODUCT</th>
          <th>QUANTITY</th>
          <th class="right">PRICE</th>
          <th class="right">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${order.productName}</td>
          <td>${qty}</td>
          <td class="right">${rupee(pricePerUnit)}</td>
          <td class="right">${rupee(subtotalPaise)}</td>
        </tr>
        <tr>
          <td colspan="3" class="right"><strong>Subtotal</strong></td>
          <td class="right">${rupee(subtotalPaise)}</td>
        </tr>
        <tr>
          <td colspan="3" class="right"><strong>Tax</strong></td>
          <td class="right">${rupee(taxPaise)}</td>
        </tr>
        <tr>
          <td colspan="3" class="right"><strong>Total amount</strong></td>
          <td class="right"><strong>${rupee(totalPaise)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top:12px; border:1px solid #777; padding:8px; font-size:11px;">
      <div style="display:flex; justify-content:space-between;">
        <div><strong>Payment status :</strong> ${order.status?.toLowerCase() ?? 'pending'}</div>
        <div><strong>Date :</strong> ${invoiceDate}</div>
        <div><strong>Invoice Value :</strong> ${rupee(totalPaise)}</div>
        <div><strong>Mode of Payment :</strong> ${order.payment?.provider ?? 'N/A'}</div>
      </div>
    </div>

    <div class="footer">
      <h4>Declaration :</h4>
      <div class="small-muted">
        This invoice certifies the accuracy of the provided information and acknowledges receipt of goods/services, inviting prompt notification of any discrepancies.
      </div>
      <div style="height:12px;"></div>
      <div class="small-muted">
        For any inquiries or concerns, please do not hesitate to reach out to us via email at tech@blissfulbloomz.com, services@blissfulbloomz.com or by phone at 8660095813.
      </div>
    </div>
  </body>
  </html>
  `;
}
