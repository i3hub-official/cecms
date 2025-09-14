export interface Center {
  id: string;
  number: string;
  name: string;
  address: string;
  state: string;
  lga: string;
  isActive: boolean;
  createdAt: string;
  modifiedAt: string;
  createdBy: string;
  modifiedBy: string | null;
}

export interface Stats {
  total: number;
  active: number;
  inactive: number;
  inactiveCenters: Center[];
  recentActivity: Center[];
}

export interface Duplicate {
  centers: Center[];
  similarity: number;
  type: "name" | "address" | "location";
}

export interface LocationData {
  states: string[];
  lgas: { [state: string]: string[] };
}
