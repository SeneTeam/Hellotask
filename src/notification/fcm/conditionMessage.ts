import * as admin from 'firebase-admin';

export class conditionMessage implements admin.messaging.ConditionMessage {
  notification: admin.messaging.Notification;
  android: admin.messaging.AndroidConfig;
  apns: admin.messaging.ApnsConfig;
  webpush: admin.messaging.WebpushConfig;
  fcmOptions: admin.messaging.FcmOptions;
  condition: string;
}
