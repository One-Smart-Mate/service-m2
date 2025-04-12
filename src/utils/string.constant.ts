export const stringConstants = {
  primaryColor: '#FF5A5F',
  
  LANG_ES: 'ES',
  LANG_EN: 'EN',

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
  resetPasswordEmailSubject: 'Reset Your Password - OSM',
  welcomeEmailSubject: 'Welcome to Our Platform!',
  characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  none: 'None',

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
  ciltNotFound: 'Cilt not found',


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
};
