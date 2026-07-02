import type { ApiResponse } from '~/types/api.types';
import type {
  BulkUploadDocumentsDto,
  BulkUploadDocumentsResult,
  DocumentDetail,
  DocumentType,
  PersonDocumentListItem,
  UpdateDocumentMetadataDto,
  UploadDocumentResult,
  UploadedDocumentRecord,
  UploadPersonDocumentDto,
} from '~/types/document.types';
import { apiClient } from '../api.client';

const normalizeDocumentTypes = (items: any[] | undefined): DocumentType[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map<DocumentType | null>((item, index) => {
      const rawName =
        item.name ??
        item.documentType ??
        item.description ??
        item.label ??
        item.type;

      const name = typeof rawName === 'string' ? rawName.trim() : '';
      if (!name) return null;

      const parsedId =
        typeof item.id === 'number'
          ? item.id
          : Number(item.id ?? index + 1) || index + 1;

      return {
        id: parsedId,
        name,
        code: typeof item.code === 'string' ? item.code.trim() : null,
      };
    })
    .filter((item): item is DocumentType => item !== null);
};

const normalizeDocumentItem = (item: any): PersonDocumentListItem => ({
  id: Number(item.id ?? 0),
  personId: Number(item.personId ?? item.person_id ?? 0),
  studentId:
    item.studentId ??
    item.student_id ??
    item.student?.id ??
    item.student?.studentId ??
    null,
  staffId: item.staffId ?? item.staff_id ?? item.staff?.id ?? null,
  documentTypeId:
    item.documentTypeId ??
    item.document_type_id ??
    item.documentType?.id ??
    null,
  documentName:
    item.documentName ??
    item.documentTypeName ??
    item.documentType?.name ??
    item.name ??
    'Documento',
  filePath: item.filePath ?? item.path ?? null,
  mimeType: item.mimeType ?? item.mime ?? null,
  deliveryDate: item.deliveryDate ?? null,
  notes: item.notes ?? null,
  studentCode:
    item.studentCode ??
    item.student?.studentCode ??
    item.student?.codeNumber ??
    null,
  employeeCode:
    item.employeeCode ??
    item.staff?.employeeCode ??
    item.staff?.paymentUniqueKey ??
    null,
});

const normalizeDocumentDetail = (item: any): DocumentDetail => ({
  ...normalizeDocumentItem(item),
  personName:
    item.personName ??
    item.person?.fullName ??
    item.fullName ??
    item.person?.name ??
    null,
  personCurp: item.personCurp ?? item.person?.curp ?? null,
  studentName: item.studentName ?? item.student?.fullName ?? null,
  staffName: item.staffName ?? item.staff?.fullName ?? null,
  uploadedBy: item.uploadedBy ?? item.createdByName ?? item.createdBy ?? null,
  createdBy: item.createdBy ?? null,
});

export const documentService = {
  async getDocumentTypes(): Promise<DocumentType[]> {
    const endpoints = ['/document-types', '/catalog/document-types'] as const;

    let lastError: unknown;

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.get<ApiResponse<any[]>>(endpoint);
        return normalizeDocumentTypes(response.data.data);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  },

  async upload(
    dto: UploadPersonDocumentDto,
  ): Promise<UploadDocumentResult & { data: UploadedDocumentRecord }> {
    const formData = new FormData();
    formData.append('file', dto.file);
    formData.append('personId', String(dto.personId));
    formData.append('documentTypeId', String(dto.documentTypeId));

    if (dto.studentId) {
      formData.append('studentId', String(dto.studentId));
    }

    if (dto.staffId) {
      formData.append('staffId', String(dto.staffId));
    }

    if (dto.deliveryDate) {
      formData.append('deliveryDate', dto.deliveryDate);
    }

    if (dto.notes) {
      formData.append('notes', dto.notes);
    }

    const response = await apiClient.post<ApiResponse<UploadedDocumentRecord>>(
      '/documents',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );

    return {
      message: response.data.message,
      data: response.data.data,
    };
  },

  async listByPerson(
    personId: number,
    filters: { studentId?: number; staffId?: number } = {},
  ): Promise<PersonDocumentListItem[]> {
    const query = new URLSearchParams();

    if (filters.studentId) {
      query.set('studentId', String(filters.studentId));
    }

    if (filters.staffId) {
      query.set('staffId', String(filters.staffId));
    }

    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await apiClient.get<ApiResponse<any[]>>(
      `/documents/person/${personId}${suffix}`,
    );

    return Array.isArray(response.data.data)
      ? response.data.data.map(normalizeDocumentItem)
      : [];
  },

  async findOne(id: number): Promise<DocumentDetail> {
    const response = await apiClient.get<ApiResponse<any> | any>(
      `/documents/${id}`,
    );
    const payload =
      'data' in response.data ? response.data.data : response.data;
    return normalizeDocumentDetail(payload);
  },

  async updateMetadata(
    id: number,
    dto: UpdateDocumentMetadataDto,
  ): Promise<UploadedDocumentRecord> {
    const response = await apiClient.patch<ApiResponse<UploadedDocumentRecord>>(
      `/documents/${id}`,
      dto,
    );

    return response.data.data;
  },

  async bulkUpload(
    dto: BulkUploadDocumentsDto,
  ): Promise<{ message?: string; data: BulkUploadDocumentsResult }> {
    const formData = new FormData();
    const appendBulkScalar = (index: number, field: string, value: string) => {
      formData.append(`documents[${index}][${field}]`, value);
      formData.append(`documents[${index}].${field}`, value);
      formData.append(`documents.${index}.${field}`, value);
    };

    formData.append('personId', String(dto.personId));

    if (dto.deliveryDate) {
      formData.append('deliveryDate', dto.deliveryDate);
    }

    dto.documents.forEach((document, index) => {
      appendBulkScalar(
        index,
        'documentTypeId',
        String(document.documentTypeId),
      );
      formData.append(`documents[${index}][file]`, document.file);

      if (document.notes) {
        appendBulkScalar(index, 'notes', document.notes);
      }

      if (document.studentId) {
        appendBulkScalar(index, 'studentId', String(document.studentId));
      }

      if (document.staffId) {
        appendBulkScalar(index, 'staffId', String(document.staffId));
      }
    });

    const response = await apiClient.post<
      ApiResponse<BulkUploadDocumentsResult>
    >('/documents/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return {
      message: response.data.message,
      data: response.data.data,
    };
  },
};
