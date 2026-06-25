import type { ApiResponse } from '~/types/api.types';
import type {
  CreateStudentDto,
  StudentRecord,
  StudentSearchParams,
  StudentSearchResult,
  UpdateStudentDto,
  ViewStudent,
} from '~/types/student.types';
import { apiClient } from '../api.client';

export const studentService = {
  async findMany(
    params: StudentSearchParams,
  ): Promise<ApiResponse<StudentSearchResult[]>> {
    const query = new URLSearchParams();

    if (params.page) query.set('page', String(params.page));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.searchTerm) query.set('searchTerm', params.searchTerm);
    if (params.firstName) query.set('firstName', params.firstName);
    if (params.firstLastName) {
      query.set('firstLastName', params.firstLastName);
    }
    if (params.secondLastName) {
      query.set('secondLastName', params.secondLastName);
    }
    if (params.curp) query.set('curp', params.curp);
    if (params.codeNumber) query.set('codeNumber', params.codeNumber);
    if (params.stateName) query.set('stateName', params.stateName);
    if (params.municipalityName) {
      query.set('municipalityName', params.municipalityName);
    }
    if (params.academicDiscipline) {
      query.set('academicDiscipline', params.academicDiscipline);
    }
    if (params.educationLevel) {
      query.set('educationLevel', params.educationLevel);
    }
    if (params.modality) query.set('modality', params.modality);
    if (params.studyPlan) query.set('studyPlan', params.studyPlan);
    if (params.generation !== undefined) {
      query.set('generation', String(params.generation));
    }
    if (params.semester !== undefined) {
      query.set('semester', String(params.semester));
    }
    if (params.schoolYear) query.set('schoolYear', params.schoolYear);
    if (params.statusKey) query.set('statusKey', params.statusKey);
    if (params.isActive !== undefined) {
      query.set('isActive', String(params.isActive));
    }

    const response = await apiClient.get<ApiResponse<StudentSearchResult[]>>(
      `/students/query?${query.toString()}`,
    );
    return response.data;
  },

  async create(dto: CreateStudentDto): Promise<StudentRecord> {
    const response = await apiClient.post<ApiResponse<StudentRecord>>(
      '/students',
      dto,
    );
    return response.data.data;
  },

  async createMany(dto: { students: CreateStudentDto[] }): Promise<void> {
    await apiClient.post('/students/bulk', dto);
  },

  async updateEmailsBatch(dto: {
    updatesMails: { id: number; institutionalMail: string }[];
  }): Promise<void> {
    await apiClient.patch('/students/batch/emails', dto);
  },

  async updateCodesBatch(dto: {
    updatesCodes: { id: number; codeNumber: string }[];
  }): Promise<void> {
    await apiClient.patch('/students/batch/codes', dto);
  },

  async findOne(search: string | number): Promise<ViewStudent> {
    const response = await apiClient.get<
      ApiResponse<ViewStudent> | ViewStudent
    >(`/students/${search}`);

    return 'data' in response.data ? response.data.data : response.data;
  },

  async update(id: number, dto: UpdateStudentDto): Promise<ViewStudent> {
    const response = await apiClient.patch<ApiResponse<ViewStudent>>(
      `/students/${id}`,
      dto,
    );
    return response.data.data;
  },
};
