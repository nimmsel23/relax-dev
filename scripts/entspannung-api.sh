#!/usr/bin/env bash
API="http://localhost:9123"

# Colors
CY=$'\e[36m'
GR=$'\e[32m'
YE=$'\e[33m'
RE=$'\e[31m'
NO=$'\e[0m'

check_api() {
  if ! curl -sf "$API/health" > /dev/null 2>&1; then
    echo "${RE}❌ Server nicht erreichbar (Port 9123)${NO}"
    exit 1
  fi
}

get_progress() {
  local progress
  progress=$(curl -sf "$API/relaxation/sessions/progress")
  echo "$progress" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['total'])"
}

save_session() {
  local datum="$1"
  local methode="$2"
  local dauer="$3"
  local ort="$4"
  local tageszeit="$5"
  local mood_before="$6"
  local mood_after="$7"
  local notizen="$8"

  local payload
  payload=$(printf '{"datum":"%s","methode":"%s","dauer":"%s","ort":"%s","tageszeit":"%s","mood_before":%d,"mood_after":%d,"notizen":"%s"}' \
    "$datum" "$methode" "$dauer" "$ort" "$tageszeit" "${mood_before:-3}" "${mood_after:-4}" "$notizen")

  local response
  response=$(curl -sf -X POST "$API/relaxation/session" \
    -H "Content-Type: application/json" \
    -d "$payload")

  if [[ $? -ne 0 ]]; then
    echo "${RE}❌ Fehler beim Speichern${NO}"
    exit 1
  fi

  echo "$response"
}
