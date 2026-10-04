import { instanceToPlain } from 'class-transformer';
import { UserEntity } from './user.entity';

describe('UserEntity serialization', () => {
  it('never serializes credentials, recovery data or push tokens', () => {
    const user = Object.assign(new UserEntity(), {
      id: 7,
      name: 'User',
      email: 'user@example.com',
      password: 'password-hash',
      fastPasswordDigest: 'fast-password-digest',
      rememberToken: 'remember-token',
      resetCode: 'reset-code-hash',
      resetCodeExpiration: new Date(),
      appToken: 'app-token',
      iosToken: 'ios-token',
      androidToken: 'android-token',
      webToken: 'web-token',
    });

    expect(instanceToPlain(user)).toEqual(
      expect.objectContaining({
        id: 7,
        name: 'User',
        email: 'user@example.com',
      }),
    );
    for (const secret of [
      'password',
      'fastPasswordDigest',
      'rememberToken',
      'resetCode',
      'resetCodeExpiration',
      'appToken',
      'iosToken',
      'androidToken',
      'webToken',
    ]) {
      expect(instanceToPlain(user)).not.toHaveProperty(secret);
    }
  });
});
