export interface Week {
  issued: number | string;
  cumulativeIssued?: number;
  eradicated: number | string;
  cumulativeEradicated?: number;
  [key: string]: any;
}