export const messages = {
  app: {
    name: 'SICES V1',
    description: 'Sistema de Control Escolar',
    initials: 'SI',
  },

  auth: {
    login: {
      title: 'Iniciar sesión',
      welcome: 'Bienvenido a {name}',
      copy: 'Gestión escolar con acceso seguro para el trabajo administrativo.',
      formTitle: 'Iniciar sesión',
      formCopy: 'Usa tus credenciales para entrar al sistema.',
      usernameLabel: 'Usuario o correo',
      usernamePlaceholder: 'usuario o correo',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Ingresa tu contraseña',
      showPassword: 'Mostrar contraseña',
      hidePassword: 'Ocultar contraseña',
      rememberDevice: 'Recordar este equipo',
      recoverPassword: 'Recuperar contraseña',
      helpText:
        'Contacta al administrador para generar una contraseña temporal y activar el cambio obligatorio.',
      submitLabel: 'Entrar al sistema',
      loadingLabel: 'Validando acceso',
      validationError: 'Ingresa tu correo y contraseña.',
      connectionError: 'No se pudo conectar con el servidor. {message}',
      sessionExpiredMessage:
        'Tu sesión o acceso temporal expiró. Inicia sesión nuevamente o contacta al administrador.',
      lockoutNote:
        'Si necesitas acceso antes, preséntate con el administrador.',
      healthApi: 'API',
      healthApiPending: 'Pendiente de conectar',
      healthDatabase: 'Base de datos',
      healthDatabasePending: 'Sin verificar',
      healthSession: 'Sesión',
      healthSessionPending: 'No iniciada',
      dialogs: {
        lockout: {
          title: 'Cuenta bloqueada temporalmente',
          closeLabel: 'Entendido',
          description:
            'Si necesitas acceso antes, preséntate con el administrador.',
        },
        expired: {
          sessionTitle: 'Sesión expirada',
          temporaryTitle: 'Acceso temporal expirado',
          sessionDescription: 'Tu sesión expiró.',
          temporaryDescription: 'El tiempo para cambiar tu contraseña terminó.',
          sessionAction: 'Inicia sesión nuevamente para continuar trabajando.',
          temporaryAction:
            'Inicia sesión nuevamente con la contraseña temporal proporcionada por el administrador o solicita una nueva.',
          closeLabel: 'Volver al login',
        },
        disabledAccount: {
          title: 'Cuenta desactivada',
          description:
            'Contacta al administrador para revisar el acceso de esta cuenta.',
          closeLabel: 'Entendido',
        },
      },
    },

    changePassword: {
      title: 'Cambiar contraseña',
      copy: 'Por seguridad debes crear una nueva contraseña antes de continuar.',
      alert:
        'Tu contraseña temporal ya expiró o debes cambiarla por seguridad.',
      currentPasswordLabel: 'Contraseña temporal',
      currentPasswordPlaceholder: 'Ingresa tu contraseña temporal',
      newPasswordLabel: 'Nueva contraseña',
      newPasswordPlaceholder: 'Ingresa tu nueva contraseña',
      confirmPasswordLabel: 'Confirmar contraseña',
      confirmPasswordPlaceholder: 'Repite la nueva contraseña',
      showPasswords: 'Ver',
      hidePasswords: 'Ocultar',
      submitLabel: 'Cambiar contraseña',
      loadingLabel: 'Actualizando contraseña',
      errors: {
        missingCurrent: 'Ingresa tu contraseña temporal.',
        invalidNew: 'La nueva contraseña no cumple los requisitos.',
        mismatch: 'Las contraseñas no coinciden.',
        sameAsCurrent: 'La nueva contraseña debe ser diferente a la temporal.',
        fieldError: 'Revisa este campo.',
        generic: 'Error al cambiar la contraseña.',
      },
      visibilityLabel: 'Campos de contraseña',
      rulesLabel: 'Reglas de contraseña',
      rules: {
        upperCase: 'Una mayúscula',
        lowerCase: 'Una minúscula',
        number: 'Un número',
        specialChar: 'Un especial permitido: {chars}',
        onlyAllowed: 'Sin caracteres fuera de la lista',
        validLength: 'Entre 8 y 12 caracteres',
      },
    },
  },

  dashboard: {
    eyebrow: '{name}',
    title: 'Dashboard',
    description:
      'Entrada principal del sistema. Desde aquí iremos montando los módulos reales.',
    meta: 'Vista inicial',
    statSession: 'Sesión',
    statSessionValue: 'Activa',
    statBackend: 'Backend',
    statBackendValue: 'Por validar',
    statNextModule: 'Módulo siguiente',
    statNextModuleValue: 'Usuarios',
    panelTitle: 'Estructura autenticada',
    panelDescription:
      'El dashboard ya usa el AppShell y Sidebar del almacén UI.',
    panelContent:
      'Esta pantalla ya vive dentro del esqueleto real de la aplicación. El siguiente paso natural es construir el módulo de usuarios dentro de esta misma estructura.',
  },

  layout: {
    shell: {
      title: 'Dashboard',
      accessDeniedTitle: 'Acceso restringido',
      accessDeniedDescription:
        'Tu usuario no tiene permisos para entrar a este módulo.',
      logoutLabel: 'Cerrar sesión',
      sidebarSettings: 'Configuración',
      sidebarFixed: 'Usar sidebar fijo',
      sidebarHover: 'Auto colapso',
      returnToDashboard: 'Volver al dashboard',
      clockLabel: 'Hora actual',
      backend: 'Backend',
      database: 'Base de datos',
      sessionLabel: 'Sesión',
      userMenuSession: 'Sesión: {remaining}',
      userActiveStatus: 'Sesión activa',
      userInactiveStatus: 'Usuario inactivo',
      noSession: 'Sin sesión',
      tokenUnavailable: 'No disponible',
      menuMain: 'Menú principal',
      menuAdmin: 'Administración',
      nav: {
        dashboard: 'Dashboard',
        persons: 'Personas',
        personsManagement: 'Gestión',
        personsAddresses: 'Dirección',
        personsDemographics: 'Demografía',
        personsEmergency: 'Contactos emergencia',
        students: 'Estudiantes',
        studentsAdmission: 'Admisión',
        studentsEnrollment: 'Matrícula',
        studentsGrades: 'Calificaciones',
        teachers: 'Docentes',
        staff: 'Personal',
        catalogs: 'Catálogos',
        catalogsZipCodes: 'Códigos postales',
        catalogsClasses: 'Clases',
        users: 'Usuarios',
      },
      userActions: {
        settings: 'Configuración',
        logout: 'Cerrar sesión',
      },
    },
  },

  users: {
    hub: {
      eyebrow: 'Administración',
      title: 'Usuarios',
      description:
        'Gestión de cuentas, acceso inicial, bloqueo y restablecimiento administrado.',
      meta: 'Módulo SUPER',
      accessDenied: 'El módulo de usuarios está reservado para cuentas SUPER.',
      toolbarCenter: 'Consulta, alta y administración de accesos del sistema.',
      toolbarLeading: 'Hub de acciones',
      newUser: 'Nuevo usuario',
      heroKicker: 'Centro de administración',
      heroTitle: 'Gestiona accesos sin perder el contexto',
      heroDescription:
        'Administra cuentas, permisos, bloqueos y primer acceso desde un solo módulo.',
      summaryActions: 'acciones',
      summaryAccess: 'acceso',
      panelTitle: 'Acciones operativas',
      panelDescription:
        'Flujos administrativos para consulta, mantenimiento y soporte de cuentas.',
      openButton: 'Abrir',
      goButton: 'Ir',
      primaryActions: {
        search: {
          title: 'Búsqueda avanzada',
          description:
            'Consulta usuarios con filtros, estados y acciones por fila.',
          badge: 'Principal',
        },
        create: {
          title: 'Crear usuario',
          description: 'Registra acceso inicial y prepara contraseña temporal.',
          badge: 'Alta',
        },
      },
      operationalActions: {
        detail: {
          title: 'Ver usuario',
          description: 'Consulta datos, rol, tipo y estado de acceso.',
          badge: 'Selección',
        },
        edit: {
          title: 'Editar usuario',
          description: 'Modifica datos de acceso y permisos administrativos.',
          badge: 'Selección',
        },
        toggle: {
          title: 'Activar / Desactivar',
          description: 'Cambia el acceso al sistema sin eliminar la cuenta.',
          badge: 'Control',
        },
        unlock: {
          title: 'Desbloquear usuario',
          description: 'Libera cuentas bloqueadas por intentos fallidos.',
          badge: 'Soporte',
        },
        resetLogin: {
          title: 'Resetear primer login',
          description: 'Genera flujo obligatorio de cambio de contraseña.',
          badge: 'Admin',
        },
      },
    },

    search: {
      eyebrow: 'Administración',
      title: 'Búsqueda avanzada',
      description:
        'Consulta usuarios por filtros y ejecuta acciones administrativas.',
      meta: 'Usuarios',
      accessDenied:
        'La búsqueda de usuarios está reservada para cuentas SUPER.',
      toolbarBack: 'Regresar',
      toolbarCenter:
        'Desde aquí puedes filtrar usuarios y volver al flujo anterior.',
      newUser: 'Nuevo usuario',
      pageReturnEyebrow: 'Módulo de usuarios',
      pageReturnLabel: 'Regresar',
      filterPanelTitle: 'Filtros',
      filterPanelDescription:
        'Combina criterios para localizar cuentas del sistema.',
      filterGlobalLabel: 'Búsqueda global',
      filterGlobalPlaceholder: 'Nombre o usuario',
      filterNameLabel: 'Nombre completo',
      filterNamePlaceholder: 'Ej. Segovia Chan',
      filterRoleLabel: 'Rol',
      filterRolePlaceholder: 'Todos',
      filterTypeLabel: 'Tipo',
      filterTypePlaceholder: 'Todos',
      filterStatusLabel: 'Estado',
      filterStatusPlaceholder: 'Todos',
      filterFirstLoginLabel: 'Primer login',
      filterFirstLoginPlaceholder: 'Todos',
      clearButton: 'Limpiar',
      searchButton: 'Buscar',
      statusActive: 'Activo',
      statusInactive: 'Inactivo',
      firstLoginPending: 'Pendiente',
      firstLoginCompleted: 'Completado',
      tableEmptyTitle: 'Sin usuarios',
      tableEmptyDescription:
        'No se encontraron usuarios con los criterios seleccionados.',
      columns: {
        fullName: 'Nombre completo',
        fullNamePlaceholder: 'Nombre',
        username: 'Usuario',
        usernamePlaceholder: 'Usuario',
        role: 'Rol',
        type: 'Tipo',
        status: 'Estado',
        firstLogin: 'Primer login',
      },
      actions: {
        viewDetail: 'Ver detalle',
        edit: 'Editar',
        toggle: 'Activar / Desactivar',
        unlock: 'Desbloquear',
        resetLogin: 'Resetear login',
      },
      errorPanelTitle: 'No se pudo buscar',
    },
  },

  errors: {
    loginFailed: 'Error al iniciar sesión.',
    searchFailed: 'No se pudo realizar la búsqueda.',
    changePasswordFailed: 'Error al cambiar la contraseña.',
    loadCatalogsFailed: 'No se pudieron cargar catálogos.',
    loadUserDetailFailed: 'No se pudo cargar el detalle del usuario.',
  },
} as const;
