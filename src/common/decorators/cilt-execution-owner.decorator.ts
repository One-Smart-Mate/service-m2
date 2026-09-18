import { SetMetadata } from '@nestjs/common';

export const CILT_EXECUTION_OWNER_KEY = 'ciltExecutionOwner';

export interface CiltExecutionOwnerOptions {
  resource: 'execution' | 'evidence' | 'newExecution';
  source: 'params' | 'query' | 'body';
  requestKey: string;
}

export const CiltExecutionOwner = (options: CiltExecutionOwnerOptions) =>
  SetMetadata(CILT_EXECUTION_OWNER_KEY, options);
