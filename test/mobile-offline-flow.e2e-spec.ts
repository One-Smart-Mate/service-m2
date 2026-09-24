import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as request from 'supertest';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { HttpExceptionFilter } from 'src/common/exceptions/http.exception.filter';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
import { AuthController } from 'src/modules/auth/auth.controller';
import { AuthGuard } from 'src/modules/auth/guard/auth.guard';
import { AuthService } from 'src/modules/auth/auth.service';
import { CardController } from 'src/modules/card/card.controller';
import { CardService } from 'src/modules/card/card.service';
import { CatalogController } from 'src/modules/catalog/catalog.controller';
import { CatalogService } from 'src/modules/catalog/catalog.service';

const PRIMARY_USER_ID = 101;
const FAST_USER_ID = 202;
const SITE_ID = 7;
const PRIMARY_TOKEN = 'primary-mobile-token';
const FAST_TOKEN = 'fast-mobile-token';

type MobileIdentity = {
  id: number;
  jti: string;
  actorId?: number;
};

type StoredCard = {
  id: number;
  siteId: number;
  cardUUID: string;
  creatorId: number;
  comments?: string;
  status: string;
  changedAt: string;
  evidences: unknown[];
};

class MobileFlowAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, context.getHandler());
    if (isPublic === true) {
      return true;
    }

    const requestContext = context.switchToHttp().getRequest();
    const token = requestContext.headers.authorization?.replace('Bearer ', '');
    const identities: Record<string, MobileIdentity> = {
      [PRIMARY_TOKEN]: {
        id: PRIMARY_USER_ID,
        jti: 'primary-session',
      },
      [FAST_TOKEN]: {
        id: FAST_USER_ID,
        actorId: PRIMARY_USER_ID,
        jti: 'fast-session',
      },
    };
    const identity = identities[token];
    if (!identity) {
      throw new UnauthorizedException();
    }

    requestContext.user = identity;
    return true;
  }
}

class MobileFlowAuthService {
  login = jest.fn(async () => ({
    userId: PRIMARY_USER_ID,
    name: 'Primary User',
    email: 'primary@example.com',
    token: PRIMARY_TOKEN,
    roles: ['operator'],
    companyId: 3,
    companyName: 'OSM Test Company',
    sites: [{ id: SITE_ID, name: 'Test Site', logo: 'site.png' }],
  }));

  loginWithFastPassword = jest.fn(
    async (_data: unknown, actorId: number, parentSessionId: string) => {
      expect(actorId).toBe(PRIMARY_USER_ID);
      expect(parentSessionId).toBe('primary-session');
      return {
        userId: FAST_USER_ID,
        name: 'Fast User',
        email: 'fast@example.com',
        token: FAST_TOKEN,
        roles: ['mechanic'],
        companyId: 3,
        companyName: 'OSM Test Company',
        sites: [{ id: SITE_ID, name: 'Test Site', logo: 'site.png' }],
      };
    },
  );
}

class MobileFlowCatalogService {
  getOfflineSnapshot = jest.fn(async (siteId: number, userId: number) => {
    expect(siteId).toBe(SITE_ID);
    expect(userId).toBe(PRIMARY_USER_ID);
    return {
      schemaVersion: 1,
      siteId,
      generatedAt: '2026-09-24T12:00:00.000Z',
      revision: '2026-09-24T11:59:00.000Z',
      cardTypes: [{ id: 10, siteId, name: 'Safety' }],
      priorities: [{ id: 20, siteId, priorityCode: 'P1' }],
      preclassifiers: [{ id: 30, siteId, cardTypeId: 10 }],
      levels: [{ id: 40, siteId, name: 'Line 1' }],
    };
  });
}

class MobileFlowCardService {
  private sequence = 1;
  private readonly cards = new Map<string, StoredCard>();

