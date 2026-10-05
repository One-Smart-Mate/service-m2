import { CiltSecuencesScheduleEntity } from './entities/ciltSecuencesSchedule.entity';

const FIELDS = [
  'id',
  'siteId',
  'ciltId',
  'secuenceId',
  'frecuency',
  'schedule',
  'scheduleType',
  'endDate',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
  'dayOfMonth',
  'allowExecuteBefore',
  'allowExecuteBeforeMinutes',
  'toleranceBeforeMinutes',
  'toleranceAfterMinutes',
  'allowExecuteAfterDue',
  'status',
  'deletedAt',
];
export function scheduleFingerprint(
  schedule: Partial<CiltSecuencesScheduleEntity>,
): string {
  return JSON.stringify(
    FIELDS.map((key) => {
      const value = schedule[key];
      return value == null
        ? null
        : value instanceof Date
          ? value.toISOString()
          : String(value);
    }),
  );
}

/** A template edited during generation must be regenerated from fresh data. */
export function sequenceFingerprint(sequence: Record<string, any>): string {
  return JSON.stringify(
    [
      'standardOk',
      'referencePoint',
      'secuenceList',
      'secuenceColor',
      'ciltTypeId',
      'ciltTypeName',
      'referenceOplSopId',
      'remediationOplSopId',
      'toolsRequired',
      'selectableWithoutProgramming',
      'stoppageReason',
      'machineStopped',
      'standardTime',
      'specialWarning',
    ].map((key) => (sequence[key] == null ? null : String(sequence[key]))),
  );
}
