export class ExecutionChartResponseDTO {
  date: string;
  programmed: number;
  executed: number;
}

export class ComplianceByPersonChartResponseDTO {
  userId: number;
  userName: string;
  assigned: number;
  executed: number;
  compliancePercentage: number;
}

export class TimeChartResponseDTO {
  date: string;
  standardTime: number; // en segundos
  realTime: number; // en segundos
  executedCount: number;
  standardTimeMinutes: number;
  realTimeMinutes: number;
  efficiencyPercentage: number;
}

export class AnomaliesChartResponseDTO {
  date: string;
  totalAnomalies: number;
  nokAnomalies: number;
  amTagAnomalies: number;
  stoppageAnomalies: number;
}

 