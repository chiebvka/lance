-- Index on tableName for filtering by specific tables (e.g., 'invoices', 'feedbacks')
CREATE INDEX idx_audit_log_tableName ON audit_log (tableName);

-- Index on recordId for retrieving history of a specific record (e.g., a particular invoice)
CREATE INDEX idx_audit_log_recordId ON audit_log (recordId);

-- Index on createdBy for per-user change tracking
CREATE INDEX idx_audit_log_createdBy ON audit_log (createdBy);

-- Index on organizationId for multi-tenant scoping
CREATE INDEX idx_audit_log_organizationId ON audit_log (organizationId);

-- Index on changedOn for time-based queries (e.g., recent changes)
CREATE INDEX idx_audit_log_changedOn ON audit_log (changedOn);

-- GIN index on changeSumma for efficient JSONB queries (e.g., searching within changeSummary)
CREATE INDEX idx_audit_log_changeSummary ON audit_log USING GIN (changeSummary);