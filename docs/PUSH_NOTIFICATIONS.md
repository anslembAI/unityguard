# Push Notifications Setup

This project uses VAPID (Voluntary Application Server Identification) for web push notifications.

## VAPID Keys

VAPID keys have been generated and stored in [`.env.local`](../.env.local):

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: Public key used on the client-side for subscription
- `VAPID_PRIVATE_KEY`: Private key used on the server-side for sending notifications

## Regenerating VAPID Keys

If you need to generate new VAPID keys (for example, if the current keys are compromised), run:

```bash
npm run generate-vapid
```

This will display new public and private keys that you should update in your [`.env.local`](../.env.local) file.

## Service Worker

The service worker at [`public/sw.js`](../public/sw.js) handles incoming push notifications and notification clicks.

## Security Notes

- The `.env.local` file is included in `.gitignore` and should never be committed to version control
- The `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is safe to expose to the client (it's meant to be public)
- The `VAPID_PRIVATE_KEY` must remain server-side and never be exposed to the client
- Keep your private key secure - if it's compromised, regenerate new keys immediately

## Next Steps

To implement push notifications in your application:

1. **Client-side**: Use the public key to subscribe users to push notifications
2. **Server-side**: Use the private key with the `web-push` library to send notifications
3. **Database**: Store push subscription endpoints to send targeted notifications

Example server-side usage:

```javascript
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Send notification
await webpush.sendNotification(pushSubscription, payload);
```
