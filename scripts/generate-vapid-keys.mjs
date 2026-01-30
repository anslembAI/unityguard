import webpush from 'web-push';

console.log('Generating VAPID keys...');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n=== VAPID Keys Generated ===\n');
console.log('Public Key:');
console.log(vapidKeys.publicKey);
console.log('\nPrivate Key:');
console.log(vapidKeys.privateKey);
console.log('\n=== Copy these to your .env.local file ===\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
