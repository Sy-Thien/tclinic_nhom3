const fs = require('fs');
const path = require('path');

const files = [
  'b:\\tclinic_nhom3\\client\\src\\pages\\admin\\AdminDoctors.jsx',
  'b:\\tclinic_nhom3\\client\\src\\pages\\admin\\AdminDoctors.module.css',
  'b:\\tclinic_nhom3\\client\\src\\pages\\doctor\\DoctorSelfScheduleWeekly.jsx',
  'b:\\tclinic_nhom3\\client\\src\\pages\\doctor\\DoctorSelfScheduleWeekly.module.css',
  'b:\\tclinic_nhom3\\client\\src\\components\\NavigationControls.jsx',
  'b:\\tclinic_nhom3\\client\\src\\components\\NavigationControls.module.css'
];

console.log('Deleting files using fs.unlinkSync()...\n');

for (const file of files) {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`✓ Deleted: ${file}`);
    } else {
      console.log(`✗ Not found: ${file}`);
    }
  } catch (err) {
    console.log(`✗ Error deleting ${file}: ${err.message}`);
  }
}

console.log('\nVerifying deletion...\n');
let allDeleted = true;
for (const file of files) {
  const exists = fs.existsSync(file);
  const status = exists ? '✗ STILL EXISTS' : '✓ Confirmed deleted';
  console.log(`${status}: ${file}`);
  if (exists) allDeleted = false;
}

console.log(`\n${allDeleted ? 'Result: All files deleted successfully!' : 'Result: Some files still exist!'}`);
