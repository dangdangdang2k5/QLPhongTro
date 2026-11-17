const PDFDocument = require('pdfkit');
const { pool } = require('../config/database');
const BillingService = require('../services/billingService');

class ReportController {
    /**
     * Xuất hóa đơn ra định dạng PDF
     */
    static async exportInvoicePdf(req, res, next) {
        try {
            const invoiceId = parseInt(req.params.id, 10);
            const [invoices] = await pool.query(`
                SELECT i.*, r.room_number, u.full_name as tenant_name, u.phone as tenant_phone
                FROM invoices i
                JOIN rooms r ON i.room_id = r.id
                LEFT JOIN users u ON r.current_tenant_id = u.id
                WHERE i.id = ?
            `, [invoiceId]);

            if (invoices.length === 0) {
                return res.status(404).send('Không tìm thấy hóa đơn.');
            }

            const invoice = invoices[0];
            const [items] = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);

            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=HoaDon_${invoice.invoice_code}.pdf`);

            doc.pipe(res);

            // Header
            doc.fontSize(22).text('HOA DON TIEN PHONG TRO', { align: 'center', bold: true });
            doc.moveDown(0.5);
            doc.fontSize(12).text(`Ma hoa don: ${invoice.invoice_code}`, { align: 'center' });
            doc.text(`Ky thanh toan: Thang ${invoice.payment_month}/${invoice.payment_year}`, { align: 'center' });
            doc.moveDown(1.5);

            // Thông tin phòng & khách thuê
            doc.fontSize(14).text(`Phong: ${invoice.room_number}`, { bold: true });
            if (invoice.tenant_name) {
                doc.fontSize(11).text(`Khach thue: ${invoice.tenant_name} - SĐT: ${invoice.tenant_phone || 'N/A'}`);
            }
            doc.fontSize(11).text(`Trang thai: ${invoice.status}`);
            doc.moveDown(1);

            // Bảng chi tiết
            doc.fontSize(12).text('CHI TIET CAC KHOAN PHI:', { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(11);
            items.forEach((item, index) => {
                const line = `${index + 1}. ${item.item_name}: ${BillingService.formatCurrency(item.amount)}`;
                doc.text(line);
            });

            doc.moveDown(1);
            doc.fontSize(14).text(`TONG CONG: ${BillingService.formatCurrency(invoice.total_amount)}`, { bold: true });
            doc.moveDown(1.5);

            // Thông tin ngân hàng
            doc.fontSize(10).text('THONG TIN CHUYEN KHOAN (MB BANK):', { bold: true });
            doc.text(`Ngan hang: ${process.env.BANK_NAME || 'MB Bank'}`);
            doc.text(`So tai khoan: ${process.env.BANK_ACCOUNT || '0942216511'}`);
            doc.text(`Chu tai khoan: ${process.env.BANK_ACCOUNT_NAME || 'HO MINH DANG'}`);
            doc.text(`Noi dung: TIEN PHONG ${invoice.room_id} THANG ${invoice.payment_month}/${invoice.payment_year}`);
            doc.moveDown(2);

            doc.fontSize(9).text('Cam on quy khach da thanh toan dung han!', { align: 'center', italic: true });

            doc.end();
        } catch (err) {
            next(err);
        }
    }
}

module.exports = ReportController;
