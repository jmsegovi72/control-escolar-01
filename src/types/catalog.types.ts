export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface UserType {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface Municipality {
  id: number;
  code?: string;
  inegiNumber?: string;
  municipality: string;
  municipalCapital?: string;
  stateId: number;
}

export interface State {
  id: number;
  code: string;
  name: string;
}

export interface QueryMunicipalityDto {
  stateId?: number;
  stateCode?: string;
  searchTerm?: string;
}

export interface NamedCatalogItem {
  id: number;
  name: string;
}

export interface CatalogApiItem {
  id?: number | string;
  name?: string | null;
  status?: string | null;
  label?: string | null;
  description?: string | null;
  value?: string | number | null;
  maritalStatus?: string | null;
  indigenousLanguage?: string | null;
  foreignLanguage?: string | null;
  specialCondition?: string | null;
}
