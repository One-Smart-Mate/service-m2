import { CustomLoggerService } from 'src/common/logger/logger.service';
import { FirebaseService } from './firebase.service';
import { NotificationDTO } from './models/firebase.request.dto';

describe('FirebaseService sensitive data', () => {
  const send = jest.fn().mockResolvedValue('message-id');
  const messaging = { send };
  const logger = {
    logFirebase: jest.fn(),
    logException: jest.fn(),
  } as unknown as CustomLoggerService;
  const service = new FirebaseService(messaging as any, logger);
  const notification = new NotificationDTO('Title', 'Body', 'TYPE');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not log a recipient token for a single notification', async () => {
    await service.sendNewMessage(notification, 'private-device-token');

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'private-device-token' }),
    );
    expect(
      JSON.stringify(jest.mocked(logger.logFirebase).mock.calls),
    ).not.toContain('private-device-token');
  });

  it('does not log recipient tokens for batch notifications', async () => {
    await service.sendMultipleMessage(notification, [
      { token: 'private-android-token', type: 'ANDROID' },
      { token: 'private-ios-token', type: 'IOS' },
    ]);

    const logs = JSON.stringify(jest.mocked(logger.logFirebase).mock.calls);
    expect(logs).not.toContain('private-android-token');
    expect(logs).not.toContain('private-ios-token');
  });
});
