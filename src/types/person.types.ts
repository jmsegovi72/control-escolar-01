export interface Person {
  id: number;
  curp: string;
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  fullName: string | null;
  personalPhone: string;
  personalEmail: string;
}

export interface PersonListItem {
  id: number;
  firstName: string;
  firstLastName: string;
  secondLastName?: string;
  fullName: string;
  curp: string;
  gender: 'H' | 'M';
  photoUrl?: string | null;
  phone: string;
  personalEmail: string;
  birthState?: string;
  birthMunicipality?: string;
  birthDate?: string;
  nationality?: string;
  rfc?: string | null;
  isActive?: boolean;
}

export interface PersonDetail {
  id: number;
  curp: string;
  firstName: string;
  firstLastName: string;
  secondLastName?: string;
  fullName: string;
  gender: 'H' | 'M';
  photoUrl?: string | null;
  birthDate?: string;
  nationality?: string;
  phone: string;
  personalEmail: string;
  rfc?: string | null;
  birthState?: string;
  birthMunicipality?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreatePersonDto {
  firstName: string;
  firstLastName: string;
  secondLastName?: string;
  curp: string;
  gender: 'H' | 'M';
  phone: string;
  email: string;
  municipalityId?: number;
  birthDate?: string;
  homoclave?: string;
  nationality?: string;
}

export type UpdatePersonDto = Partial<CreatePersonDto>;

export interface ViewPerson {
  id: number;
  curp: string;
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  fullName: string;
  gender: 'H' | 'M';
  birthDate: string;
  age: number | null;
  nationality: string;
  birthState: string | null;
  municipalityId: number | null;
  birthMunicipality: string | null;
  phone: string;
  personalEmail: string;
  rfc: string | null;
  photoUrl: string | null;
}

export interface FindPersonsParams {
  searchTerm?: string;
  firstName?: string;
  firstLastName?: string;
  secondLastName?: string;
  fullName?: string;
  curp?: string;
  gender?: string;
  stateName?: string;
  municipalityName?: string;
  isActive?: boolean;
  hasAddress?: boolean;
  hasDemographic?: boolean;
  limit?: number;
  page?: number;
}

export interface PersonSearchCatalogs {
  states: string[];
  municipalities: { birthState: string; birthMunicipality: string }[];
}
