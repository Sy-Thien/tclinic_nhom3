@echo off
echo Deleting 6 files using Python...
python -c "import os; files=[r'b:\tclinic_nhom3\client\src\pages\admin\AdminDoctors.jsx', r'b:\tclinic_nhom3\client\src\pages\admin\AdminDoctors.module.css', r'b:\tclinic_nhom3\client\src\pages\doctor\DoctorSelfScheduleWeekly.jsx', r'b:\tclinic_nhom3\client\src\pages\doctor\DoctorSelfScheduleWeekly.module.css', r'b:\tclinic_nhom3\client\src\components\NavigationControls.jsx', r'b:\tclinic_nhom3\client\src\components\NavigationControls.module.css']; [os.remove(f) and print(f'Deleted: {f}') if os.path.exists(f) else print(f'Not found: {f}') for f in files]; print('\nVerifying...'); [print(f'DELETED' if not os.path.exists(f) else f'STILL EXISTS: {f}') for f in files]"
pause
