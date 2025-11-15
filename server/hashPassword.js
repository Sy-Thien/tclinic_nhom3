const bcrypt = require('bcryptjs');

const password = 'doctor123';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);