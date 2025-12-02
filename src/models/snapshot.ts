export interface Snapshot {
  id: number;
  clientId: number;
  fundCode: string | null;
  fundType: string | null;
  fundName: string | null;
  fundNumber: string | null;
  amount: number;
  snapshotDate: string;
}
