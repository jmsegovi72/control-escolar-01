import type { StudentSearchResult } from '~/types/student.types';
import {
  type ModuleWorkState,
  moduleWorkContext,
} from '~/utils/module-work-context';

export type StudentSearchFilters = {
  searchTerm: string;
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  curp: string;
  codeNumber: string;
  academicDiscipline: string;
  educationLevel: string;
  generation: string;
  semester: string;
  schoolYear: string;
  statusKey: string;
  stateName: string;
  municipalityName: string;
  isActive: string;
  limit: number;
  page: number;
};

export type StudentsWorkState = ModuleWorkState<StudentSearchResult> & {
  filters: StudentSearchFilters;
};

export const STUDENTS_MODULE = 'students';
export const STUDENTS_SEARCH_PATH = '/students/search';

export const studentsWorkflow = {
  clear(): void {
    moduleWorkContext.clear(STUDENTS_MODULE);
  },

  getState(): StudentsWorkState | null {
    return moduleWorkContext.get<StudentSearchResult>(
      STUDENTS_MODULE,
    ) as StudentsWorkState | null;
  },

  getReturnPath(): string {
    return this.getState()?.returnPath ?? STUDENTS_SEARCH_PATH;
  },

  getSelectedStudent(): StudentSearchResult | null {
    return this.getState()?.selectedItem ?? null;
  },

  save(
    filters: StudentSearchFilters,
    selectedItem?: StudentSearchResult,
  ): void {
    moduleWorkContext.save<StudentSearchResult>({
      filters,
      module: STUDENTS_MODULE,
      returnPath: STUDENTS_SEARCH_PATH,
      selectedItem,
    });
  },
};
