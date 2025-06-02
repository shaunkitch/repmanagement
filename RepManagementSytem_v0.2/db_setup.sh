#!/bin/bash
set -e

SUPABASE_PROJECT_REF="kbjlrwkngchgzzdwhvcj"
DB_SCHEMA_FILE="DB-Setup.txt" # Make sure this path is correct

echo "Linking Supabase project..."
supabase link --project-ref "$SUPABASE_PROJECT_REF"

echo "Resetting remote database (will prompt for confirmation)..."
supabase db reset --linked

echo "Applying schema from $DB_SCHEMA_FILE..."
supabase db execute --file "$DB_SCHEMA_FILE"

echo "Setting secrets..."
supabase secrets set SUPABASE_JWT_SECRET="Ox7kuz3ipyUnLgEy3Qxm2a8sYjR0oK0krYHxumEMro+4VWq51929DvL4yGx3ezYOX7OkuyDgKN1RZ7O1Yq1gHA=="
supabase secrets set SUPABASE_SERVICE_ROLE="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtiamxyd2tuZ2NoZ3p6ZHdodmNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU4NTkzOCwiZXhwIjoyMDY0MTYxOTM4fQ.QEMSRYBF9cac3FXkjDJhow0N_3GzQpN-l_C_MMlSsEw"

echo "Database setup complete!"
