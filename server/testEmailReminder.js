/**
 * Test Email Reminder Service
 * Kiểm tra gửi email nhắc lịch trước 24h
 */

require('dotenv').config();
const reminderService = require('./services/reminderService');
const { Booking } = require('./models');

async function testReminderService() {
    console.log('🔍 Testing Reminder Service...\n');

    try {
        // 1. Kiểm tra config
        console.log('📧 Email Configuration:');
        console.log('   User:', process.env.EMAIL_USER || '❌ NOT SET');
        console.log('   Password:', process.env.EMAIL_PASSWORD ? '✅ SET' : '❌ NOT SET');
        console.log('   SMTP:', `${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
        console.log('');

        // 2. Tính ngày mai
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split('T')[0];

        console.log(`📅 Checking appointments for: ${tomorrowDate}\n`);

        // 3. Tìm lịch hẹn ngày mai
        const appointments = await Booking.findAll({
            where: {
                appointment_date: tomorrowDate,
                status: ['confirmed', 'waiting_doctor_confirmation']
            },
            attributes: ['id', 'booking_code', 'patient_name', 'patient_email',
                'appointment_date', 'appointment_time', 'status', 'reminder_sent']
        });

        console.log(`📋 Found ${appointments.length} appointments tomorrow:`);

        if (appointments.length > 0) {
            appointments.forEach((apt, index) => {
                console.log(`   ${index + 1}. ${apt.booking_code} - ${apt.patient_name}`);
                console.log(`      Email: ${apt.patient_email || '❌ NO EMAIL'}`);
                console.log(`      Time: ${apt.appointment_time || 'Not set'}`);
                console.log(`      Reminder sent: ${apt.reminder_sent ? '✅ Yes' : '❌ No'}`);
            });
        } else {
            console.log('   ⚠️ No appointments found for tomorrow');
            console.log('   💡 Tip: Create test booking for tomorrow to test emails');
        }

        console.log('\n🚀 Running reminder check...\n');

        // 4. Chạy reminder service
        const result = await reminderService.checkAndSendReminders();

        console.log('\n📊 Results:');
        console.log(`   Total checked: ${result.total}`);
        console.log(`   ✅ Successfully sent: ${result.success}`);
        console.log(`   ❌ Failed: ${result.failed}`);

        if (result.success > 0) {
            console.log('\n✅ Email reminder test PASSED!');
            console.log('   Check the recipient inbox for reminder email.');
        } else if (result.total === 0) {
            console.log('\n⚠️ No reminders to send (no appointments tomorrow)');
        } else {
            console.log('\n❌ Email reminder test FAILED!');
            console.log('   Check email configuration in .env file');
        }

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        console.error('\n🔧 Troubleshooting:');
        console.error('   1. Check .env file has EMAIL_USER and EMAIL_PASSWORD');
        console.error('   2. Gmail: Use App Password, not account password');
        console.error('   3. Check database connection is working');
    } finally {
        process.exit(0);
    }
}

// Chạy test
testReminderService();
