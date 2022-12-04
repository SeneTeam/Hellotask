import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as admin from 'firebase-admin';
import { tokenMessage } from './fcm/tokenMessage';
import { topicMessage } from './fcm/topicMessage';
import { conditionMessage } from './fcm/conditionMessage';

@Injectable()
export class NotificationService {
  constructor(private readonly httpService: HttpService) {}
  // ------------------- Firebase Cloud Messaging -------------------

  sendNotification(
    token: string,
    title: string,
    body: string,
    imageUrl?: string,
    link?: string,
  ) {
    // send notification
    this.sendNotificationToToken(token, title, body, imageUrl, link);
  }

  async sendNotificationToToken(
    token: string,
    title: string,
    body: string,
    imageUrl?: string,
    link?: string,
    data?: admin.messaging.DataMessagePayload,
  ) {
    // send notification to topic
    const message: tokenMessage = new tokenMessage();
    message.notification = {
      title: title,
      body: body,
    };
    if (data) {
      // Set Data for the notification
      message.data = data;
    }
    if (imageUrl) {
      message.notification.imageUrl = imageUrl;
    }
    //!TODO: Fix issue with link not working

    // Set Firebase FCM Token
    message.token = token;

    // Send a message to the device corresponding to the provided
    // registration token.
    return admin.messaging().send(message);
  }

  sendNotificationToTopic(
    topic: string,
    title: string,
    body: string,
    imageUrl?: string,
    link?: string,
  ) {
    // send notification to topic
    const message: admin.messaging.TopicMessage = new topicMessage();
    message.notification = {
      title: title,
      body: body,
    };
    if (imageUrl) {
      message.notification.imageUrl = imageUrl;
    }
    //!TODO: Fix issue with link not working

    // Set Firebase FCM Topic
    message.topic = topic;

    // Send a message to devices subscribed to the provided topic.
    admin.messaging().send(message);
  }

  sendNotificationToCondition(
    condition: string,
    title: string,
    body: string,
    imageUrl?: string,
    link?: string,
  ) {
    // send notification to topic
    const message: admin.messaging.ConditionMessage = new conditionMessage();
    message.notification = {
      title: title,
      body: body,
    };
    if (imageUrl) {
      message.notification.imageUrl = imageUrl;
    }
    //!TODO: Fix issue with link not working

    // Set Firebase FCM Topic
    message.condition = condition;

    // Send a message to devices subscribed to the provided topic.
    admin.messaging().send(message);
  }

  // ------------------- SMS  -------------------

  sendSMS(phoneNumber: string, message: string) {
    // Read the SMS API Key from the environment
    const SMS_SSLWIRELESS_URL = process.env.SMS_SSLWIRELESS_URL;
    const SMS_SSLWIRELESS_API_KEY = process.env.SMS_SSLWIRELESS_API_KEY;
    const SMS_SSLWIRELESS_SID = process.env.SMS_SSLWIRELESS_SID;

    // Send SMS
    this.httpService.post(SMS_SSLWIRELESS_URL, {
      api_token: SMS_SSLWIRELESS_API_KEY,
      sid: SMS_SSLWIRELESS_SID,
      msisdn: phoneNumber,
      sms: message,
    });
  }
}
