import type { ApiResponse } from '~/types/api.types';
import type {
  DocumentType,
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

export const documentService = {
  async getDocumentTypes(): Promise<DocumentType[]> {
    const endpoints = [
      '/catalogs/document-types',
      '/catalogs/catalog/document-types',
    ] as const;

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
};
