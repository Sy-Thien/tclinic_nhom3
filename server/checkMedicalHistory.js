const sequelize = require('./config/database');

async function check() {
    try {
        const [tables] = await sequelize.query("SHOW TABLES LIKE 'tn_medical_history'");
        console.log('Table exists:', tables.length > 0);

        if (tables.length === 0) {
            console.log('Creating table...');
            await sequelize.query(`
                CREATE TABLE tn_medical_history (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    booking_id INT NOT NULL,
                    patient_id INT NOT NULL,
                    doctor_id INT NOT NULL,
                    visit_date DATE NOT NULL,
                    visit_time VARCHAR(5),
                    symptoms TEXT,
                    diagnosis TEXT,
                    conclusion TEXT,
                    treatment_plan TEXT,
                    note TEXT,
                    prescription_id INT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (booking_id) REFERENCES tn_booking(id),
                    FOREIGN KEY (patient_id) REFERENCES tn_patients(id),
                    FOREIGN KEY (doctor_id) REFERENCES tn_doctors(id),
                    FOREIGN KEY (prescription_id) REFERENCES tn_prescriptions(id)
                )
            `);
            console.log('Table created!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

check();
