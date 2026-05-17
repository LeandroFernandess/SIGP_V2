# SIGP Cloud Functions

Backend ownership of the AI digest delivery so OpenAI and EmailJS credentials
never leave the server. The digest is dispatched on each successful login when
the user has the option enabled, plus on demand via the "Enviar agora" button.

## Functions

| Name | Type | What it does |
| --- | --- | --- |
| `sendDigestOnLogin` | HTTPS callable | Invoked by the dashboard right after the user signs in. Sends the digest only when `prefs.enabled` is true; otherwise returns `{ ok: true, skipped: true }`. |
| `sendDigestNow` | HTTPS callable | Used by the "Enviar agora" button — sends immediately for the calling user. |

## Pre-deploy setup

> Requires the Firebase **Blaze** plan (secrets).

```bash
cd functions
npm install

# Secrets
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set EMAILJS_PRIVATE_KEY    # EmailJS dashboard → Account → API Keys → Private Key

# Runtime config (non-secret EmailJS identifiers)
firebase functions:config:set \
  emailjs.service_id="service_oyf1zei" \
  emailjs.template_id="template_lqll858" \
  emailjs.public_key="5JgttFH7TW0i34yAr"
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
