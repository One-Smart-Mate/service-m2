import {
  digestFastPassword,
  getFastPasswordPepper,
} from './fast-password.crypto';

describe('fast password crypto', () => {
  const pepper = 'a-secure-fast-password-pepper-with-32-bytes';

  it('creates a deterministic digest without storing the credential', () => {
    const digest = digestFastPassword('Ab12', pepper);

    expect(digest).toHaveLength(64);
    expect(digest).toBe(digestFastPassword('aB12', pepper));
    expect(digest).not.toContain('Ab12');
  });

  it('requires a sufficiently strong pepper', () => {
    expect(() => getFastPasswordPepper({})).toThrow(
      'FAST_PASSWORD_PEPPER is required',
    );
    expect(() =>
      getFastPasswordPepper({ FAST_PASSWORD_PEPPER: 'short' }),
    ).toThrow('at least 32 bytes');
  });
});
