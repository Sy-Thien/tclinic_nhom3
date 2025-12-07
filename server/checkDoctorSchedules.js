const { DoctorSchedule, Doctor } = require('./models');

async function check() {
    try {
        console.log('🔍 Checking tn_doctor_schedules table...\n');

        const schedules = await DoctorSchedule.findAll({
            include: [{
                model: Doctor,
                as: 'doctor',
                attributes: ['doctor_id', 'full_name', 'email']
            }],
            limit: 10
        });

        console.log(`📊 Total schedules found: ${schedules.length}\n`);

        if (schedules.length > 0) {
            schedules.forEach(s => {
                console.log(`- Schedule ID ${s.schedule_id}:`);
                console.log(`  Doctor: ${s.doctor?.full_name || 'N/A'} (ID: ${s.doctor_id})`);
                console.log(`  Day: ${s.day_of_week}`);
                console.log(`  Time: ${s.start_time} - ${s.end_time}`);
                console.log(`  Room: ${s.room || 'N/A'}\n`);
            });
        } else {
            console.log('⚠️  No schedules found. Run seed script to create test data.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

check();
