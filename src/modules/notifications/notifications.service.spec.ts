import { NotificationOutboxService } from './notification-outbox.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService durable delivery', () => {
  const outboxService = {
    enqueue: jest.fn(),
  } as unknown as NotificationOutboxService;
  const service = new NotificationsService(outboxService);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(outboxService.enqueue).mockResolvedValue({ id: 10 } as never);
  });

  it('queues app updates with a stable idempotency key', async () => {
    await expect(
      service.appUpdateNotification({
        appVersion: '2.0.0',
        title: 'Update',
        description: 'New version',
      }),
    ).resolves.toEqual({ queued: true, eventId: 10 });

    expect(outboxService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        deduplicationKey: 'app-update:2.0.0',
        payload: expect.objectContaining({
          audience: { type: 'all-users' },
        }),
      }),
    );
  });

  it('queues a custom audience without sending synchronously', async () => {
    await expect(
      service.sendCustomNotification({
        siteId: 2,
        userIds: [7, 8],
        title: 'Notice',
        description: 'Body',
      }),
    ).resolves.toEqual({ queued: true, eventId: 10 });

    expect(outboxService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        deduplicationKey: expect.stringMatching(/^custom:/),
        payload: expect.objectContaining({
          audience: { type: 'users', userIds: [7, 8] },
        }),
      }),
    );
  });
});
