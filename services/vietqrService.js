require('dotenv').config();

class VietQRService {
    static getBankConfig() {
        return {
            bankCode: process.env.BANK_CODE || 'MB',
            bankName: process.env.BANK_NAME || 'MB Bank',
            bankAccount: process.env.BANK_ACCOUNT || '0942216511',
            accountName: (process.env.BANK_ACCOUNT_NAME || '').trim()
        };
    }

    /**
     * Tạo URL mã QR động VietQR chuẩn MB Bank
     * @param {Object} params
     * @param {number} params.amount Số tiền thanh toán
     * @param {string} params.transferContent Nội dung chuyển khoản
     * @returns {string} URL ảnh VietQR
     */
    static generateQrUrl({ amount, transferContent }) {
        const config = this.getBankConfig();
        const queryParams = new URLSearchParams({
            amount: Math.round(amount),
            addInfo: transferContent
        });

        if (config.accountName) {
            queryParams.append('accountName', config.accountName);
        }

        return `https://img.vietqr.io/image/${config.bankCode}-${config.bankAccount}-compact2.png?${queryParams.toString()}`;
    }

    /**
     * Tạo nội dung chuyển khoản chuẩn cho hóa đơn
     */
    static buildTransferContent(roomId, month, year, invoiceCode = null) {
        if (invoiceCode) {
            return `${invoiceCode}`;
        }
        return `TIEN PHONG ${roomId} THANG ${month}/${year}`;
    }
}

module.exports = VietQRService;
