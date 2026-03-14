import os

# List of files to delete
files_to_delete = [
    r"b:\tclinic_nhom3\client\src\pages\admin\AdminDoctors.jsx",
    r"b:\tclinic_nhom3\client\src\pages\admin\AdminDoctors.module.css",
    r"b:\tclinic_nhom3\client\src\pages\doctor\DoctorSelfScheduleWeekly.jsx",
    r"b:\tclinic_nhom3\client\src\pages\doctor\DoctorSelfScheduleWeekly.module.css",
    r"b:\tclinic_nhom3\client\src\components\NavigationControls.jsx",
    r"b:\tclinic_nhom3\client\src\components\NavigationControls.module.css",
]

print("=" * 70)
print("FILE DELETION REPORT")
print("=" * 70)
print()

successfully_deleted = []
failed_to_delete = []
did_not_exist = []

# Process each file
for file_path in files_to_delete:
    print(f"Processing: {file_path}")
    
    # Check if file exists before deletion
    if os.path.exists(file_path):
        try:
            # Delete the file
            os.remove(file_path)
            
            # Verify deletion
            if not os.path.exists(file_path):
                print(f"  ✓ Successfully deleted")
                successfully_deleted.append(file_path)
            else:
                print(f"  ✗ Failed: File still exists after removal attempt")
                failed_to_delete.append(file_path)
        except Exception as e:
            print(f"  ✗ Error during deletion: {e}")
            failed_to_delete.append(file_path)
    else:
        print(f"  ⚠ File did not exist")
        did_not_exist.append(file_path)
    
    print()

# Print summary report
print("=" * 70)
print("SUMMARY REPORT")
print("=" * 70)
print()

print(f"Total files to delete: {len(files_to_delete)}")
print(f"Successfully deleted: {len(successfully_deleted)}")
print(f"Failed to delete: {len(failed_to_delete)}")
print(f"Did not exist: {len(did_not_exist)}")
print()

if successfully_deleted:
    print("✓ SUCCESSFULLY DELETED FILES:")
    for file_path in successfully_deleted:
        print(f"  - {file_path}")
    print()

if did_not_exist:
    print("⚠ FILES THAT DID NOT EXIST:")
    for file_path in did_not_exist:
        print(f"  - {file_path}")
    print()

if failed_to_delete:
    print("✗ FAILED TO DELETE FILES:")
    for file_path in failed_to_delete:
        print(f"  - {file_path}")
    print()

# Final verification
print("=" * 70)
print("FINAL VERIFICATION")
print("=" * 70)
all_gone = all(not os.path.exists(file_path) for file_path in files_to_delete)

if all_gone:
    print("✓✓✓ CONFIRMATION: All 6 files have been successfully deleted! ✓✓✓")
else:
    remaining_files = [f for f in files_to_delete if os.path.exists(f)]
    print(f"✗ WARNING: {len(remaining_files)} file(s) still exist:")
    for file_path in remaining_files:
        print(f"  - {file_path}")

print("=" * 70)
