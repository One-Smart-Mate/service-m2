import { supportsSkipLocked } from './verify-database-readiness';

describe('database readiness version policy', () => {
  it.each(['8.0.42', '9.1.0'])('accepts supported MySQL versions', (version) => {
    expect(supportsSkipLocked(version)).toBe(true);
  });

  it.each(['10.6.21-MariaDB', '11.4.5-MariaDB'])(
    'accepts supported MariaDB versions',
    (version) => {
      expect(supportsSkipLocked(version)).toBe(true);
    },
  );

  it.each(['5.7.44', '10.5.28-MariaDB', 'unknown'])(
    'rejects engines without the required locking semantics',
    (version) => {
      expect(supportsSkipLocked(version)).toBe(false);
    },
  );
});
