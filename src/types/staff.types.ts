import type { ApiResponse } from './api.types';

export interface StaffSearchResult {
  id: number;
  personId?: number | null;
  curp: string;
  firstName?: string | null;
  firstLastName?: string | null;
  secondLastName?: string | null;
  fullName: string;
  institutionalMail?: string | null;
  paymentUniqueKey?: string | null;
  employeeCode?: string | null;
  staffStatus?: string | null;
  staffType?: string | null;
  employmentType?: string | null;
  category?: string | null;
  isActive?: boolean | null;
  photoUrl?: string | null;
}

export type StaffQueryResponse = ApiResponse<StaffSearchResult[]>;
