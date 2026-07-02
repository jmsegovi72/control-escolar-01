export interface DocumentType {
  id: number;
  name: string;
  code?: string | null;
}

export interface PersonDocumentListItem {
  id: number;
  personId: number;
  studentId?: number | null;
  staffId?: number | null;
  documentTypeId?: number | null;
  documentName: string;
  filePath?: string | null;
  mimeType?: string | null;
  deliveryDate?: string | null;
  notes?: string | null;
  studentCode?: string | null;
  employeeCode?: string | null;
}

export interface DocumentDetail extends PersonDocumentListItem {
  personName?: string | null;
  personCurp?: string | null;
  studentName?: string | null;
  staffName?: string | null;
  uploadedBy?: string | null;
  createdBy?: string | null;
}

export interface UpdateDocumentMetadataDto {
  studentId?: number | null;
  staffId?: number | null;
  deliveryDate?: string;
  notes?: string;
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

export interface BulkUploadDocumentItemDto {
  documentTypeId: number;
  file: File;
  notes?: string;
  studentId?: number;
  staffId?: number;
}

export interface BulkUploadDocumentsDto {
  personId: number;
  deliveryDate?: string;
  documents: BulkUploadDocumentItemDto[];
}

export type BulkUploadItemStatus = 'created' | 'replaced' | 'error';

export interface BulkUploadItemResult {
  index: number;
  documentTypeId: number;
  status: BulkUploadItemStatus;
  message: string;
  data?: {
    id: number;
    filePath?: string | null;
  };
}

export interface BulkUploadDocumentsResult {
  total: number;
  processed: number;
  created: number;
  replaced: number;
  failed: number;
  items: BulkUploadItemResult[];
}
