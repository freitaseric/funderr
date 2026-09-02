ALTER TABLE audit_logs ADD COLUMN device_id TEXT;
ALTER TABLE audit_logs ADD COLUMN device_name TEXT;

CREATE INDEX audit_logs_device_id_idx ON audit_logs(device_id);