  syncOfflineCards = jest.fn(async (items: any[], creatorId: number) => {
    const results = items.map((item) => {
      const existing = this.cards.get(item.cardUUID);
      if (existing) {
        return {
          cardUUID: item.cardUUID,
          success: true,
          outcome: 'existing',
          card: existing,
        };
      }

      const card: StoredCard = {
        id: this.sequence++,
        siteId: item.siteId,
        cardUUID: item.cardUUID,
        creatorId,
        comments: item.comments,
        status: 'A',
        changedAt: `2026-09-24T12:00:0${this.sequence}.000Z`,
        evidences: item.evidences,
      };
      this.cards.set(card.cardUUID, card);
      return {
        cardUUID: item.cardUUID,
        success: true,
        outcome: 'created',
        card,
      };
    });

    return {
      total: results.length,
      succeeded: results.length,
      failed: 0,
      results,
    };
  });

  syncCardChanges = jest.fn(
    async (siteId: number, _userId: number, cursor?: string) => {
      const cards = [...this.cards.values()].filter(
        (card) => card.siteId === siteId,
      );
      return {
        schemaVersion: 1,
        siteId,
        generatedAt: '2026-09-24T12:01:00.000Z',
        nextCursor: Buffer.from('2026-09-24T12:01:00.000Z:0').toString(
          'base64url',
        ),
        hasMore: false,
        changes: cursor
          ? []
          : cards.map((card) => ({
              type: 'upsert',
              changedAt: card.changedAt,
              card,
            })),
      };
    },
  );

  findSiteCardsPaginated = jest.fn(
    async (
      siteId: number,
      requesterId: number,
      page: number,
      limit: number,
      filters: { myCards?: boolean },
    ) => {
      const cards = [...this.cards.values()].filter(
        (card) =>
          card.siteId === siteId &&
          (!filters.myCards || card.creatorId === requesterId),
      );
      return {
        cards,
        total: cards.length,
        page,
        limit,
        totalPages: cards.length === 0 ? 0 : 1,
        hasMore: false,
      };
    },
  );
}

