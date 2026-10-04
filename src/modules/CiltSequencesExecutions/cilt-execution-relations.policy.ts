import { CiltSequencesExecutionsEntity } from './entities/ciltSequencesExecutions.entity';

/** Do not expose cross-site relations from legacy executions created before write validation. */
export function sanitizeExecutionRelations(
  execution: CiltSequencesExecutionsEntity,
): CiltSequencesExecutionsEntity {
  for (const field of ['referenceOplSop', 'remediationOplSop'] as const) {
    const opl = execution[field];
    if (
      opl &&
      (Number(opl.siteId) !== Number(execution.siteId) || opl.deletedAt)
    )
      execution[field] = null;
  }
  return execution;
}
