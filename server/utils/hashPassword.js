const bcrypt = require('bcryptjs');

async function gen() {
    const plain = 'admin123'; // đổi nếu cần
    const hash = await bcrypt.hash(plain, 10);
    console.log('Plain:', plain);
    console.log('Hash:', hash);
}
gen();