describe('Mobile offline flow contract (e2e)', () => {
  let app: INestApplication;
  let cardService: MobileFlowCardService;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [AuthController, CatalogController, CardController],
      providers: [
        {
          provide: AuthService,
          useClass: MobileFlowAuthService,
        },
        {
          provide: CatalogService,
          useClass: MobileFlowCatalogService,
        },
        {
          provide: CardService,
          useClass: MobileFlowCardService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(new MobileFlowAuthGuard())
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true });
    const moduleRef = await moduleBuilder.compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
    cardService = moduleRef.get(CardService);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('covers login, catalogs, idempotent offline upload, delta and list while preserving Fast Password identity', async () => {
    const invalidLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'invalid-email', password: 'Password1!', platform: 'A' })
      .expect(400);
    expect(invalidLogin.body.message).toBe('email must be an email');

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'primary@example.com',
        password: 'Password1!',
        platform: 'ANDROID',
        timezone: 'America/Mexico_City',
      })
      .expect(201);
    expect(login.body.data.token).toBe(PRIMARY_TOKEN);
    expect(login.body.data.sites).toEqual([
      { id: SITE_ID, name: 'Test Site', logo: 'site.png' },
    ]);

    const snapshot = await request(app.getHttpServer())
      .get(`/catalog/${SITE_ID}/snapshot`)
      .set('Authorization', `Bearer ${PRIMARY_TOKEN}`)
      .expect(200);
    expect(snapshot.body.data).toMatchObject({
      schemaVersion: 1,
      siteId: SITE_ID,
      cardTypes: [{ id: 10 }],
      priorities: [{ id: 20 }],
      preclassifiers: [{ id: 30 }],
      levels: [{ id: 40 }],
    });

    const offlineCard = {
      siteId: SITE_ID,
      cardUUID: 'mobile-offline-0001',
      cardCreationDate: '2026-09-24T12:00:00.000Z',
      nodeId: 40,
      priorityId: 20,
      cardTypeValue: 'unsafe',
      cardTypeId: 10,
      preclassifierId: 30,
      creatorId: 9999,
      comments: 'Created without connectivity',
      evidences: [],
      appSo: 'android',
      appVersion: '1.0.0',
      notifyResponsible: false,
    };

    const firstUpload = await request(app.getHttpServer())
      .post('/card/sync')
      .set('Authorization', `Bearer ${PRIMARY_TOKEN}`)
      .send({ cards: [offlineCard] })
      .expect(201);
    expect(firstUpload.body.data).toMatchObject({
      total: 1,
      succeeded: 1,
      failed: 0,
      results: [
        {
          cardUUID: offlineCard.cardUUID,
          success: true,
          outcome: 'created',
          card: { creatorId: PRIMARY_USER_ID },
        },
      ],
    });

    const retryUpload = await request(app.getHttpServer())
      .post('/card/sync')
      .set('Authorization', `Bearer ${PRIMARY_TOKEN}`)
      .send({ cards: [offlineCard] })
      .expect(201);
    expect(retryUpload.body.data.results[0]).toMatchObject({
      success: true,
      outcome: 'existing',
      card: { creatorId: PRIMARY_USER_ID },
    });

    const delta = await request(app.getHttpServer())
      .get(`/card/sync/${SITE_ID}?limit=200`)
      .set('Authorization', `Bearer ${PRIMARY_TOKEN}`)
      .expect(200);
    expect(delta.body.data).toMatchObject({
      schemaVersion: 1,
      siteId: SITE_ID,
      hasMore: false,
      changes: [
        {
          type: 'upsert',
          card: {
            cardUUID: offlineCard.cardUUID,
            creatorId: PRIMARY_USER_ID,
          },
        },
      ],
    });
    expect(typeof delta.body.data.nextCursor).toBe('string');

    const primaryList = await request(app.getHttpServer())
      .get(`/card/all/${SITE_ID}/paginated?page=1&limit=20&myCards=true`)
      .set('Authorization', `Bearer ${PRIMARY_TOKEN}`)
      .expect(200);
    expect(primaryList.body.data).toMatchObject({
      total: 1,
      page: 1,
      limit: 20,
      hasMore: false,
      cards: [
        {
          cardUUID: offlineCard.cardUUID,
          creatorId: PRIMARY_USER_ID,
        },
      ],
    });

    const fastLogin = await request(app.getHttpServer())
      .post('/auth/login-fast')
      .set('Authorization', `Bearer ${PRIMARY_TOKEN}`)
      .send({
        fastPassword: 'A1b2',
        platform: 'ANDROID',
        timezone: 'America/Mexico_City',
      })
      .expect(201);
    expect(fastLogin.body.data.token).toBe(FAST_TOKEN);

    const fastCard = {
      ...offlineCard,
      cardUUID: 'mobile-offline-fast-0001',
      creatorId: PRIMARY_USER_ID,
      comments: 'Created during a Fast Password session',
    };
    const fastUpload = await request(app.getHttpServer())
      .post('/card/sync')
      .set('Authorization', `Bearer ${FAST_TOKEN}`)
      .send({ cards: [fastCard] })
      .expect(201);
    expect(fastUpload.body.data.results[0].card.creatorId).toBe(FAST_USER_ID);

    const fastList = await request(app.getHttpServer())
      .get(`/card/all/${SITE_ID}/paginated?page=1&limit=20&myCards=true`)
      .set('Authorization', `Bearer ${FAST_TOKEN}`)
      .expect(200);
    expect(fastList.body.data.cards).toHaveLength(1);
    expect(fastList.body.data.cards[0]).toMatchObject({
      cardUUID: fastCard.cardUUID,
      creatorId: FAST_USER_ID,
    });
    expect(cardService.syncOfflineCards).toHaveBeenCalledWith(
      expect.any(Array),
      FAST_USER_ID,
    );
  });
});
