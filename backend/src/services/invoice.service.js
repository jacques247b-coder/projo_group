// PROJO GROUP — Invoice Service
// Generates branded PDF invoices using PDFKit (no Python needed in Node.js)
// Sends via Resend email + stores reference in DB

const PDFDocument = require("pdfkit");
const { Resend } = require("resend");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── Generate Invoice Number ──────────────────────────────────
function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `PRJ-${year}${month}-${random}`;
}

// ── Build PDF Invoice Buffer ─────────────────────────────────
function buildInvoicePDF(invoiceData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const GOLD = "#C49A2F";
    const DARK = "#1A0808";
    const GRAY = "#6B6760";
    const WHITE = "#FFFFFF";
    const pageWidth = 595 - 100; // A4 width minus margins

    // ── Dark background header ───────────────────────────────
    doc.rect(0, 0, 595, 140).fill(DARK);

    // Company name
    doc.fillColor(GOLD).fontSize(28).font("Helvetica-Bold")
      .text("PROJO GROUP", 50, 35);

    doc.fillColor("#B8A09A").fontSize(10).font("Helvetica")
      .text("Rustenburg's Own. Ride. Shop. Deliver & Services.", 50, 68);

    doc.fillColor(GOLD).fontSize(9)
      .text("app.projogroup.co.za  |  Rustenburg, North West, South Africa", 50, 84);

    // INVOICE label (top right)
    doc.fillColor(GOLD).fontSize(32).font("Helvetica-Bold")
      .text("INVOICE", 380, 35, { width: 165, align: "right" });

    doc.fillColor("#B8A09A").fontSize(9).font("Helvetica")
      .text(`#${invoiceData.invoiceNumber}`, 380, 78, { width: 165, align: "right" });

    doc.fillColor("#B8A09A").fontSize(9)
      .text(new Date(invoiceData.date).toLocaleDateString("en-ZA", {
        day: "2-digit", month: "long", year: "numeric"
      }), 380, 94, { width: 165, align: "right" });

    // Gold divider line
    doc.moveTo(50, 145).lineTo(545, 145).strokeColor(GOLD).lineWidth(1).stroke();

    // ── Bill To ──────────────────────────────────────────────
    let y = 160;
    doc.fillColor(GRAY).fontSize(9).font("Helvetica-Bold")
      .text("BILLED TO:", 50, y);
    doc.fillColor(DARK).fontSize(12).font("Helvetica-Bold")
      .text(invoiceData.customerName, 50, y + 14);
    doc.fillColor(GRAY).fontSize(9).font("Helvetica")
      .text(invoiceData.customerPhone || "", 50, y + 30);
    if (invoiceData.customerEmail) {
      doc.text(invoiceData.customerEmail, 50, y + 44);
    }

    // Invoice details (right side)
    doc.fillColor(GRAY).fontSize(9).font("Helvetica-Bold")
      .text("INVOICE DETAILS:", 350, y);
    doc.fillColor(GRAY).fontSize(9).font("Helvetica")
      .text(`Type: ${invoiceData.serviceType}`, 350, y + 14)
      .text(`Status: ${invoiceData.status}`, 350, y + 28)
      .text(`Payment: ${invoiceData.paymentMethod}`, 350, y + 42);

    // ── Table ────────────────────────────────────────────────
    y = 250;
    // Table header
    doc.rect(50, y, pageWidth, 28).fill(DARK);
    doc.fillColor(GOLD).fontSize(9).font("Helvetica-Bold")
      .text("DESCRIPTION", 60, y + 9)
      .text("DETAILS", 250, y + 9)
      .text("AMOUNT", 460, y + 9, { width: 80, align: "right" });

    y += 28;

    // Table rows
    const rows = invoiceData.lineItems || [];
    rows.forEach((item, i) => {
      const rowBg = i % 2 === 0 ? "#FFF8F0" : WHITE;
      doc.rect(50, y, pageWidth, 30).fill(rowBg);
      doc.fillColor(DARK).fontSize(9).font("Helvetica-Bold")
        .text(item.label, 60, y + 10, { width: 180 });
      doc.fillColor(GRAY).fontSize(8).font("Helvetica")
        .text(item.detail || "", 250, y + 10, { width: 200 });
      doc.fillColor(DARK).fontSize(9).font("Helvetica-Bold")
        .text(`R${(item.amount || 0).toFixed(2)}`, 460, y + 10, { width: 80, align: "right" });
      y += 30;
    });

    // Subtotal row
    y += 8;
    doc.moveTo(50, y).lineTo(545, y).strokeColor("#E8E0D8").lineWidth(0.5).stroke();
    y += 8;

    // Loyalty discount if any
    if (invoiceData.loyaltyDiscount > 0) {
      doc.fillColor(GRAY).fontSize(9).font("Helvetica")
        .text("Subtotal:", 350, y)
        .text(`R${invoiceData.subtotal.toFixed(2)}`, 460, y, { width: 80, align: "right" });
      y += 16;

      doc.fillColor("#4ade80").fontSize(9).font("Helvetica-Bold")
        .text(`Loyalty Discount (${invoiceData.loyaltyTier}):`, 350, y)
        .text(`-R${invoiceData.loyaltyDiscount.toFixed(2)}`, 460, y, { width: 80, align: "right" });
      y += 16;

      doc.moveTo(350, y).lineTo(545, y).strokeColor("#E8E0D8").lineWidth(0.5).stroke();
      y += 8;
    }

    // Total
    doc.rect(350, y, 195, 32).fill(DARK);
    doc.fillColor(GOLD).fontSize(11).font("Helvetica-Bold")
      .text("TOTAL DUE:", 360, y + 9)
      .text(`R${invoiceData.total.toFixed(2)}`, 460, y + 9, { width: 80, align: "right" });
    y += 42;

    // Payment status badge
    const isPaid = invoiceData.status === "PAID" || invoiceData.paymentMethod === "PROJO Wallet";
    doc.rect(50, y, 100, 22).fill(isPaid ? "#166534" : "#7F1D1D");
    doc.fillColor(isPaid ? "#4ade80" : "#FCA5A5").fontSize(9).font("Helvetica-Bold")
      .text(isPaid ? "✓ PAID" : "PENDING PAYMENT", 55, y + 6);
    y += 40;

    // ── Footer ───────────────────────────────────────────────
    doc.moveTo(50, y + 10).lineTo(545, y + 10).strokeColor(GOLD).lineWidth(0.5).stroke();
    y += 22;

    doc.fillColor(GRAY).fontSize(8).font("Helvetica")
      .text("Thank you for choosing PROJO GROUP — Rustenburg's Own.", 50, y, { align: "center", width: pageWidth })
      .text("For queries: support@projogroup.co.za | app.projogroup.co.za", 50, y + 14, { align: "center", width: pageWidth })
      .text("PROJO Group of Companies © 2023 — Est. Rustenburg, North West", 50, y + 28, { align: "center", width: pageWidth });

    doc.end();
  });
}

