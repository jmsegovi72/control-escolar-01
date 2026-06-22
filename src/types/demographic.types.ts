export interface CreateDemographicDto {
  personId: number;
  maritalStatusId?: number;
  isIndigenous: boolean;
  isAfroDescendant: boolean;
  indigenousLangId?: number;
  foreignLangId?: number;
  specialConditionId?: number;
}

export type UpdateDemographicDto = Partial<CreateDemographicDto>;

export interface FindDemographicsParams {
  fullName?: string;
  gender?: 'H' | 'M' | string;
  maritalStatus?: string;
  indigenousLanguage?: string;
  foreignLanguage?: string;
  specialCondition?: string;
  isIndigenous?: boolean;
  isAfroDescendant?: boolean;
  searchTerm?: string;
  page?: number;
  limit?: number;
}

export interface ViewDemographic {
  id: number;
  personId: number;
  curp: string;
  fullName: string;
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  gender: string;
  age: number | null;
  maritalStatus: string | null;
  indigenousLanguage: string | null;
  foreignLanguage: string | null;
  specialCondition: string | null;
  isIndigenous: boolean;
  isAfroDescendant: boolean;
}
