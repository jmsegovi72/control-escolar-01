export interface DocumentType {
  id: number;
  name: string;
  code?: string | null;
}

export interface UploadedDocumentRecord {
  id: number;
  personId: number;
  studentId?: number | null;
  staffId?: number | null;
  documentTypeId: number;
  filePath?: string | null;
  mimeType?: string | null;
  deliveryDate?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface UploadDocumentResult {
  message?: string;
  data: UploadedDocumentRecord;
}

export interface UploadPersonDocumentDto {
  personId: number;
  documentTypeId: number;
  file: File;
  studentId?: number;
  staffId?: number;
  deliveryDate?: string;
  notes?: string;
}
