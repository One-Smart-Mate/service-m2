import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export const firebaseProvider = {
  provide: 'FIREBASE_APP',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const firebaseConfig = {
      type: 'service_account',
      project_id: 'osm-android-app',
      private_key_id: '2954ad10cf2d9a985fde909d2eb848e0f99e9f07',
      private_key:
        '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCsHP6sU0PwsMFv\nPsQdUy+XEtgaYOXTo9Gwa7kNGS2SO/J6KAlhgVYVYysckVl6buo/57KAwbIPyU0z\n0qPxk8jlYlqQ/lWevGz9XyWiQzlinFkhq9qa3hIt1G/BHLUREUeDjsQlyjrfuO7j\n2f3IhDpH1muX3ZXPB8KZRJo5ZLd7A8R/nD3PCnmoP4E1+Sj9OElMihmg1ws+/De1\nMf8ABkDzEqyIy7YrkVkhbnPUFRLLIUsIsk8ptM0FYOemP76p2JmlW3844GgIDBe9\n3uitQ8wKMkast36pbq6+RHL5Tkr6C5VK+T9/sETfggE5xGmOIOJuaotfWDXmZPJ0\nlPI4t9OVAgMBAAECggEACxeZ84HbmLvQ1kTln2eIuKQhQ0nyuzoNPeEjaExdcIA7\n4f2J5TvQUB6NB7v3rU6lUCsJiQdysgEXivsh+mQQ3XUCQI1I+ABNceLblQ00ueiO\nTKo7s3a+ay+2vWuxNla2aixy8xCJIiP+rraSMYW8D9HU1fu/jOaDdxyXEpMtdAMG\nFwwVddm3dC+UktWFtGBau7rcpk1DwExyxo2u5YedQoXCOkHdwrf4d2M2cT/hvbPR\npI9j3rYqvnBB9OJdNpXGfvoIxBokMHpXOw9dYkLN3EJ0VcbO3vKnv/1rBO6KCgPp\nuRLOX4W9GcX2UYv/P+eOqwzo/yVG9V8v4Ovw/9PHXQKBgQDUeFA0+BwwUXe4UPCe\nWwMoGcMNu3s4NN2BQNQZPjipi5LRD3jvqmV4uI5/qYx+djDePQXV4O5Kj8aweynw\nq7oLyHFW7XToK9yFyMjsKhHDA1jcGj1CqG4pGUMZf7DktZAaJbhXjKuKD0YnpTYV\n8kpDrGIY0EEcsHQZ2qIE+GN4ewKBgQDPYAp7wv/TMbRnYxkdwzJLZgnWOadC7vRH\n1vPsJhAYIijV1g1f+ed/ETC89kma9qzxtmCK76KFAj1bH0ROtoS4Cvy4TDamOsmU\nawn1YhIBU0fahs+yZEVal4obcu8ayymclVTR6E3EuPnCIioHKgsItZKd/ktmOltI\npN6q1fiPLwKBgEYllq12QLA/JVyH9HkDqU4i+z/cZvkOkxbqVVwkK8bmGsnE5vOR\neUDbBcjmLElQMiAdW4DaazHYuAtqDlW0DI95VNoTOaaxXHQa7yLxXL3arAq26wTH\n4N7WxU101+0aeIH5dBwLiFLjahEKvYmPXa9sCVMR5n1XUG18vkMP0p9jAoGABbIV\nl6Cbdil/Uved0Ptzfi6nRoL+3Q/DFdYJjQrelksZ5AWlCGXMveiy9f2tt9velCT2\nMdqzFAQju0T4k1DgBE4I8ubk+VvT/YeTFnJDHFY1OwNI4RVv8jUHTgmyF4JM+kf/\ntGQ0/po2Aeb+UIQPGYYjKMO7PmuL5krg8sA9u3ECgYEAm48LrAtHFUtoyJVtqz/V\nkCn6BXlPQg8SGN0VIn0e+qzG9PXPL8ULLgB4GBn8D6h2Vvm7HZGFFnLPw4ZihGgj\nSYcsDyD1s5b4VpgPU0lWHKQLZW4iDaWB3eCcVebNrcUSFrRuVt0ABvLIk1cwIa7r\nYzePhUARgnP6do6yfrjGnm0=\n-----END PRIVATE KEY-----\n',
      client_email:
        'firebase-adminsdk-xcv15@osm-android-app.iam.gserviceaccount.com',
      client_id: '102889421744026304690',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url:
        'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xcv15%40osm-android-app.iam.gserviceaccount.com',
      universe_domain: 'googleapis.com',
    } as admin.ServiceAccount;

    return admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
      storageBucket: `${firebaseConfig.projectId}.appspot.com`,
    });
  },
};
