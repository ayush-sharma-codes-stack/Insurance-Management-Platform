/**
 * @file pdfService.js
 * @description Service to generate PDF Payment Receipts using PDFKit.
 */

const PDFDocument = require('pdfkit');

/**
 * Generate a PDF receipt document stream.
 * @param {object} premiumData - Premium details with policy and customer info
 * @param {import('express').Response} res - Express response stream
 */
const generateReceiptPDF = (premiumData, res) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=receipt-${premiumData.id.slice(0, 8)}.pdf`);

  doc.pipe(res);

  // Header Banner
  doc
    .fillColor('#1e293b')
    .rect(0, 0, doc.page.width, 100)
    .fill();

  doc
    .fillColor('#3b82f6')
    .fontSize(24)
    .text('INSURANCE MANAGEMENT PLATFORM', 50, 35, { align: 'left' });

  doc
    .fillColor('#94a3b8')
    .fontSize(10)
    .text('Official Payment Receipt & Confirmation', 50, 65, { align: 'left' });

  doc.moveDown(4);

  // Receipt Metadata Box
  doc
    .fillColor('#0f172a')
    .fontSize(16)
    .text('PAYMENT RECEIPT', 50, 130, { underline: true });

  doc.fontSize(10).fillColor('#334155');
  doc.text(`Receipt ID: ${premiumData.id}`, 50, 160);
  doc.text(`Date of Issue: ${new Date().toLocaleDateString()}`, 50, 175);
  doc.text(`Payment Status: ${premiumData.paymentStatus}`, 50, 190);

  // Horizontal Divider Line
  doc
    .moveTo(50, 215)
    .lineTo(doc.page.width - 50, 215)
    .strokeColor('#cbd5e1')
    .stroke();

  // Customer Details
  doc.fontSize(12).fillColor('#0f172a').text('Customer Details', 50, 230);
  doc.fontSize(10).fillColor('#475569');
  doc.text(`Name: ${premiumData.policy?.customer?.name || 'N/A'}`, 50, 250);
  doc.text(`Email: ${premiumData.policy?.customer?.email || 'N/A'}`, 50, 265);
  doc.text(`Phone: ${premiumData.policy?.customer?.phone || 'N/A'}`, 50, 280);

  // Policy Details
  doc.fontSize(12).fillColor('#0f172a').text('Policy & Premium Information', 300, 230);
  doc.fontSize(10).fillColor('#475569');
  doc.text(`Policy Number: ${premiumData.policy?.policyNumber || 'N/A'}`, 300, 250);
  doc.text(`Policy Type: ${premiumData.policy?.policyType || 'N/A'}`, 300, 265);
  doc.text(`Due Date: ${new Date(premiumData.dueDate).toLocaleDateString()}`, 300, 280);
  doc.text(`Payment Date: ${premiumData.paymentDate ? new Date(premiumData.paymentDate).toLocaleDateString() : 'N/A'}`, 300, 295);

  // Payment Breakdown Table Box
  const tableTop = 330;
  doc
    .rect(50, tableTop, doc.page.width - 100, 40)
    .fill('#f8fafc')
    .stroke('#e2e8f0');

  doc.fillColor('#1e293b').fontSize(11).text('Description', 65, tableTop + 14);
  doc.text('Amount Paid', 400, tableTop + 14, { align: 'right' });

  doc
    .rect(50, tableTop + 40, doc.page.width - 100, 40)
    .fill('#ffffff')
    .stroke('#e2e8f0');

  doc.fillColor('#475569').fontSize(10).text(`Premium Payment for ${premiumData.policy?.policyType || 'Policy'}`, 65, tableTop + 54);
  doc.fillColor('#16a34a').fontSize(12).text(`$${premiumData.amount.toFixed(2)}`, 400, tableTop + 54, { align: 'right' });

  // Footer note
  doc.fontSize(9).fillColor('#94a3b8').text('Thank you for your prompt payment. This receipt is computer-generated and valid without signature.', 50, 500, { align: 'center' });

  doc.end();
};

module.exports = { generateReceiptPDF };
