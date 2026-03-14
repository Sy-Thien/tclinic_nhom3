#!/usr/bin/env python3
"""
Direct file deletion script - Deletes the 6 target files immediately
"""
import os

files_to_delete = [
    r"b:\tclinic_nhom3\client\src\pages\admin\AdminDoctors.jsx",
    r"b:\tclinic_nhom3\client\src\pages\admin\AdminDoctors.module.css",
    r"b:\tclinic_nhom3\client\src\pages\doctor\DoctorSelfScheduleWeekly.jsx",
    r"b:\tclinic_nhom3\client\src\pages\doctor\DoctorSelfScheduleWeekly.module.css",
    r"b:\tclinic_nhom3\client\src\components\NavigationControls.jsx",
    r"b:\tclinic_nhom3\client\src\components\NavigationControls.module.css",
]

successfully_deleted = []
failed_to_delete = []
did_not_exist = []

print("=" * 80)
print("FILE DELETION SCRIPT - Using os.remove()")
print("=" * 80)
print()

print("STEP 1: Checking initial file existence")
print("-" * 80)
for i, file_path in enumerate(files_to_delete, 1):
    exists = "EXISTS" if os.path.exists(file_path) else "NOT FOUND"
    print(f"  [{i}/6] {exists}: {os.path.basename(file_path)}")
print()

print("STEP 2: Deleting files using os.remove()")
print("-" * 80)
for i, file_path in enumerate(files_to_delete, 1):
    print(f"  [{i}/6] Processing: {os.path.basename(file_path)}")
    
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            if not os.path.exists(file_path):
                print(f"       ✓ Successfully deleted with os.remove()")
                successfully_deleted.append(file_path)
            else:
                print(f"       ✗ Failed: File still exists after removal")
                failed_to_delete.append(file_path)
        except Exception as e:
            print(f"       ✗ Error: {e}")
            failed_to_delete.append(file_path)
    else:
        print(f"       ⚠ File did not exist")
        did_not_exist.append(file_path)

print()
print("=" * 80)
print("SUMMARY REPORT")
print("=" * 80)
print(f"Total files to delete: {len(files_to_delete)}")
print(f"Successfully deleted: {len(successfully_deleted)}")
print(f"Failed to delete: {len(failed_to_delete)}")
print(f"Did not exist: {len(did_not_exist)}")
print()

if successfully_deleted:
    print("✓ SUCCESSFULLY DELETED (using os.remove()):")
    for i, file_path in enumerate(successfully_deleted, 1):
        print(f"  {i}. {os.path.basename(file_path)}")
    print()

if did_not_exist:
    print("⚠ FILES THAT DID NOT EXIST:")
    for i, file_path in enumerate(did_not_exist, 1):
        print(f"  {i}. {os.path.basename(file_path)}")
    print()

if failed_to_delete:
    print("✗ FAILED TO DELETE:")
    for i, file_path in enumerate(failed_to_delete, 1):
        print(f"  {i}. {os.path.basename(file_path)}")
    print()

print("=" * 80)
print("STEP 3: Final Verification - Checking all files are gone")
print("=" * 80)
all_gone = all(not os.path.exists(file_path) for file_path in files_to_delete)

if all_gone:
    print()
    print("  ✓✓✓ SUCCESS ✓✓✓")
    print()
    print("  All 6 files have been successfully DELETED:")
    print()
    print("    1. AdminDoctors.jsx")
    print("    2. AdminDoctors.module.css")
    print("    3. DoctorSelfScheduleWeekly.jsx")
    print("    4. DoctorSelfScheduleWeekly.module.css")
    print("    5. NavigationControls.jsx")
    print("    6. NavigationControls.module.css")
    print()
    print("=" * 80)
else:
    remaining_files = [f for f in files_to_delete if os.path.exists(f)]
    print()
    print(f"  ✗ WARNING: {len(remaining_files)} file(s) still exist:")
    for file_path in remaining_files:
        print(f"    - {file_path}")
    print()
    print("=" * 80)
