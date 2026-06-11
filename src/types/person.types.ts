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
  gender: 'M' | 'F';
  personalPhone: string;
  personalEmail: string;
  municipalityId?: number;
  municipalityName?: string;
  stateName?: string;
  birthDate?: string;
  nationality?: string;
  rfc?: string | null;
  isActive: boolean;
}

export interface CreatePersonDto {
  firstName: string;
  firstLastName: string;
  secondLastName?: string;
  curp: string;
  gender: 'M' | 'F';
  phone: string;
  email: string;
  municipalityId?: number;
  birthDate?: string;
  homoclave?: string;
  nationality?: string;
}

export type UpdatePersonDto = Partial<CreatePersonDto>;

export interface FindPersonsParams {
  searchTerm?: string;
  firstName?: string;
  firstLastName?: string;
  secondLastName?: string;
  fullName?: string;
  curp?: string;
  stateName?: string;
  municipalityName?: string;
  isActive?: boolean;
  limit?: number;
  page?: number;
}
