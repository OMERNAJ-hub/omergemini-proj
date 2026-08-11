import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Account, Invoice, CompanySettings, CurrencyCode } from '../types';
import { formatCurrency } from './accounting';

/**
 * PDF Export Utility for Invoices and Financial Reports
 */

export function exportInvoicePDF(invoice: Invoice, company: CompanySettings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Title / Header
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(company.shopNameEn || 'OMNI Enterprise System', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`${company.taglineEn || 'Integrated Accounting & ERP'} | Tel: ${company.phone}`, 105, 26, { align: 'center' });
  doc.text(`Address: ${company.address} | Tax ID: ${company.taxNo}`, 105, 31, { align: 'center' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 35, 196, 35);

  // Invoice Meta Box
  doc.setFontSize(16);
  doc.setTextColor(16, 185, 129); // emerald green
  doc.text(invoice.type === 'SALE' ? 'SALES INVOICE' : 'PURCHASE INVOICE', 14, 45);

  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, 14, 52);
  doc.text(`Date: ${invoice.date}`, 14, 57);
  doc.text(`Payment Status: ${invoice.paymentStatus}`, 14, 62);

  doc.text(`Partner / Client: ${invoice.partnerName}`, 120, 52);
  doc.text(`Currency: ${invoice.currency}`, 120, 57);
  doc.text(`Ex-Rate (to YER): ${invoice.exchangeRateToYER.toLocaleString()} YER`, 120, 62);

  // Table Body
  const tableData = invoice.items.map((item, index) => [
    (index + 1).toString(),
    item.productName + (item.serials && item.serials.length > 0 ? `\nSerials/IMEI: ${item.serials.join(', ')}` : ''),
    item.quantity.toString(),
    formatCurrency(item.unitPrice, invoice.currency, 'en'),
    formatCurrency(item.total, invoice.currency, 'en'),
  ]);

  autoTable(doc, {
    startY: 68,
    head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 90 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
  });

  // Summary Box
  // @ts-expect-error - lastAutoTable exists on jsPDF
  const finalY = doc.lastAutoTable.finalY || 120;

  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Subtotal: ${formatCurrency(invoice.subtotal, invoice.currency, 'en')}`, 130, finalY + 10);
  if (invoice.discount > 0) {
    doc.text(`Discount: -${formatCurrency(invoice.discount, invoice.currency, 'en')}`, 130, finalY + 16);
  }
  if (invoice.taxAmount > 0) {
    doc.text(`Tax (${invoice.taxRatePercent}%): +${formatCurrency(invoice.taxAmount, invoice.currency, 'en')}`, 130, finalY + 22);
  }

  doc.setFontSize(12);
  doc.setTextColor(16, 185, 129);
  doc.text(`Grand Total: ${formatCurrency(invoice.grandTotal, invoice.currency, 'en')}`, 130, finalY + 30);
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Paid Amount: ${formatCurrency(invoice.paidAmount, invoice.currency, 'en')}`, 130, finalY + 36);
  doc.text(`Balance Due: ${formatCurrency(invoice.grandTotal - invoice.paidAmount, invoice.currency, 'en')}`, 130, finalY + 42);

  // Footer / Notes
  if (invoice.notes) {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Notes: ${invoice.notes}`, 14, finalY + 50);
  }

  // Signatures
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Authorized Signature: __________________', 14, finalY + 65);
  doc.text('Client Signature: __________________', 120, finalY + 65);

  doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
}

export function exportTrialBalancePDF(
  accounts: Account[],
  company: CompanySettings,
  currency: CurrencyCode = 'YER'
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(`${company.shopNameEn || 'OMNI Enterprise'} - TRIAL BALANCE`, 148, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`As of Date: ${new Date().toLocaleDateString()} | Currency: ${currency}`, 148, 24, { align: 'center' });

  let totalDebit = 0;
  let totalCredit = 0;

  const tableData = accounts.map((acc) => {
    const debit = acc.category === 'ASSET' || acc.category === 'EXPENSE' ? (acc.balance > 0 ? acc.balance : 0) : 0;
    const credit = acc.category === 'LIABILITY' || acc.category === 'EQUITY' || acc.category === 'REVENUE' ? (acc.balance > 0 ? acc.balance : 0) : 0;

    totalDebit += debit;
    totalCredit += credit;

    return [
      acc.code,
      acc.nameEn || acc.nameAr,
      acc.category,
      acc.currency,
      debit > 0 ? formatCurrency(debit, acc.currency, 'en') : '-',
      credit > 0 ? formatCurrency(credit, acc.currency, 'en') : '-',
    ];
  });

  tableData.push([
    'TOTALS',
    'Overall Ledger Balance Summary',
    '-',
    '-',
    formatCurrency(totalDebit, 'YER', 'en'),
    formatCurrency(totalCredit, 'YER', 'en'),
  ]);

  autoTable(doc, {
    startY: 32,
    head: [['Code', 'Account Name', 'Category', 'Curr', 'Debit Balance', 'Credit Balance']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
  });

  doc.save(`Trial_Balance_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportProfitLossPDF(
  revenueAccounts: Account[],
  expenseAccounts: Account[],
  netProfit: number,
  company: CompanySettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(`${company.shopNameEn || 'OMNI Enterprise'} - PROFIT & LOSS STATEMENT`, 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Financial Period ending: ${new Date().toLocaleDateString()} | All figures in YER`, 105, 26, { align: 'center' });

  const rows: (string | number)[][] = [];

  rows.push(['REVENUE ACCOUNTS', '', '']);
  let totalRev = 0;
  revenueAccounts.forEach((acc) => {
    totalRev += acc.balance;
    rows.push(['  ' + (acc.nameEn || acc.nameAr), acc.code, formatCurrency(acc.balance, 'YER', 'en')]);
  });
  rows.push(['TOTAL REVENUE', '', formatCurrency(totalRev, 'YER', 'en')]);

  rows.push(['OPERATING EXPENSES', '', '']);
  let totalExp = 0;
  expenseAccounts.forEach((acc) => {
    totalExp += acc.balance;
    rows.push(['  ' + (acc.nameEn || acc.nameAr), acc.code, formatCurrency(acc.balance, 'YER', 'en')]);
  });
  rows.push(['TOTAL EXPENSES', '', formatCurrency(totalExp, 'YER', 'en')]);

  rows.push(['NET PROFIT / LOSS', '', formatCurrency(netProfit, 'YER', 'en')]);

  autoTable(doc, {
    startY: 32,
    head: [['Financial Line Item', 'Account Code', 'Amount (YER)']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
    },
    didParseCell: (data) => {
      if (data.row.raw[0] === 'NET PROFIT / LOSS') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [16, 185, 129];
        data.cell.styles.textColor = [255, 255, 255];
      }
    },
  });

  doc.save(`Profit_Loss_Statement_${new Date().toISOString().slice(0, 10)}.pdf`);
}
