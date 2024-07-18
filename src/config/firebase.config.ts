import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export const firebaseProvider = {
  provide: 'FIREBASE_APP',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const firebaseConfig = {
      type: 'service_account',
      project_id: 'android-m2-app',
      private_key_id: 'ea8a821779186f24afbec3270b71a6da730f8a4f',
      private_key:
        '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDM44lmOJzdJNWO\nonME///tODNfTyZ+coidGrAOisVW2fSUA/gNIfWqvqPLnsmphxisoisvsHDRZMNb\nyms0tjuWFP4yvqhhDEesnvAWij8u9m1lQU5ciXHAkPWtNGtBy4AMMutR0G9dLg88\nTQ6fyAUKtuvbeB8elFuKTBRu43GKxuupue3g6jlUJ6G1vtjhY1i8WYPyOj6k9Vsf\nIzBonnMIhPyxYZnvpK/JdT3/EVVhuAVcp1zjp44FyQ8xYz59hHPA9frWp0dR3S5r\nzs6ONp7ULQmV/ihD7FithWEVw758wc/7Gx6ZH9uSneYqWVMKeZYPfzfoj3zrH/LX\nKiZpXq8hAgMBAAECggEALEMjla+5Q5UHha7Whkf/s/GmN3rT6BE6LiZrzlhwVVj0\nm11YIw4pEl/o5r5A9py22eSWy9CkLrhD8/qAunx71upmF/RUT9LlUQds+pGXIMAf\n1fYLxbXzmxQ13tsqKKab3QbLC3up80lWBULoW+BMJopp3ZnPrz2BoRjaeTItfzsi\n8sn3oBkOaEZGFFV+z26w5SifbL/pD5e/K47IMJ16dLDg1uR8gZsg57livUcyJVfJ\nGfwrnGLvvIAfnF9nzZKxkRhPXdBgcmWMdtld+4kaqAQQfycWyq3Tmj4KBuxHAwH0\n5poEW+4p7dOiFFCX6JRWwtH6NHOJ2sszNxOD5zLQGQKBgQDv5TaXbv3CS4Jhsv6d\nVnA47faAqc7q26FIQY7JHvqex7I6Zfb7fKvhuDwfy17UGje2qqsUzLvPtNwXGaN8\niXzVf/QoqaLWjjLuka6PIpgAS5D57oBQChoAPj4bcy6pD5kEccbnvnLOrskGb70n\n4/IYtVJFC66wrme6d46P6MxsIwKBgQDapLV9GjciD+bqi77D7xhLUDjDd0yFA4Ak\nmR+ZvxF09blhfVWCrIzrq2sNFa7TpklUxlvL0oazcO7Gd76GX+VZ1jgYAUOvdR5R\na5PrScmKqOPxzCstJDiS8hZpGAkGQDDcc2W8cUAhCHkOmPdLyOXjRo/M9LbhBmtf\nf0YLQrgZ6wKBgQDVv6wmvhSIvHMNzkkjs9MGRrFu7t6ZUNyh3xf0iA/Szig19Ihe\niDU2R8v6oGB8KGgf8G3DeLCXX5UDWCrdWjvKl9nbKVsYRVeITnH0w2QgTzR8HVBj\nAL0uHkeEedrHdEhpN199OapeEkq323P1SRt7fIQzVTdv4dY2xTRXcZxDdQKBgD3t\n92YW/dTNEkgPCxquZ4A1mc5rxSXL5wj2wkenIgex7i9Z89WOkF/Ubv8GzD0w1YaI\npMmnuPWsoEVg93tSQEFg9wR9nzFciBjh0sULYmW/DsmXXgdsQgYFQinEYBIALpbS\nrNdicJqqrrdexnUV01+7xdF04zP7wIANKcbYwBK/AoGBALWklaAnPwPLD0x9q6Cv\nD0zl8fHRSfGoEMa4q5aDfu9vHDnrVwL/CuHGMM/+Fx5pf3MiA9M5GxV53t81axyz\nUdyYufzvylg6NyajPS+4kE4JE6sKdEI1A/1uq9ZLiTGHCR+bMpy65SRqPtOUrtty\noK0ebPRmAf7sSE71GccLieME\n-----END PRIVATE KEY-----\n',
      client_email:
        'firebase-adminsdk-hh3ok@android-m2-app.iam.gserviceaccount.com',
      client_id: '105991354377365784805',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url:
        'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-hh3ok%40android-m2-app.iam.gserviceaccount.com',
      universe_domain: 'googleapis.com',
    } as admin.ServiceAccount;

    return admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
      storageBucket: `${firebaseConfig.projectId}.appspot.com`,
    });
  },
};
