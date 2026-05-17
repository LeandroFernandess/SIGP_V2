# SIGP Cloud Functions

Backend ownership of the AI digest delivery so OpenAI and EmailJS credentials
never leave the server. The digest is dispatched on each successful login when
the user has the option enabled, plus on demand via the "Enviar agora" button.

## Functions

| Name | Type | What it does |
| --- | --- | --- |
| `sendDigestOnLogin` | HTTPS callable | Invoked by the dashboard right after the user signs in. Sends the digest only when `prefs.enabled` is true; otherwise returns `{ ok: true, skipped: true }`. |
| `sendDigestNow` | HTTPS callable | Used by the "Enviar agora" button — sends immediately for the calling user. |
| `sendFeedback` | HTTPS callable | Receives feedback from the Support page form and forwards it to EmailJS server-side. Accepts `{ feedbackType, message, replyEmail? }`. |

## Pre-deploy setup

> Requires the Firebase **Blaze** plan (secrets).

```bash
cd functions
npm install

# All EmailJS values and the OpenAI key are stored in Firebase Secret Manager
# so no credential or identifier is versioned in the repository.
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set EMAILJS_PRIVATE_KEY            # EmailJS → Account → API Keys → Private Key
firebase functions:secrets:set EMAILJS_SERVICE_ID             # EmailJS → Email Services → Service ID
firebase functions:secrets:set EMAILJS_TEMPLATE_ID            # EmailJS → Email Templates → digest template ID
firebase functions:secrets:set EMAILJS_FEEDBACK_TEMPLATE_ID   # EmailJS → Email Templates → feedback template ID
firebase functions:secrets:set EMAILJS_PUBLIC_KEY             # EmailJS → Account → API Keys → Public Key
firebase functions:secrets:set FEEDBACK_RECIPIENT_EMAIL        # Email address that receives feedback form submissions
```

## Deploy

```bash
firebase deploy --only functions
```

> If you previously deployed `sendScheduledDigest`, remove it after deploying
> the new revision so it stops running:
>
> ```bash
> firebase functions:delete sendScheduledDigest
> ```

## Local test

```bash
firebase emulators:start --only functions
```
