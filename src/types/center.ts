export interface Center {
  id: string;
  number: string;
  name: string;
  address: string;
  state: string;
  lga: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string;
  modifiedBy: string | null;
  modifiedById: string;
  modifiedByName: string;
  createdByName: string;
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
