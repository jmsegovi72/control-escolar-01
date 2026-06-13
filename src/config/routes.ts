export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CHANGE_PASSWORD: '/change-password',

  USERS: '/users',
  USERS_CREATE: '/users/create',
  USERS_SEARCH: '/users/search',
  USERS_DETAIL: '/users/detail',
  USERS_EDIT: '/users/edit',
  USERS_TOGGLE: '/users/toggle',
  USERS_UNLOCK: '/users/unlock',
  USERS_RESET_LOGIN: '/users/reset-login',

  PERSONS: '/persons',
  PERSONS_SEARCH: '/persons/search',
  PERSONS_CREATE: '/persons/create',
  PERSONS_DETAIL: '/persons/detail',
  PERSONS_EDIT: '/persons/edit',
  PERSONS_ADDRESSES: '/persons/addresses',
  PERSONS_DEMOGRAPHICS: '/persons/demographics',
  PERSONS_EMERGENCY: '/persons/emergency-contacts',
  PERSONS_BULK_LOAD: '/persons/bulk-load',

  STUDENTS_ADMISSION: '/students/admission',
  STUDENTS_ENROLLMENT: '/students/enrollment',
  STUDENTS_GRADES: '/students/grades',

  CATALOGS_ZIP_CODES: '/zip-codes',
  CATALOGS_CLASSES: '/classes',
} as const;
