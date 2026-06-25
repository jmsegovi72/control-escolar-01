export interface StudentGeneration {
  id: number;
  generation: string;
  generationName?: string | null;
  mastersDegreeCycle?: string | null;
  bachelorDegreeCycle?: string | null;
}

export interface StudentStatus {
  id: number;
  status: string;
  key?: string | null;
  description?: string | null;
  statusKey?: string | null;
}

export interface EducationalProgram {
  id: number;
  code?: string | null;
  name: string;
  studyPlan?: string | null;
  level?: string | null;
}

export interface CreateStudentDto {
  personId: number;
  generationId: number;
  educationalProgramId: number;
  statusId?: number;
  codeNumber?: string;
  email?: string;
}

export interface UpdateStudentDto {
  generationId?: number;
  educationalProgramId?: number;
  statusId?: number;
  codeNumber?: string | null;
  email?: string | null;
}

export interface StudentSearchParams {
  searchTerm?: string;
  firstName?: string;
  firstLastName?: string;
  secondLastName?: string;
  curp?: string;
  codeNumber?: string;
  stateName?: string;
  municipalityName?: string;
  academicDiscipline?: string;
  educationLevel?: string;
  modality?: string;
  studyPlan?: string;
  generation?: number | string;
  semester?: number | string;
  schoolYear?: string;
  statusKey?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface StudentListItem {
  id: number;
  personId?: number;
  fullName: string;
  curp: string;
  studentCode?: string | null;
  institutionalMail?: string | null;
  educationalProgram?: string | null;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
  studyPlan?: string | null;
  generation?: string | number | null;
  currentSemester?: number | null;
  isActive?: boolean | null;
  statusDescription?: string | null;
  statusKey?: string | null;
}

export interface StudentSearchResult extends StudentListItem {
  firstName?: string | null;
  firstLastName?: string | null;
  secondLastName?: string | null;
  birthState?: string | null;
  birthMunicipality?: string | null;
  photoUrl?: string | null;
  programCode?: string | null;
  academicDiscipline?: string | null;
  educationLevel?: string | null;
  modality?: string | null;
  educationCycle?: string | null;
}

export interface ViewStudent {
  id: number;
  personId: number;
  fullName: string;
  firstName?: string | null;
  firstLastName?: string | null;
  secondLastName?: string | null;
  curp: string;
  gender?: string | null;
  age?: number | null;
  phone?: string | null;
  birthState?: string | null;
  birthMunicipality?: string | null;
  photoUrl?: string | null;
  studentCode?: string | null;
  institutionalMail?: string | null;
  educationalProgram?: string | null;
  programCode?: string | null;
  studyPlan?: string | null;
  academicDiscipline?: string | null;
  educationLevel?: string | null;
  modality?: string | null;
  generation?: string | number | null;
  educationCycle?: string | null;
  statusDescription?: string | null;
  statusKey?: string | null;
  isActive?: boolean | null;
  currentSemester?: number | null;
  email?: string | null;
  educationalProgramId?: number | null;
  generationId?: number | null;
  statusId?: number | null;
}

export interface StudentRecord {
  id: number;
  personId: number;
  educationalProgramId: number;
  generationId: number;
  statusId: number;
  codeNumber?: string | null;
  email?: string | null;
}
