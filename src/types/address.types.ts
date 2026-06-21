export interface Settlement {
  id: number;
  zipCode: string;
  settlement: string;
  settlementType: string;
  abbreviation: string;
  locality: string;
  zoneType: string;
  municipality: string;
  municipalityId: number;
  stateId: number;
  stateName: string;
}

export interface StreetType {
  id: number;
  name: string;
  abbreviation?: string;
}

export interface CreateAddressDto {
  personId: number;
  streetTypeId: number;
  street: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  block?: string;
  betweenStreets?: string;
  zipCodeId: number;
}

export interface UpdateAddressDto {
  streetTypeId?: number;
  street?: string;
  exteriorNumber?: string | null;
  interiorNumber?: string | null;
  block?: string | null;
  betweenStreets?: string | null;
  zipCodeId?: number;
}

export interface AddressInfo {
  id: number;
  streetType: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  block: string;
  betweenStreets: string;
  curp: string;
  fullName: string;
  zipCode: string;
  settlement: string;
  settlementType: string;
  locality: string;
  municipalityName: string;
  municipalCapital: string;
  municipalityId: number;
  stateId: number;
  stateName: string;
  fullAddress: string | null;
}

export interface AddressListItem {
  id: number;
  streetType: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  block: string;
  betweenStreets: string;
  curp: string;
  fullName: string;
  zipCode: string;
  settlement: string;
  settlementType: string;
  locality: string;
  municipalityName: string;
  municipalCapital: string;
  municipalityId: number;
  stateId: number;
  stateName: string;
  fullAddress: string | null;
}
