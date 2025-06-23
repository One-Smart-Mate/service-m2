export const LANG_ES = 'ES';
export const LANG_EN = 'EN';

export enum ScheduleType {
  DAILY = 'dai',
  WEEKLY = 'wee',
  MONTHLY = 'mon',
  YEARLY = 'yea',
  MANUAL = 'man'
}

export const stringConstants = {
  primaryColor: '#FF5A5F',
  
  LANG_ES,
  LANG_EN,

  noFileUploaded: 'No file uploaded',
  invalidFileType: 'Invalid file type',
  duplicatedEmailAtRow: 'Duplicated email in excel row ',
  missingFieldsAtRow: 'Missing fields in excel row ',
  invalidRoleAtRow: 'Invalid role at row ',
  incorrectAuth: 'Incorrect e-mail or password.',
  duplicateRecord: 'This record already exists.',
  duplicateUser: 'This user already exists',
  duplicateUserAtRow: 'User already exists in excel row ',
  duplicateRole: 'This role already exists',
  duplicateCardUUID: 'The UUID already exists',
  existDefinitiveSolution: 'Already exists a definitive solution',
  existProvisionalSolution: 'Already exists a provisional solution',
  quantityOfUsersExceeded: 'Quantity of site users exceeded',
  codeExpired: 'The code has expired',
  wrongResetCode: 'Wrong reset code',
  emailIsMissing: 'The e-mail is missing',
  duplicateLevelMachineId: 'A record with that level machine id already exists',
  invalidHexFormat: 'Invalid hexadecimal format',
  resetPasswordEmailSubject: 'Reset Your Password - OSM',
  welcomeEmailSubject: 'Welcome to Our Platform!',
  characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  none: 'None',
  duplicatePriority: 'A priority with that code already exists',

  //Notifications for catalogs
  catalogsTitle: 'Cambio en estructura',
  catalogsDescription: 'Es necesario actualizar los catálogos',
  catalogsNotificationType: 'SYNC_REMOTE_CATALOGS',
  //Notifications for cards
  cardsTitle: 'Nueva tarjeta',
  cardAssignmentTitle: 'Asignación de tarjeta',
  cardsDescription: 'Se ha agregado una nueva tarjeta de tipo:',
  mechanicAssignmentMessage: 'te ha asignado la tarjeta:',
  cardsNotificationType: 'SYNC_REMOTE_CARDS',
  //Notifications for CILT
  ciltTitle: 'Notificación de Paro CILT',
  ciltNotificationType: 'CILT_STOPPAGE',
  updateAppNotificationType: 'UPDATE_APP',
  cardAssignedTitle: 'Card [card_id] has been assigned to you.',
  cardAssignedDescription: 'You have a new card assigned',
  emptyNotificationType: '',
  closeSessionTitle: 'Session Closed',
  closeSessionDescription: 'Your session has been closed.',
  closeSessionType: 'CLOSE_SESSION',
  cardTypeUpdate: 'Tipo de tarjeta actualizado con éxito.',
  //Types of evidences
  AUCR: 'AUCR',
  AUCL: 'AUCL',
  AUPS: 'AUPS',
  VICR: 'VICR',
  VICL: 'VICL',
  VIPS: 'VIPS',
  IMCR: 'IMCR',
  IMPS: 'IMPS',
  IMCL: 'IMCL',
  R: 'R',
  noteDefinitiveSoluition:
    'Auto: Definitive solution: Se agrego la solucion definitiva: userApp',
  noteProvisionalSolution:
    'Auto: Provisional solution: Se agrego la solucion provisional: userApp',
  aplico: 'Aplico:',
  cambioLaPrioridadDe: 'cambió la prioridad de:',
  a: 'a',
  cambio: 'Cambio:',
  cambioElMecanicoDe: 'cambió el responsable de:',
  noResponsible: 'No responsible',

  //methodology
  M: 'M',
  C: 'C',

  //card status
  A: 'A',
  P: 'P',
  V: 'V',
  mechanic: 'mechanic',

  //status
  activeStatus: 'A',
  inactiveStatus: 'I',

  //Harcoded
  tagVersion: '1.0.0',

  //not found errors
  companyNotFound: 'Company not found',
  priorityNotFound: 'Priority not found',
  userNotFound: 'User not found',
  cardTypesNotFound: 'Card types not fond',
  siteNotFound: 'Site not fond',
  preclsassifierNotFound: 'Preclassifier not found',
  levels: 'Levels not found',
  roles: 'Roles not found',
  cardNotFound: 'Card not found',
  positionNotFound: 'Position not found',
  ciltMstrNotFound: 'Cilt master not found',
  ciltSequencesEvidencesNotFound: 'Cilt sequences evidences not found',
  ciltSequencesExecutionsNotFound: 'Cilt sequences executions not found',
  ciltTypesNotFound: 'Cilt types not found',
  ciltSequencesNotFound: 'Cilt sequences not found',
  ciltSequencesFrequenciesNotFound: 'Cilt sequences frequencies not found',
  ciltFrequenciesNotFound: 'Cilt frequencies not found',
  oplMstrNotFound: 'OPL master not found',
  oplDetailsNotFound: 'OPL details not found',
  oplSopNotFound: 'OPL/SOP not found',
  repositoryNotFound: 'Repository not found',
  oplLevelsNotFound: 'OPL Levels not found',
  ciltSecuencesScheduleNotFound: 'CILT Secuences Schedule not found',
  ciltMstrPositionLevelsNotFound: 'CILT Master Position Levels not found',
  amDiscardReasonNotFound: 'AM Discard Reason not found',

  //sql errors
  INSERT_DATA_ERROR: 'INSERT_DATA_ERROR',
  TABLE_NOT_FOUND: 'TABLE_NOT_FOUND',
  UNHANDLED_SQL_ERROR: 'UNHANDLED_SQL_ERROR',

  SALT_ROUNDS: 10,

  customNotificationType: "CUSTOM_NOTIFICATION",
  notificationSentSuccessfully: "Notifications sent successfully.",
  noValidUsersForNotification: "No valid users found to send notifications.",
  sendingNotification: "Sending notification:",
  notificationBodyLog: "Body ->",
  errorSendingNotification: "Error sending notification:",
  noValidTokensFound: "No valid tokens found.",
  firebaseSendError: "Error sending notification to token:",
  errorSendingToToken: "Error sending notification to token",

  siteIdDescription: "ID of the site from which the notification will be sent",
  siteIdExample: 1,
  userIdsDescription: "List of IDs of the users selected to receive the notification",
  userIdsExample: [2,4],
  titleDescription: "Title of the notification",
  titleExample: "Custom Notification",
  descriptionDescription: "Description of the notification",
  descriptionExample: "This is a custom notification for specific users.",
  asignationCard: "You have been assigned the card",

  sendMailAssignamentSummary: "Send an email assignament ",
  sendMailAssignamentEmailSent: "Email Sent Successfully",
  sendMailAssignamentUserNotFound: "User not found",
  OS_ANDROID: 'ANDROID',
  OS_IOS: 'IOS',
  OS_WEB: 'WEB',

  successImport: 'Users imported successfully',
  allUsersAlreadyExist: 'All users already exist in the site',

  // Email templates
  emailTemplates: {
    [LANG_ES]: {
      resetPassword: {
        subject: 'Código de Restablecimiento de Contraseña',
        greeting: 'Hola',
        message: 'Has solicitado restablecer tu contraseña. Por favor, usa el siguiente código dentro de las próximas 24 horas para completar el proceso:',
        warning: 'Si no solicitaste este restablecimiento de contraseña, por favor ignora este correo.',
        help: '¿Necesitas ayuda? Contáctanos en cualquier momento, ¡estamos aquí para ti!',
        team: '– El Equipo OSM'
      },
      welcome: {
        subject: '¡Bienvenido al Equipo OSM! 🎉',
        greeting: 'Hola',
        message: '¡estamos muy emocionados de tenerte aquí! Prepárate para explorar increíbles funciones diseñadas especialmente para ti. Pero primero, aseguremos tu cuenta.',
        button: 'Restablecer tu Contraseña',
        footer: 'Una vez que hayas restablecido tu contraseña, comienza a explorar y aprovecha al máximo tu nueva cuenta.',
        help: '¿Necesitas ayuda? Contáctanos en cualquier momento, ¡estamos aquí para ti!',
        team: '– El Equipo OSM'
      },
      cardAssignment: {
        subject: 'Nueva Asignación de Tarjeta',
        greeting: 'Hola',
        message: 'Se te ha asignado la tarjeta',
        button: 'Ver Tarjeta',
        footer: 'Si tienes alguna pregunta, por favor contáctanos.',
        help: '¿Necesitas ayuda? Contáctanos en cualquier momento, ¡estamos aquí para ti!',
        team: '– El Equipo OSM'
      },
      ciltStoppage: {
        subject: 'Notificación de Paro CILT',
        greeting: 'Hola',
        message: 'Se ha reportado una condición de paro en la posición',
        warning: 'Por favor, revisa esta situación lo antes posible.',
        help: '¿Necesitas ayuda? Contáctanos en cualquier momento, ¡estamos aquí para ti!',
        team: '– El Equipo OSM'
      }
    },
    [LANG_EN]: {
      resetPassword: {
        subject: 'Password Reset Code',
        greeting: 'Hello',
        message: 'You requested to reset your password. Please use the following code within the next 24 hours to complete the process:',
        warning: 'If you did not request this password reset, please ignore this email.',
        help: 'Need help? Reach out to us anytime—we\'re here for you!',
        team: '– The OSM Team'
      },
      welcome: {
        subject: 'Welcome to OSM Team! 🎉',
        greeting: 'Hello',
        message: 'we\'re so excited to have you here! Get ready to explore amazing features designed just for you. But first, let\'s secure your account.',
        button: 'Reset Your Password',
        footer: 'Once you\'ve reset your password, dive in and make the most of your new account.',
        help: 'Need help? Reach out to us anytime—we\'re here for you!',
        team: '– The OSM Team'
      },
      cardAssignment: {
        subject: 'New Card Assignment',
        greeting: 'Hello',
        message: 'You have been assigned the card',
        button: 'View Card',
        footer: 'If you have any questions, please contact us.',
        help: 'Need help? Reach out to us anytime—we\'re here for you!',
        team: '– The OSM Team'
      },
      ciltStoppage: {
        subject: 'CILT Stoppage Notification',
        greeting: 'Hello',
        message: 'A stoppage condition has been reported in position',
        warning: 'Please review this situation as soon as possible.',
        help: 'Need help? Reach out to us anytime—we\'re here for you!',
        team: '– The OSM Team'
      }
    }
  },

  // Schedule validation messages
  invalidScheduleType: `Invalid schedule type. Must be one of: ${Object.values(ScheduleType).join(', ')}`,
  invalidDateProvided: 'Invalid date provided',
  invalidDayColumn: 'Invalid day column',

  oplSopReferenceNotFound: 'OPL/SOP reference not found',
  oplSopRemediationNotFound: 'OPL/SOP remediation not found',

  // CILT validation messages
  ciltSequenceAlreadyStarted: 'The CILT sequence has already been started',
  ciltSequenceNotActive: 'The CILT sequence is not active',
  ciltSequenceInvalidDate: 'Invalid date format for the CILT sequence',
  ciltSequenceAlreadyFinished: 'The CILT sequence has already been finished',
  ciltSequenceNotStarted: 'The CILT sequence has not been started',
};
