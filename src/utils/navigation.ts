import { messages } from '~/config/messages';
import { ROUTES } from '~/config/routes';
import type { User } from '~/types/auth.types';
import type { SidebarSection } from '~/ui/patterns/Sidebar/sidebar.types';

const normalizeAccessValue = (value?: string) =>
  value?.trim().toUpperCase() ?? '';

export const canAccessRoute = (
  user: User | null,
  allowedUserTypes?: string[],
  allowedRoles?: string[],
) => {
  if (!allowedUserTypes?.length && !allowedRoles?.length) {
    return true;
  }

  if (!user) {
    return false;
  }

  const normalizedUserType = normalizeAccessValue(user.userTypeCode);
  const normalizedRole = normalizeAccessValue(user.roleName);
  const userTypeAllowed = allowedUserTypes?.some(
    (type) => normalizeAccessValue(type) === normalizedUserType,
  );
  const roleAllowed = allowedRoles?.some(
    (role) => normalizeAccessValue(role) === normalizedRole,
  );

  return Boolean(userTypeAllowed || roleAllowed);
};

export const createNavigation = (
  isSuper: boolean,
  hasControlAccess: boolean,
): SidebarSection[] => {
  const sections: SidebarSection[] = [
    {
      id: 'main',
      label: messages.layout.shell.menuMain,
      items: [
        {
          id: 'dashboard',
          label: messages.layout.shell.nav.dashboard,
          icon: 'dashboard',
          href: ROUTES.DASHBOARD,
          disabled: !hasControlAccess,
        },
        {
          id: 'persons',
          label: messages.layout.shell.nav.persons,
          icon: 'person',
          disabled: !hasControlAccess,
          children: [
            {
              id: 'persons-management',
              label: messages.layout.shell.nav.personsManagement,
              icon: 'person',
              href: ROUTES.PERSONS,
              disabled: true,
            },
            {
              id: 'persons-addresses',
              label: messages.layout.shell.nav.personsAddresses,
              icon: 'school',
              href: ROUTES.PERSONS_ADDRESSES,
              disabled: true,
            },
            {
              id: 'persons-demographics',
              label: messages.layout.shell.nav.personsDemographics,
              icon: 'dashboard',
              href: ROUTES.PERSONS_DEMOGRAPHICS,
              disabled: true,
            },
            {
              id: 'persons-emergency',
              label: messages.layout.shell.nav.personsEmergency,
              icon: 'phone',
              href: ROUTES.PERSONS_EMERGENCY,
              disabled: true,
            },
          ],
        },
        {
          id: 'students',
          label: messages.layout.shell.nav.students,
          icon: 'student',
          disabled: !hasControlAccess,
          children: [
            {
              id: 'students-admission',
              label: messages.layout.shell.nav.studentsAdmission,
              icon: 'add',
              href: ROUTES.STUDENTS_ADMISSION,
              disabled: true,
            },
            {
              id: 'students-enrollment',
              label: messages.layout.shell.nav.studentsEnrollment,
              icon: 'save',
              href: ROUTES.STUDENTS_ENROLLMENT,
              disabled: true,
            },
            {
              id: 'students-grades',
              label: messages.layout.shell.nav.studentsGrades,
              icon: 'check',
              href: ROUTES.STUDENTS_GRADES,
              disabled: true,
            },
          ],
        },
        {
          id: 'teachers',
          label: messages.layout.shell.nav.teachers,
          icon: 'teacher',
          disabled: true,
        },
        {
          id: 'staff',
          label: messages.layout.shell.nav.staff,
          icon: 'staff',
          disabled: true,
        },
        {
          id: 'catalogs',
          label: messages.layout.shell.nav.catalogs,
          icon: 'settings',
          disabled: !hasControlAccess,
          children: [
            {
              id: 'catalogs-zip-codes',
              label: messages.layout.shell.nav.catalogsZipCodes,
              icon: 'school',
              href: ROUTES.CATALOGS_ZIP_CODES,
              disabled: true,
            },
            {
              id: 'catalogs-classes',
              label: messages.layout.shell.nav.catalogsClasses,
              icon: 'class',
              href: ROUTES.CATALOGS_CLASSES,
              disabled: true,
            },
          ],
        },
      ],
    },
  ];

  if (isSuper) {
    sections.push({
      id: 'admin',
      label: messages.layout.shell.menuAdmin,
      items: [
        {
          id: 'users',
          label: messages.layout.shell.nav.users,
          icon: 'user-settings',
          href: ROUTES.USERS,
        },
      ],
    });
  }

  return sections;
};
