import { BadRequestException } from '@nestjs/common';
import { AmDiscardReasonController } from './am-discard-reason.controller';
import { AmDiscardReasonService } from './am-discard-reason.service';

describe('AmDiscardReasonController', () => {
  const service = {
    update: jest.fn(),
  } as unknown as AmDiscardReasonService;
  const controller = new AmDiscardReasonController(service);

  it('rejects a route id that differs from the body id', () => {
    expect(() =>
      controller.update(1, {
        id: 2,
        updatedAt: '2026-09-18T00:00:00.000Z',
      }),
    ).toThrow(BadRequestException);
    expect(service.update).not.toHaveBeenCalled();
  });
});
