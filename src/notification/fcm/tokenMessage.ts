import * as admin from 'firebase-admin';

export class tokenMessage implements admin.messaging.TokenMessage {
  notification: admin.messaging.Notification;
  android: admin.messaging.AndroidConfig;
  apns: admin.messaging.ApnsConfig;
  webpush: admin.messaging.WebpushConfig;
  fcmOptions: admin.messaging.FcmOptions;
  token: string;
  data: admin.messaging.DataMessagePayload;
}
