const TRUE_VALUES = new Set(['1', 'true', 'yes']);
const FALSE_VALUES = new Set(['0', 'false', 'no']);
const DEVELOPMENT_ENVIRONMENTS = new Set([
  'dev',
  'development',
  'local',
  'test',
]);

const parseSynchronizeFlag = (value?: string): boolean => {
  if (value === undefined || value.trim() === '') {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) {
    return true;
  }
  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  throw new Error('DB_SYNCHRONIZE must be true or false');
};

export const shouldSynchronizeDatabase = (
  environment: NodeJS.ProcessEnv = process.env,
): boolean => {
  if (!parseSynchronizeFlag(environment.DB_SYNCHRONIZE)) {
    return false;
  }

  const runtimeEnvironment = (
    environment.DEPLOY_ENV ||
    environment.NODE_ENV ||
    ''
  )
    .trim()
    .toLowerCase();

  if (!DEVELOPMENT_ENVIRONMENTS.has(runtimeEnvironment)) {
    throw new Error(
      'DB_SYNCHRONIZE can only be enabled in dev, development, local or test',
    );
  }

  return true;
};
