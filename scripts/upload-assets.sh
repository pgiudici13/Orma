#!/usr/bin/env bash
# Carica assets/processed/distintivi/** nel bucket Storage pubblico "distintivi"
# (P3-T02b). Esecuzione manuale una tantum: `bash scripts/upload-assets.sh`.
# Richiede NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY in .env.local — mai
# stampati, letti solo per l'header Authorization di ogni richiesta.
set -euo pipefail

cd "$(dirname "$0")/.."
set -a
source .env.local
set +a

SOURCE_DIR="assets/processed/distintivi"
BUCKET="distintivi"
count=0

while read -r file; do
  rel_path="${file#assets/processed/}"
  url="${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${BUCKET}/${rel_path}"

  status=$(curl -s -o /tmp/upload-response.json -w "%{http_code}" \
    -X POST "$url" \
    -H "apikey: ${SUPABASE_SECRET_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SECRET_KEY}" \
    -H "Content-Type: image/webp" \
    -H "x-upsert: true" \
    --data-binary "@${file}")

  if [ "$status" -ge 400 ]; then
    echo "ERRORE ($status) su ${rel_path}:"
    cat /tmp/upload-response.json
    exit 1
  fi
  count=$((count + 1))
  echo "OK ($count): ${rel_path}"
done < <(find "$SOURCE_DIR" -type f -name "*.webp")

echo "Upload completato: ${count} file."
