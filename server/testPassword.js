const bcrypt = require('bcryptjs');

const testPasswords = ['123456', 'password', 'admin123', '123456789'];

// Hash mẫu từ database (lấy từ 1 account bất kỳ)
const sampleHash = '$2a$10$w1qhg3yEXY5kZuJ5nv8Ume0HF2IzBo.L7l6FGXkN7Xw9J2P0z6VEu';

console.log('🔐 Kiểm tra password mặc định...\n');

testPasswords.forEach(pwd => {
    const match = bcrypt.compareSync(pwd, sampleHash);
    console.log(`Password "${pwd}": ${match ? '✅ ĐÚNG' : '❌ SAI'}`);
});

console.log('\n💡 Nếu tất cả đều SAI, hãy tạo tài khoản test mới.');
