import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { HandleException } from './handle.exception';
import { SqlException } from '../types/sql.exception';

describe('HandleException', () => {
  it.each([
    new BadRequestException('invalid request'),
    new ForbiddenException('forbidden'),
    new ConflictException('conflict'),
  ])('preserves HTTP exception semantics', (exception: HttpException) => {
    expect(() => HandleException.exception(exception)).toThrow(exception);
  });

  it('maps database errors to a classified SQL exception', () => {
    expect(() => HandleException.exception({ sqlState: '23000' })).toThrow(
      SqlException,
    );
  });

  it('does not expose an unexpected internal error', () => {
    expect(() =>
      HandleException.exception(new Error('secret failure')),
    ).toThrow(InternalServerErrorException);
  });
});
