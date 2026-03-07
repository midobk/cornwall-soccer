# Cornwall Soccer

This app now supports Firebase Firestore persistence.

## Run locally

1. Install dependencies:
   `npm i`
2. Copy `.env.example` to `.env` and fill your Firebase web config values.
3. Start the app:
   `npm run dev`

## Firebase setup

1. In Firebase console, create a project (or use an existing one).
2. Add a Web App and copy its config values into `.env`.
3. Enable Firestore Database (production or test mode).
4. For quick local testing, use rules like:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /matches/{matchId} {
      allow read, write: if true;
    }
  }
}
```

If Firebase env values are missing, the app falls back to local in-memory sample data.
  
