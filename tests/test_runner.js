const assert = require('assert');
const bcrypt = require('bcrypt');
const BillingService = require('../services/billingService');
const VietQRService = require('../services/vietqrService');
const TelegramService = require('../services/telegramService');

async function runAllTests() {
    console.log('======================================================');
    console.log('🧪 BẮT ĐẦU CHẠY KIỂM THỬ HỆ THỐNG QLPHONGTRO PRO');
    console.log('======================================================\n');

    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`✅ [PASS] ${name}`);
            passed++;
        } catch (err) {
            console.error(`❌ [FAIL] ${name}: ${err.message}`);
            failed++;
        }
    }

    async function testAsync(name, fn) {
        try {
            await fn();
            console.log(`✅ [PASS] ${name}`);
            passed++;
        } catch (err) {
            console.error(`❌ [FAIL] ${name}: ${err.message}`);
            failed++;
        }
    }

    // 1. Test Billing Service: Tính tiền điện và tổng hóa đơn
    test('1. BillingService - Tính tiền điện chuẩn: (Chỉ số cuối - đầu) * Đơn giá', () => {
        const result = BillingService.calculateInvoice({
            room_fee: 2000000,
            electricity_start: 100,
            electricity_end: 200, // 100 số
            electricity_price: 4000,
            water_fee: 150000,
            extra_fee: 50000,
            discount_amount: 100000
        });

        assert.strictEqual(result.electricityUnits, 100, 'Số điện phải là 100');
        assert.strictEqual(result.electricityFee, 400000, 'Tiền điện phải là 400.000đ');
        // Tổng: 2.000.000 + 400.000 + 150.000 + 50.000 - 100.000 = 2.500.000
        assert.strictEqual(result.totalAmount, 2500000, 'Tổng tiền phải là 2.500.000đ');
    });

    // 2. Test Backend không cho số âm
    test('2. BillingService - Chống số âm và chống chỉ số cuối nhỏ hơn chỉ số đầu', () => {
        const result = BillingService.calculateInvoice({
            room_fee: -1000,
            electricity_start: 300,
            electricity_end: 200, // cuối < đầu -> units = 0
            electricity_price: 4000,
            water_fee: -50000
        });

        assert.strictEqual(result.roomFee, 0);
        assert.strictEqual(result.electricityUnits, 0);
        assert.strictEqual(result.waterFee, 0);
        assert.strictEqual(result.totalAmount, 0);
    });

    // 3. Test sinh mã hóa đơn duy nhất
    test('3. BillingService - Sinh mã hóa đơn chuẩn định dạng', () => {
        const codeNov = BillingService.generateInvoiceCode(1, 11, 2026);
        assert.strictEqual(codeNov, 'INV-202611-P1');
        const codeAug = BillingService.generateInvoiceCode(2, 8, 2026);
        assert.strictEqual(codeAug, 'INV-202608-P2');
    });

    // 4. Test VietQR Service: Tạo URL VietQR MB Bank
    test('4. VietQRService - Sinh link VietQR MB Bank động', () => {
        const url = VietQRService.generateQrUrl({
            amount: 2550000,
            transferContent: 'TIEN PHONG 1 THANG 11/2026'
        });

        assert(url.includes('https://img.vietqr.io/image/'), 'URL phải từ domain img.vietqr.io');
        assert(url.includes('amount=2550000'), 'QR phải chứa đúng số tiền');
        assert(url.includes('addInfo=TIEN+PHONG+1+THANG+11%2F2026'), 'QR phải chứa đúng nội dung CK');
    });

    // 5. Test Telegram Service: Phân tách Chat ID
    test('5. TelegramService - Phân tách nhiều Chat ID phân cách bằng dấu phẩy/chấm phẩy', () => {
        const ids = TelegramService.parseChatIds('123456, 987654; 555666');
        assert.deepStrictEqual(ids, ['123456', '987654', '555666']);
    });

    // 6. Test Bcrypt: Mã hóa và so khớp mật khẩu
    await testAsync('6. Bcrypt - Hash và Verify mật khẩu Admin & Tenant', async () => {
        const plainPassword = 'admin123';
        const hash = await bcrypt.hash(plainPassword, 10);
        const isMatch = await bcrypt.compare('admin123', hash);
        const isWrong = await bcrypt.compare('wrongpass', hash);

        assert.strictEqual(isMatch, true, 'Mật khẩu đúng phải xác thực thành công');
        assert.strictEqual(isWrong, false, 'Mật khẩu sai phải bị từ chối');
    });

    // 7. Test Trạng thái OVERDUE
    test('7. BillingService - Tự động phát hiện quá hạn thanh toán', () => {
        const pastDueDate = new Date('2026-01-01');
        const futureDueDate = new Date('2099-01-01');

        const statusOverdue = BillingService.determineStatus('UNPAID', pastDueDate);
        const statusUnpaid = BillingService.determineStatus('UNPAID', futureDueDate);
        const statusPaid = BillingService.determineStatus('PAID', pastDueDate);

        assert.strictEqual(statusOverdue, 'OVERDUE', 'Phải chuyển sang OVERDUE nếu đã quá hạn');
        assert.strictEqual(statusUnpaid, 'UNPAID', 'Chưa đến hạn thì vẫn là UNPAID');
        assert.strictEqual(statusPaid, 'PAID', 'Đã trả rồi thì luôn là PAID không bị chuyển OVERDUE');
    });

    console.log('\n======================================================');
    console.log(`📊 KẾT QUẢ KIỂM THỬ: ${passed} PASSED / ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

if (require.main === module) {
    runAllTests();
}

module.exports = runAllTests;
