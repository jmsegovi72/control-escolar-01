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
  code: string;
  inegiNumber: string;
  municipality: string;
  municipalCapital: string;
  stateId: number;
}

export interface QueryMunicipalityDto {
  stateId?: number;
  stateCode?: string;
  searchTerm?: string;
}
