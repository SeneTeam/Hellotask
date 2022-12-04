import * as admin from 'firebase-admin';

export class topicMessage implements admin.messaging.TopicMessage {
  notification: admin.messaging.Notification;
  android: admin.messaging.AndroidConfig;
  apns: admin.messaging.ApnsConfig;
  webpush: admin.messaging.WebpushConfig;
  fcmOptions: admin.messaging.FcmOptions;
  topic: string;
}
