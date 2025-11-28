const db = require('./config/database');

const migrations = [
    '20251121-add-diagnosis-to-booking.js',
    '20251121-add-fields-to-drugs.js',
    '20251121-create-drugs-table.js',
    '20251121071915-create-doctor-schedules.js',
    '202511220001-create-time-slots-table.js',
    '202511220002-add-timeslot-to-booking.js',
    '20251123-add-room-to-doctor-schedules.js',
    '20251123-update-booking-status-workflow.js',
    '20251125-create-medical-history.js',
    '20251126-add-reminder-fields-to-bookings.js'
];

async function markMigrations() {
    for (const m of migrations) {
        try {
            await db.query(`INSERT IGNORE INTO SequelizeMeta (name) VALUES ('${m}')`);
            console.log('✅ Marked:', m);
        } catch (e) {
            console.log('⚠️ Already marked:', m);
        }
    }
    console.log('\nDone!');
    process.exit(0);
}

markMigrations();
