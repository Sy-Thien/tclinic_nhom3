import os

files = [
    r'b:\tclinic_nhom3\client\src\pages\admin\AdminDoctors.jsx',
    r'b:\tclinic_nhom3\client\src\pages\admin\AdminDoctors.module.css',
    r'b:\tclinic_nhom3\client\src\pages\doctor\DoctorSelfScheduleWeekly.jsx',
    r'b:\tclinic_nhom3\client\src\pages\doctor\DoctorSelfScheduleWeekly.module.css',
    r'b:\tclinic_nhom3\client\src\components\NavigationControls.jsx',
    r'b:\tclinic_nhom3\client\src\components\NavigationControls.module.css'
]

print('Deleting files...')
for file in files:
    try:
        os.remove(file)
        print(f'✓ Deleted: {file}')
    except FileNotFoundError:
        print(f'✗ Not found: {file}')
    except Exception as e:
        print(f'✗ Error deleting {file}: {e}')

print('\nVerifying deletion...')
all_deleted = True
for file in files:
    exists = os.path.exists(file)
    status = '✗ STILL EXISTS' if exists else '✓ Confirmed deleted'
    print(f'{status}: {file}')
    if exists:
        all_deleted = False

print(f'\nResult: All files deleted successfully!' if all_deleted else '\nResult: Some files still exist!')
