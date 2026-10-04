import { BadRequestException, ConflictException } from '@nestjs/common';
import { DeepPartial } from 'typeorm';
import { CiltSequencesExecutionsEntity } from './entities/ciltSequencesExecutions.entity';

type Input = DeepPartial<CiltSequencesExecutionsEntity>;
const TERMINAL = new Set(['R', 'I', 'C']);
const STATES = new Set(['A', 'D', ...TERMINAL]);
const DATE_FIELDS = new Set([
  'secuenceStart',
  'secuenceStop',
  'secuenceSchedule',
]);

export class CiltExecutionStatePolicy {
  static date(value: unknown, field: string): Date {
    if (value == null || value === '')
      throw new BadRequestException(`${field} is required`);
    const date = new Date(value as string);
    if (!Number.isFinite(date.getTime()))
      throw new BadRequestException(`${field} is invalid`);
    // Match the existing MySQL timestamp/datetime precision for stable retries.
    date.setMilliseconds(0);
    return date;
  }

  static same(field: string, left: unknown, right: unknown): boolean {
    if (left == null || right == null) return left == null && right == null;
    if (DATE_FIELDS.has(field))
      return (
        this.date(left, field).getTime() === this.date(right, field).getTime()
      );
    return (
      left === right ||
      (typeof left !== 'object' &&
        typeof right !== 'object' &&
        String(left) === String(right))
    );
  }

  static assertTerminalRetry(
    current: CiltSequencesExecutionsEntity,
    input: Input,
  ): boolean {
    if (!TERMINAL.has(current.status)) return false;
    for (const [field, value] of Object.entries(input)) {
      if (value === undefined || ['id', 'updatedAt'].includes(field)) continue;
      if (!this.same(field, current[field], value)) {
        throw new ConflictException(
          'A terminal execution cannot be modified or reopened',
        );
      }
    }
    return true;
  }

  static normalize(
    input: Input,
    current?: CiltSequencesExecutionsEntity,
  ): Input {
    const patch = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    );
    const result: Input = { ...current, ...patch };
    result.status = result.status === undefined ? 'A' : result.status;
    if (!STATES.has(result.status))
      throw new BadRequestException('Invalid execution status');
    for (const field of ['secuenceStart', 'secuenceStop'] as const) {
      if (result[field] != null)
        result[field] = this.date(result[field], field);
    }
    if (
      current?.secuenceStart &&
      patch.secuenceStart !== undefined &&
      !this.same('secuenceStart', current.secuenceStart, patch.secuenceStart)
    ) {
      throw new ConflictException(
        'Execution start cannot be changed or cleared',
      );
    }
    if (
      result.realDuration != null &&
      (!Number.isSafeInteger(Number(result.realDuration)) ||
        Number(result.realDuration) < 0)
    ) {
      throw new BadRequestException(
        'Execution real duration must be nonnegative',
      );
    }
    if (
      current &&
      !current.secuenceStart &&
      result.secuenceStart != null &&
      !['A', 'R'].includes(result.status)
    ) {
      throw new ConflictException('Only active executions can be started');
    }
    if (current && result.status === 'R' && current.status !== 'A') {
      throw new ConflictException('Only active executions can be completed');
    }
    if (result.status === 'R') {
      if (!result.secuenceStart || !result.secuenceStop)
        throw new BadRequestException(
          'Completed executions require start and stop dates',
        );
      const duration = Math.floor(
        (new Date(result.secuenceStop as Date).getTime() -
          new Date(result.secuenceStart as Date).getTime()) /
          1000,
      );
      if (duration < 0)
        throw new BadRequestException('Execution stop cannot precede start');
      if (patch.realDuration != null && Number(patch.realDuration) !== duration)
        throw new BadRequestException(
          'Execution duration must match its dates',
        );
      result.realDuration = duration;
    } else if (result.secuenceStop != null) {
      throw new BadRequestException(
        'Only completed executions can have a stop date',
      );
    } else if (patch.realDuration != null && Number(patch.realDuration) !== 0) {
      throw new BadRequestException(
        'Execution duration is calculated at completion',
      );
    }
    if (result.status === 'D' && result.secuenceStart != null)
      throw new BadRequestException('Draft executions cannot be started');
    return result;
  }
}
