import type { UserConfig } from '@commitlint/types';

const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Don't enforce a specific case for the subject
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
  },
};

export default Configuration;
