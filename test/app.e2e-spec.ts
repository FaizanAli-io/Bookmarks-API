import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';

describe('App (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = app.get(PrismaService);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    await app.listen(3333);

    await prisma.cleanDb();

    pactum.request.setBaseUrl('http://localhost:3333/');
  });

  afterAll(async () => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'testuser@example.com',
      password: 'testpassword',
    };

    describe('Signup', () => {
      const url: string = 'auth/signup';

      it('should throw if no body', () => {
        return pactum.spec().post(url).expectStatus(400);
      });

      it('should throw if no email', () => {
        return pactum
          .spec()
          .post(url)
          .withBody({ password: dto.password })
          .expectStatus(400);
      });

      it('should throw if no password', () => {
        return pactum
          .spec()
          .post(url)
          .withBody({ email: dto.email })
          .expectStatus(400);
      });

      it('should throw if bad email', () => {
        return pactum
          .spec()
          .post(url)
          .withBody({ email: 'notanemail' })
          .expectStatus(400);
      });

      it('should signup', () => {
        return pactum.spec().post(url).withBody(dto).expectStatus(201);
      });
    });

    describe('Signin', () => {
      const url: string = 'auth/signin';

      it('should throw if no body', () => {
        return pactum.spec().post(url).expectStatus(400);
      });

      it('should throw if no email', () => {
        return pactum
          .spec()
          .post(url)
          .withBody({ password: dto.password })
          .expectStatus(400);
      });

      it('should throw if no password', () => {
        return pactum
          .spec()
          .post(url)
          .withBody({ email: dto.email })
          .expectStatus(400);
      });

      it('should throw if wrong email', () => {
        return pactum
          .spec()
          .post(url)
          .withBody({ email: 'nouser@example.com', password: dto.password })
          .expectStatus(403);
      });

      it('should throw if wrong password', () => {
        return pactum
          .spec()
          .post(url)
          .withBody({ email: dto.email, password: 'wrongpassword' })
          .expectStatus(403);
      });

      it('should signin', () => {
        return pactum
          .spec()
          .post(url)
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('user/me')
          .withBearerToken('$S{userAt}')
          .expectStatus(200);
      });
    });

    describe('Edit user', () => {
      const dto: EditUserDto = {
        email: 'updated@example.com',
        firstName: 'updated',
      };

      it('should edit the user', () => {
        return pactum
          .spec()
          .patch('user')
          .withBody(dto)
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .expectBodyContains(dto.email)
          .expectBodyContains(dto.firstName);
      });
    });
  });

  describe('Bookmark', () => {
    describe('Get empty bookmarks', () => {
      it('should get empty bookmarks array', () => {
        return pactum
          .spec()
          .get('bookmark')
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .expectJsonLength(0);
      });
    });

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'Test Bookmark',
        link: 'https://www.youtube.com/watch?v=GHTA143_b-s',
      };

      it('should create a bookmark', () => {
        return pactum
          .spec()
          .post('bookmark')
          .withBearerToken('$S{userAt}')
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });
    });

    describe('Get all bookmarks', () => {
      it('should get user bookmarks array', () => {
        return pactum
          .spec()
          .get('bookmark')
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });

    describe('Get bookmark by id', () => {
      it('should get a bookmark', () => {
        return pactum
          .spec()
          .get('bookmark/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}');
      });
    });

    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        title: 'Updated Title',
        description: 'A testing bookmark',
      };

      it('should edit a bookmark', () => {
        return pactum
          .spec()
          .patch('bookmark/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withBearerToken('$S{userAt}')
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.description);
      });
    });

    describe('Delete bookmark by id', () => {
      it('should delete a bookmark', () => {
        return pactum
          .spec()
          .delete('bookmark/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withBearerToken('$S{userAt}')
          .expectStatus(204);
      });

      it('should get empty bookmarks array', () => {
        return pactum
          .spec()
          .get('bookmark')
          .withBearerToken('$S{userAt}')
          .expectStatus(200)
          .expectJsonLength(0);
      });
    });
  });
});
