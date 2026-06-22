export interface CreateEmergencyContactDto {
  fullName: string;
  phone: string;
  personId: number;
  relationshipId: number;
}

export interface UpdateEmergencyContactDto {
  fullName?: string;
  phone?: string;
  relationshipId?: number;
}

export interface ViewEmergencyContact {
  id: number;
  personId: number;
  personCurp: string;
  personName: string;
  contactName: string;
  contactPhone: string;
  relationship: string;
}
