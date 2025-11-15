const bcrypt = require('bcryptjs');

// ✅ Lấy password từ command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('❌ Cách dùng:');
    console.log('   node hash.js <password1> <password2> ...');
    console.log('\nVí dụ:');
    console.log('   node hash.js admin123 doctor123 patient123');
    process.exit(1);
}

console.log('🔐 Đang hash...\n');
console.log('='.repeat(80));

args.forEach((password, index) => {
    const hash = bcrypt.hashSync(password, 10);

    console.log(`\n${index + 1}. Password: ${password}`);
    console.log(`   Hash: ${hash}`);

    // Copy-paste vào SQL
    console.log(`   SQL: '${hash}'`);
});

console.log('\n' + '='.repeat(80));
console.log('✅ Hoàn thành!');