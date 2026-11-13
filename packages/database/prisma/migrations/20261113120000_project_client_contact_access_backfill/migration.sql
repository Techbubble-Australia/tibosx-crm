-- Older timesheet-only setups stored linked contacts without Access, although Project settings shows them as ticked.
UPDATE "ProjectClientContact" SET "portalAccess" = true WHERE "portalAccess" = false;
