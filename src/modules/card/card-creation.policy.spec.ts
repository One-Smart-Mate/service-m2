import { ValidationException } from 'src/common/exceptions/types/validation.exception';
import { CardCreationPolicy } from './card-creation.policy';

describe('CardCreationPolicy', () => {
  it('calculates the due date from a regular priority', () => {
    const result = CardCreationPolicy.resolveDates({
      cardCreationDate: '2026-09-23T22:30:00.000Z',
      priorityCode: 'P1',
      priorityDays: 3,
    });

    expect(result.cardCreationDate).toBe('2026-09-23T22:30:00.000Z');
    expect(result.createdAt.toISOString()).toBe('2026-09-23T22:30:00.000Z');
    expect([
      result.cardDueDate.getFullYear(),
      result.cardDueDate.getMonth() + 1,
      result.cardDueDate.getDate(),
    ]).toEqual([2026, 9, 26]);
  });

  it('requires a custom date for the wildcard priority', () => {
    try {
      CardCreationPolicy.resolveDates({
        cardCreationDate: '2026-09-23T12:00:00.000Z',
        priorityCode: 'XX',
        priorityDays: 0,
      });
      throw new Error('Expected custom due date validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationException);
      expect((error as ValidationException).getResponse()).toBe(
        'A custom due date is required for the wildcard priority',
      );
    }
  });

  it('accepts a valid custom date for the wildcard priority', () => {
    const result = CardCreationPolicy.resolveDates({
      cardCreationDate: '2026-09-23T12:00:00.000Z',
      priorityCode: 'xx  ',
      priorityDays: 0,
      customDueDate: '2026-10-15',
    });

    expect([
      result.cardDueDate.getFullYear(),
      result.cardDueDate.getMonth() + 1,
      result.cardDueDate.getDate(),
    ]).toEqual([2026, 10, 15]);
  });

  it('rejects custom dates for regular priorities', () => {
    expect(() =>
      CardCreationPolicy.resolveDates({
        cardCreationDate: '2026-09-23T12:00:00.000Z',
        priorityCode: 'P1',
        priorityDays: 3,
        customDueDate: '2026-10-15',
      }),
    ).toThrow(ValidationException);
  });

  it.each(['2026-02-30', '23-09-2026', ''])(
    'rejects the invalid custom date %s',
    (customDueDate) => {
      expect(() =>
        CardCreationPolicy.resolveDates({
          cardCreationDate: '2026-09-23T12:00:00.000Z',
          priorityCode: 'XX',
          priorityDays: 0,
          customDueDate,
        }),
      ).toThrow(ValidationException);
    },
  );

  it('rejects a custom due date before the offline creation date', () => {
    expect(() =>
      CardCreationPolicy.resolveDates({
        cardCreationDate: '2026-09-23T12:00:00.000Z',
        priorityCode: 'XX',
        priorityDays: 0,
        customDueDate: '2026-09-22',
      }),
    ).toThrow(ValidationException);
  });

  it('rejects an invalid offline creation timestamp', () => {
    try {
      CardCreationPolicy.resolveDates({
        cardCreationDate: 'not-a-date',
        priorityCode: 'P1',
        priorityDays: 3,
      });
      throw new Error('Expected date validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationException);
      expect((error as ValidationException).getResponse()).toBe(
        'Invalid date provided',
      );
      expect((error as ValidationException).getStatus()).toBe(400);
    }
  });
});
