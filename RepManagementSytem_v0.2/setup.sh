#!/bin/bash
set -e

# --------- CONFIG ---------
SUPABASE_URL="https://kbjlrwkngchgzzdwhvcj.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtiamxyd2tuZ2NoZ3p6ZHdodmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1ODU5MzgsImV4cCI6MjA2NDE2MTkzOH0.ro8sElQJLVrZrB8HF1yEbuaaUi-e48E-96wmp4AF64s"
SUPABASE_SERVICE_ROLE="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtiamxyd2tuZ2NoZ3p6ZHdodmNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU4NTkzOCwiZXhwIjoyMDY0MTYxOTM4fQ.QEMSRYBF9cac3FXkjDJhow0N_3GzQpN-l_C_MMlSsEw"
JWT_SECRET="Ox7kuz3ipyUnLgEy3Qxm2a8sYjR0oK0krYHxumEMro+4VWq51929DvL4yGx3ezYOX7OkuyDgKN1RZ7O1Yq1gHA=="
PROJECT_DIR="field-service-app"
SUPABASE_PROJECT_REF="kbjlrwkngchgzzdwhvcj"
DB_SCHEMA_FILE="../DB-Setup.txt" # Adjust path if needed

# --------- FRONTEND SETUP ---------
echo "Creating project directory..."
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

echo "Setting up frontend..."
npm create vite@latest frontend -- --template react-ts <<EOF
y
EOF

cd frontend
npm install @supabase/supabase-js react-router-dom react-pro-sidebar @mui/material @emotion/react @emotion/styled

cat > .env <<EOF
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF
cd ..

# --------- BACKEND SETUP ---------
echo "Setting up backend..."
mkdir backend && cd backend
npm init -y
npm install express @supabase/supabase-js cors dotenv

cat > .env <<EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE=$SUPABASE_SERVICE_ROLE
JWT_SECRET=$JWT_SECRET
EOF

cat > server.js <<'EOF'
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
EOF

cd ..

# --------- SUPABASE CLI SETUP ---------
echo "Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
  echo "Supabase CLI not found."
  echo "Please install it manually for your OS:"
  echo "  Windows: choco install supabase"
  echo "  MacOS: brew install supabase/tap/supabase"
  echo "  Linux: Download from https://github.com/supabase/cli/releases"
  exit 1
fi

echo "Logging into Supabase CLI..."
supabase login || echo "Already logged in."

echo "Linking Supabase project..."
supabase link --project-ref "$SUPABASE_PROJECT_REF"

# --------- DATABASE SETUP ---------
if [ -f "$DB_SCHEMA_FILE" ]; then
  echo "Applying database schema..."
  supabase db reset --yes
  supabase db push -f "$DB_SCHEMA_FILE"
else
  echo "WARNING: No DB schema file found at $DB_SCHEMA_FILE"
fi

supabase secrets set SUPABASE_JWT_SECRET="$JWT_SECRET"
supabase secrets set SUPABASE_SERVICE_ROLE="$SUPABASE_SERVICE_ROLE"

echo "Setup complete!"
echo "To start frontend: cd $PROJECT_DIR/frontend && npm run dev"
echo "To start backend:  cd $PROJECT_DIR/backend && node server.js"
