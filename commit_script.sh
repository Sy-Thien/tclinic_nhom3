#!/bin/bash
cd b:/tclinic_nhom3
git add .
git commit -m "feat: Add schedule approval and doctor self-schedule management

- Add ScheduleApproval page for admin to review/approve doctor schedules
- Add DoctorSelfSchedule page for doctors to manage their own schedules
- Update AdminLayout and DoctorLayout with new navigation items
- Add schedule approval routes and CSS styling
- Total: +3708 lines added across 23 files

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git --no-pager log --oneline -1
