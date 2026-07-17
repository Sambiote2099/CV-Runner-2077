CREATE INDEX "Position_fts_idx"
ON "Position"
USING GIN (to_tsvector('english', title || ' ' || description));