// ── Main Invoice Generator ───────────────────────────────────
async function generateAndSendInvoice({ type, data, user }) {
  try {
    const invoiceNumber = generateInvoiceNumber();

    // Build line items based on type
    let lineItems = [];
    let subtotal = 0;
    let serviceType = "";

    if (type === "ride") {
      serviceType = "E-Hailing / Ride";
      lineItems = [
        { label: "PROJO Ride", detail: `${data.pickupAddress} → ${data.dropoffAddress}`, amount: data.baseFare || data.totalFare },
        { label: "Vehicle Type", detail: data.vehicleType || "ECONOMY", amount: 0 },
        { label: "Zone", detail: data.zone === "ZONE_1_FLAT" ? "Rustenburg Flat Rate" : `${data.distanceKm || 0}km`, amount: 0 },
      ];
      subtotal = data.totalFare + (data.loyaltyDiscount || 0);
    } else if (type === "delivery") {
      serviceType = "Package Delivery";
      lineItems = [
        { label: "Courier Delivery", detail: `${data.pickupAddress} → ${data.dropoffAddress}`, amount: data.fare || 60 },
        { label: "Recipient", detail: `${data.recipientName} (${data.recipientPhone})`, amount: 0 },
        { label: "Tracking", detail: data.trackingNumber, amount: 0 },
      ];
      subtotal = (data.fare || 60) + (data.loyaltyDiscount || 0);
    } else if (type === "service") {
      serviceType = data.category || "Service";
      lineItems = [
        { label: data.productName, detail: data.category, amount: data.basePrice || 0 },
        ...(data.selections || []).map(s => ({
          label: s.groupName, detail: s.choiceLabel, amount: s.priceModifier || 0
        })),
      ];
      subtotal = data.finalPrice + (data.loyaltyDiscount || 0);
    }

    const invoiceData = {
      invoiceNumber,
      date: new Date(),
      customerName: user.name,
      customerPhone: user.phone,
      customerEmail: user.email,
      serviceType,
      status: "PAID",
      paymentMethod: data.paidWithWallet ? "PROJO Wallet" : "Cash",
      lineItems,
      subtotal,
      loyaltyDiscount: data.loyaltyDiscount || 0,
      loyaltyTier: data.loyaltyTier || null,
      total: data.totalFare || data.fare || data.finalPrice || 0,
    };

    // Generate PDF
    const pdfBuffer = await buildInvoicePDF(invoiceData);
    const pdfBase64 = pdfBuffer.toString("base64");

    // Send email if user has email
    if (user.email && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "invoices@projogroup.co.za",
        to: user.email,
        subject: `PROJO GROUP Invoice ${invoiceNumber} — ${serviceType}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0d0505;color:#f0ede8;padding:32px;border-radius:12px">
            <h2 style="color:#e8b84b;margin:0 0 8px">Your PROJO Invoice</h2>
            <p style="color:#b8a09a;margin:0 0 24px">Thank you for using PROJO GROUP, ${user.name.split(" ")[0]}!</p>
            <div style="background:#1a0808;border-radius:8px;padding:20px;margin-bottom:24px">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span style="color:#6b6760">Invoice #</span>
                <span style="color:#e8b84b;font-weight:bold">${invoiceNumber}</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span style="color:#6b6760">Service</span>
                <span>${serviceType}</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span style="color:#6b6760">Payment</span>
                <span>${invoiceData.paymentMethod}</span>
              </div>
              <div style="border-top:1px solid #3a2020;margin:12px 0"></div>
              <div style="display:flex;justify-content:space-between">
                <span style="color:#6b6760;font-weight:bold">Total</span>
                <span style="color:#e8b84b;font-size:18px;font-weight:bold">R${invoiceData.total.toFixed(2)}</span>
              </div>
              ${invoiceData.loyaltyDiscount > 0 ? `<div style="color:#4ade80;font-size:12px;text-align:right;margin-top:4px">Loyalty discount applied: -R${invoiceData.loyaltyDiscount.toFixed(2)}</div>` : ""}
            </div>
            <p style="color:#6b6760;font-size:12px">Your full invoice is attached as a PDF. Open the PROJO app anytime to view your transaction history.</p>
            <p style="color:#4a3030;font-size:11px;margin-top:24px">PROJO Group of Companies · app.projogroup.co.za · Rustenburg, North West</p>
          </div>
        `,
        attachments: [{
          filename: `PROJO_Invoice_${invoiceNumber}.pdf`,
          content: pdfBase64,
          contentType: "application/pdf",
        }],
      });
      console.log(`[PROJO Invoice] Sent to ${user.email} — ${invoiceNumber}`);
    }

    // Save invoice reference to notification table for in-app access
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } }).catch(() => null);
    if (wallet) {
      await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: "INVOICE",
          status: "COMPLETED",
          amountZar: invoiceData.total,
          description: `Invoice ${invoiceNumber} — ${serviceType}`,
          referenceId: invoiceNumber,
        },
      }).catch(() => {});
    }

    return { invoiceNumber, pdfBase64 };
  } catch (err) {
    console.error("[PROJO Invoice] Error:", err.message);
    return null;
  }
}

module.exports = { generateAndSendInvoice };
