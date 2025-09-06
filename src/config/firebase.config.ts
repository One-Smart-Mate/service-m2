import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export const firebaseProvider = {
  provide: 'FIREBASE_APP',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const firebaseConfig = {
      type: 'service_account',
      project_id: "osm-dev-c2f20",
      private_key_id: "49be6a47aadebb17e925a88966a965fd146ed0c1",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDyjdszhm1eGaAJ\njSKJFBopCBrev8GlXivzfXJ99Rtq27iVg7O3YKh2Smr1oiInzBuK1svx2Yt8qyo7\nZVyUaxWNBX2r5idH0ihhJkqq7y4MXrJ3qI5eMrirBgbITkftZ91j6Z0Gh6+XSfZj\nCO4Kisv0/iRU45/pXHnLVJuDG48Q+32Vvv+r2dqsVXOIt9lzr67gQ4cAAuqgv2hK\n1+T11H5gIGgNZUDvZE7HdONPBgecS6f/8R9/2SuSruGag1E/DqsLhOeDxwTjvle2\nnx5z7DB1jQXdvsJlXaCpl9h9f7+5pyl8t/X9JxJMxcIhodwdZ5zAap06Sjz0NpHz\n0tDhHu/HAgMBAAECggEAAiMAcgJr0Y8QOy/5xJNfbPUb/NJboQVPWyRubxr1qYn9\n+kiKu2wn5Rg1Zlc4oyPH1P/yE/4CneU0HgnVOEl+ixt9Rpe5yNwvwYtWJQ4DrdWN\nD5jLMvE8xzo/smFeKNfoD1/uI4dBI2gMukVIiOHoIg8LFY8GcvEpnCzxTG+1tu87\n1pgDm4yod+YXX7tuJK26vnP4XgHE+JTNNQnbwth6YVQ8+UmToW1VxYSJIRS2aprw\npwlqgjHDAuPBjCvKnb+c96K0ez+WFmIOQ+TFQOu0LZznHmcf3VbBtAjNkU0835Oi\ny1Y/9E98UCAE+RJZnLcpGV6ZOxbD3zKv7+/+2tw5IQKBgQD87dRYG74jGNdFn8Vr\nyJku6fM+Egaq1N1mnZeF6X9doGLWZoZp4BIaV5eWcv4ZEdLZDzjuw0RyOuAvpaYi\nrMnO8IpWCNqpuFYbacHXeq3dLUBbNg304nkY3AjUftzg6GFLcdkGzfwFVM532285\nMuxh6wkNY8RAO01jiGqNnHNerQKBgQD1f8djLKoxtmwsgpqv1k29XlkVzIVGcKO5\n6fh6hgTE5jEE2vMgON6uJYeU3Pzr4yUvBkTOxCWhZ7nO9XPj/ErAD0yyUFM6Xse5\n9TMWVaQeq7ysvJI8dLk0Yp5Er/EhQ76bsIq0G+f3RBYjXF+P0eYHKXgOy0q7/+fK\nhXNwtWlawwKBgQDXmgAtTxDIKC+xCN2n4Co75G9VlNYcHzHPfDyiiQTqEYLPEjw3\n2ip0TABK3iEdy6S5JJG6bbdVzDw4QXMaEcJBZaf2aLvEev7jhUYYYVn9tMosNiq1\neawSddYNFUtBaLUvM4/1jfbrsHwDjYkE8BSx70EbKdUrj6GLW8jAiAGMTQKBgD2P\npz4VSzBgIEwhDA0f3iqoaApxWNJLGKNcKnT++l8togknpmPkHuLoglEwATRdp0td\ndQ+sXAtXaV6eaks3Tr9Oltr4DYbLkaXt+LuXCiquwgdG2hzS4EZknG949yxyQm/k\nG0QC42474plHZqc36UjOe06qZ7kw+LzuLf6LXznlAoGAR7qXw0LlsUyrezovTmci\nhHKtnKsLeYz6oLMiI8nZYcLVdDy1CUec5ZnSqjCJggnLyzyvjGV2PZDPKvYcIzCz\nS0kN2088ZKyeLb3VlRjkqjyriQ8bLE35jDAnTAqYRx0ENVQwcrqYvcyzLeTRhgWj\ncTd9xqZ0c48UFdOK9quO+y0=\n-----END PRIVATE KEY-----\n", // Corrige saltos de línea en la clave privada
      client_email: "firebase-adminsdk-4p7st@osm-dev-c2f20.iam.gserviceaccount.com",
      client_id: "108755297393958650119",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-4p7st%40osm-dev-c2f20.iam.gserviceaccount.com",
      universe_domain: "googleapis.com",
    } as admin.ServiceAccount;

    return admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      databaseURL: `https://${"osm-dev-c2f20"}.firebaseio.com`, // Corrige https con comillas y uso correcto de project_id
      storageBucket: `${"osm-dev-c2f20"}.appspot.com`,
    });
  },
};
