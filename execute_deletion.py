import os

files_to_delete = [
    r"b:\tclinic_nhom3\client\src\pages\admin\AdminDoctors.jsx",
    r"b:\tclinic_nhom3\client\src\pages\admin\AdminDoctors.module.css",
    r"b:\tclinic_nhom3\client\src\pages\doctor\DoctorSelfScheduleWeekly.jsx",
    r"b:\tclinic_nhom3\client\src\pages\doctor\DoctorSelfScheduleWeekly.module.css",
    r"b:\tclinic_nhom3\client\src\components\NavigationControls.jsx",
    r"b:\tclinic_nhom3\client\src\components\NavigationControls.module.css",
]

deleted = []
not_found = []
failed = []

print("=" * 60)
print("FILE DELETION SCRIPT")
print("=" * 60)

for filepath in files_to_delete:
    if not os.path.exists(filepath):
        not_found.append(filepath)
        print(f"[NOT FOUND] {filepath}")
        continue
    try:
        os.remove(filepath)
        if not os.path.exists(filepath):
            deleted.append(filepath)
            print(f"[DELETED]   {filepath}")
        else:
            failed.append(filepath)
            print(f"[FAILED]    {filepath} - still exists after removal")
    except Exception as e:
        failed.append(filepath)
        print(f"[ERROR]     {filepath} - {e}")

print("\n" + "=" * 60)
print("DELETION REPORT")
print("=" * 60)

print(f"\nSuccessfully deleted: {len(deleted)}")
for f in deleted:
    print(f"  ✅ {f}")

if not_found:
    print(f"\nFiles not found (already gone): {len(not_found)}")
    for f in not_found:
        print(f"  ⚠️  {f}")

if failed:
    print(f"\nFailed to delete: {len(failed)}")
    for f in failed:
        print(f"  ❌ {f}")

print("\n" + "-" * 60)
print("VERIFICATION: Checking all 6 files are gone...")
all_gone = True
for filepath in files_to_delete:
    exists = os.path.exists(filepath)
    status = "STILL EXISTS ❌" if exists else "GONE ✅"
    print(f"  {status} - {os.path.basename(filepath)}")
    if exists:
        all_gone = False

print("-" * 60)
if all_gone:
    print("✅ CONFIRMED: All 6 files are gone.")
else:
    print("❌ WARNING: Some files still exist!")
print("=" * 60)
