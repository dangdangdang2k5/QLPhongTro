class BillingService {
    /**
     * Tính toán số liệu hóa đơn chuẩn xác ở Backend
     * @param {Object} input
     * @returns {Object} Số liệu đã chuẩn hóa và tính toán
     */
    static calculateInvoice(input) {
        const roomFee = Math.max(0, parseFloat(input.room_fee) || 0);
        const electricityStart = Math.max(0, parseInt(input.electricity_start, 10) || 0);
        const electricityEnd = Math.max(0, parseInt(input.electricity_end, 10) || 0);
        const electricityPrice = Math.max(0, parseFloat(input.electricity_price) || 4000);
        
        let electricityUnits = 0;
        if (electricityEnd >= electricityStart && electricityEnd > 0) {
            electricityUnits = electricityEnd - electricityStart;
        } else if (input.electricity_units !== undefined && input.electricity_units !== null) {
            electricityUnits = Math.max(0, parseInt(input.electricity_units, 10) || 0);
        }

        const electricityFee = electricityUnits * electricityPrice;
        const waterFee = Math.max(0, parseFloat(input.water_fee) || 0);
        const extraFee = Math.max(0, parseFloat(input.extra_fee) || 0);
        const discountAmount = Math.max(0, parseFloat(input.discount_amount) || 0);

        const totalAmount = Math.max(0, (roomFee + electricityFee + waterFee + extraFee) - discountAmount);

        return {
            roomFee,
            electricityStart,
            electricityEnd,
            electricityUnits,
            electricityPrice,
            electricityFee,
            waterFee,
            extraFee,
            discountAmount,
            totalAmount
        };
    }

    /**
     * Sinh mã hóa đơn chuẩn duy nhất
     * Ví dụ: INV-202608-P1
     */
    static generateInvoiceCode(roomId, month, year) {
        const paddedMonth = String(month).padStart(2, '0');
        return `INV-${year}${paddedMonth}-P${roomId}`;
    }

    /**
     * Định dạng tiền tệ Việt Nam (VNĐ)
     */
    static formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN').format(Math.round(amount || 0)) + 'đ';
    }

    /**
     * Tự động xác định trạng thái quá hạn nếu qua due_date và chưa thanh toán
     */
    static determineStatus(status, dueDate) {
        if (status === 'PAID') return 'PAID';
        if (status === 'PENDING') return 'PENDING';
        if (dueDate) {
            const now = new Date();
            const due = new Date(dueDate);
            if (now > due && status === 'UNPAID') {
                return 'OVERDUE';
            }
        }
        return status || 'UNPAID';
    }
}

module.exports = BillingService;
