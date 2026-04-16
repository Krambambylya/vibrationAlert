# Vibrating Alarm (Android-first)

Silent alarm app with vibration-pattern wake up.

## Features

- `Patterns` screen: list of preset/custom patterns, preview, edit, duplicate, delete.
- `Alarm` screen: time selection (`HH:mm`), pattern selection, enable/disable alarm.
- Local notification scheduling via `expo-notifications` with Android vibration channel and no sound.
- Alarm resync on app start (re-schedules when enabled alarm has no pending notification).

## Run locally

```bash
npm install
npx expo start
```

## Reliability notes

- Supported target: Android-first behavior.
- Alarm is expected to fire at scheduled time when app is backgrounded, killed, or screen is locked.
- Fully powered off phone (`power off`) cannot trigger notifications or vibration.

## Validation checklist

- Grant notifications permission on first save.
- Save enabled alarm for nearest future time and verify vibration-only notification.
- Kill app process and wait for scheduled time.
- Lock device and wait for scheduled time.
