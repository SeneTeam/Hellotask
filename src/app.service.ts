import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  // logger instance
  private logger = new Logger('AppService');

  getHello(): string {
    return 'Hello World!';
  }
}
