const { Room, Specialty, Doctor } = require('./models');

async function seedRooms() {
    try {
        console.log('🏥 Đang tạo phòng khám mẫu...\n');

        // Lấy danh sách chuyên khoa
        const specialties = await Specialty.findAll();
        console.log(`📋 Tìm thấy ${specialties.length} chuyên khoa\n`);

        // Cấu trúc phòng khám theo tầng
        const roomsData = [
            // TẦNG 1 - Khám tổng quát & Tiếp nhận
            { name: 'Phòng tiếp nhận', room_number: '101', floor: 1, specialty_name: 'Nội tổng quát', location: 'Sảnh chính, bên phải lối vào', capacity: 3 },
            { name: 'Phòng khám Nội 1', room_number: '102', floor: 1, specialty_name: 'Nội tổng quát', location: 'Dãy A', capacity: 1 },
            { name: 'Phòng khám Nội 2', room_number: '103', floor: 1, specialty_name: 'Nội tổng quát', location: 'Dãy A', capacity: 1 },
            { name: 'Phòng cấp cứu', room_number: '104', floor: 1, specialty_name: 'Nội tổng quát', location: 'Cuối hành lang, gần thang máy', capacity: 5 },

            // TẦNG 2 - Tim mạch & Hô hấp
            { name: 'Phòng khám Tim mạch 1', room_number: '201', floor: 2, specialty_name: 'Tim mạch', location: 'Dãy A', capacity: 1 },
            { name: 'Phòng khám Tim mạch 2', room_number: '202', floor: 2, specialty_name: 'Tim mạch', location: 'Dãy A', capacity: 1 },
            { name: 'Phòng siêu âm tim', room_number: '203', floor: 2, specialty_name: 'Tim mạch', location: 'Dãy B', capacity: 1 },
            { name: 'Phòng khám Hô hấp 1', room_number: '204', floor: 2, specialty_name: 'Hô hấp', location: 'Dãy B', capacity: 1 },
            { name: 'Phòng khám Hô hấp 2', room_number: '205', floor: 2, specialty_name: 'Hô hấp', location: 'Dãy B', capacity: 1 },

            // TẦNG 3 - Tiêu hóa & Thần kinh
            { name: 'Phòng khám Tiêu hóa 1', room_number: '301', floor: 3, specialty_name: 'Tiêu hóa', location: 'Dãy A', capacity: 1 },
            { name: 'Phòng khám Tiêu hóa 2', room_number: '302', floor: 3, specialty_name: 'Tiêu hóa', location: 'Dãy A', capacity: 1 },
            { name: 'Phòng nội soi', room_number: '303', floor: 3, specialty_name: 'Tiêu hóa', location: 'Dãy B', capacity: 2 },
            { name: 'Phòng khám Thần kinh 1', room_number: '304', floor: 3, specialty_name: 'Thần kinh', location: 'Dãy B', capacity: 1 },
            { name: 'Phòng khám Thần kinh 2', room_number: '305', floor: 3, specialty_name: 'Thần kinh', location: 'Dãy B', capacity: 1 },

            // TẦNG 4 - Da liễu & Mắt & Tai mũi họng
            { name: 'Phòng khám Da liễu 1', room_number: '401', floor: 4, specialty_name: 'Da liễu', location: 'Dãy A', capacity: 1 },
            { name: 'Phòng khám Da liễu 2', room_number: '402', floor: 4, specialty_name: 'Da liễu', location: 'Dãy A', capacity: 1 },
            { name: 'Phòng khám Mắt', room_number: '403', floor: 4, specialty_name: 'Mắt', location: 'Dãy B', capacity: 1 },
            { name: 'Phòng đo thị lực', room_number: '404', floor: 4, specialty_name: 'Mắt', location: 'Dãy B', capacity: 2 },
            { name: 'Phòng khám Tai mũi họng 1', room_number: '405', floor: 4, specialty_name: 'Tai mũi họng', location: 'Dãy C', capacity: 1 },
            { name: 'Phòng khám Tai mũi họng 2', room_number: '406', floor: 4, specialty_name: 'Tai mũi họng', location: 'Dãy C', capacity: 1 },

            // TẦNG 5 - Chấn thương chỉnh hình & Phục hồi chức năng
            { name: 'Phòng khám Chỉnh hình 1', room_number: '501', floor: 5, specialty_name: 'Chấn thương chỉnh hình', location: 'Dãy A', capacity: 1 },
            { name: 'Phòng khám Chỉnh hình 2', room_number: '502', floor: 5, specialty_name: 'Chấn thương chỉnh hình', location: 'Dãy A', capacity: 1 },
            { name: 'Phòng X-quang', room_number: '503', floor: 5, specialty_name: 'Chấn thương chỉnh hình', location: 'Dãy B', capacity: 2 },
            { name: 'Phòng vật lý trị liệu', room_number: '504', floor: 5, specialty_name: 'Phục hồi chức năng', location: 'Dãy B', capacity: 5 },
        ];

        let created = 0;
        let skipped = 0;

        for (const roomData of roomsData) {
            // Tìm specialty
            const specialty = specialties.find(s =>
                s.name.toLowerCase().includes(roomData.specialty_name.toLowerCase()) ||
                roomData.specialty_name.toLowerCase().includes(s.name.toLowerCase())
            );

            // Kiểm tra phòng đã tồn tại
            const existing = await Room.findOne({
                where: { room_number: roomData.room_number, floor: roomData.floor }
            });

            if (existing) {
                console.log(`⚠️  Phòng ${roomData.room_number} tầng ${roomData.floor} đã tồn tại, cập nhật...`);
                await existing.update({
                    name: roomData.name,
                    specialty_id: specialty?.id || null,
                    location: roomData.location,
                    capacity: roomData.capacity,
                    status: 'active'
                });
                skipped++;
            } else {
                await Room.create({
                    name: roomData.name,
                    room_number: roomData.room_number,
                    floor: roomData.floor,
                    specialty_id: specialty?.id || null,
                    location: roomData.location,
                    capacity: roomData.capacity,
                    status: 'active'
                });
                console.log(`✅ Tạo: ${roomData.room_number} - ${roomData.name} (Tầng ${roomData.floor}, ${specialty?.name || 'Chưa có chuyên khoa'})`);
                created++;
            }
        }

        console.log(`\n📊 Kết quả:`);
        console.log(`   - Tạo mới: ${created} phòng`);
        console.log(`   - Cập nhật: ${skipped} phòng`);

        // Hiển thị thống kê
        const allRooms = await Room.findAll({
            include: [{ model: Specialty, as: 'specialty' }],
            order: [['floor', 'ASC'], ['room_number', 'ASC']]
        });

        console.log(`\n🏥 Tổng cộng: ${allRooms.length} phòng khám\n`);

        // Nhóm theo tầng
        const byFloor = {};
        allRooms.forEach(room => {
            const floor = room.floor || 1;
            if (!byFloor[floor]) byFloor[floor] = [];
            byFloor[floor].push(room);
        });

        for (const [floor, rooms] of Object.entries(byFloor)) {
            console.log(`📍 Tầng ${floor}: ${rooms.length} phòng`);
            const specs = [...new Set(rooms.map(r => r.specialty?.name || 'Chưa phân loại'))];
            console.log(`   Chuyên khoa: ${specs.join(', ')}\n`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

seedRooms();
