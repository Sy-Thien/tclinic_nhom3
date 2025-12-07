/**
 * Script kiểm tra và sửa timezone MySQL
 * Chạy: node server/fixTimezone.js
 */

const sequelize = require('./config/database');

async function checkAndFixTimezone() {
    try {
        console.log('🔍 Đang kiểm tra timezone MySQL...\n');

        // 1. Kiểm tra timezone hiện tại của MySQL
        const [results] = await sequelize.query("SELECT @@global.time_zone, @@session.time_zone, NOW() as now_time");
        console.log('📊 Timezone hiện tại:');
        console.log('   - Global timezone:', results[0]['@@global.time_zone']);
        console.log('   - Session timezone:', results[0]['@@session.time_zone']);
        console.log('   - Current MySQL time:', results[0].now_time);
        console.log('   - Current Node.js time:', new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));
        console.log('');

        // 2. Set timezone cho session hiện tại
        await sequelize.query("SET time_zone = '+07:00'");
        console.log('✅ Đã set timezone cho session thành công');

        // 3. Kiểm tra lại
        const [newResults] = await sequelize.query("SELECT @@session.time_zone, NOW() as now_time");
        console.log('📊 Timezone sau khi sửa:');
        console.log('   - Session timezone:', newResults[0]['@@session.time_zone']);
        console.log('   - Current MySQL time:', newResults[0].now_time);
        console.log('');

        // 4. Kiểm tra các bảng có created_at/updated_at
        console.log('📋 Kiểm tra 5 records mới nhất từ bảng tn_booking:');
        const [bookings] = await sequelize.query(`
            SELECT id, booking_code, created_at, updated_at 
            FROM tn_booking 
            ORDER BY id DESC 
            LIMIT 5
        `);

        if (bookings.length > 0) {
            bookings.forEach(b => {
                console.log(`   - Booking #${b.id} (${b.booking_code})`);
                console.log(`     Created: ${b.created_at}`);
                console.log(`     Updated: ${b.updated_at}`);
            });
        } else {
            console.log('   Không có dữ liệu');
        }

        console.log('\n✅ Hoàn tất kiểm tra!');
        console.log('\n💡 Lưu ý:');
        console.log('   - Timezone session chỉ áp dụng cho connection hiện tại');
        console.log('   - Để set vĩnh viễn, cần cấu hình trong my.ini (XAMPP) hoặc my.cnf');
        console.log('   - Hoặc thêm vào server.js: await sequelize.query("SET time_zone = \'+07:00\'")');

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        await sequelize.close();
    }
}

checkAndFixTimezone();
