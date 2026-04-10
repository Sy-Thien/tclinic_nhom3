# Backup and Restore Database (Docker)

This project stores MySQL data in Docker volume `mysql_data`.
To avoid data loss, run backups regularly.

## Quick commands

- Backup now:
  - `npm run db:backup`
- Restore from latest backup:
  - `npm run db:restore`

## Backup output

Backups are saved in `./backups`:
- Timestamped file: `tn_clinic-YYYYMMDD-HHMMSS.sql`
- Latest alias: `tn_clinic-latest.sql`

## Custom backup file restore

Use PowerShell directly:

- `powershell -ExecutionPolicy Bypass -File ./scripts/restore-db.ps1 -BackupFile ./backups/tn_clinic-20260410-093000.sql`

## Important warnings

- Do NOT run `docker compose down -v` unless you really want to delete DB data.
- `restore-db.ps1` will drop and recreate `tn_clinic` before restoring.
- Keep backup files in a safe location (cloud or another disk).
