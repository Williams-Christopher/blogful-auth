const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const jwt = require('jsonwebtoken');

describe(`Auth endpoints`, () => {
    let db;

    const { testUsers } = helpers.makeArticlesFixtures();
    const testUser = testUsers[1];

    before(`make knex instance`, () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        });
        app.set('db', db);
    });

    after(`disconnect db`, () => db.destroy());

    before(`cleanup`, () => helpers.cleanTables(db));

    afterEach(`cleanup`, () => helpers.cleanTables(db));

    describe(`POST /api/auth/login`, () => {
        beforeEach(`insert users`, () =>
            helpers.seedUsers(db, testUsers)
        )

        const requiredFields = ['user_name', 'password'];

        requiredFields.forEach(field => {
            const loginAttemptBody = {
                user_name: testUser.user_name,
                password: testUser.password,
            };

            it(`responds with 400 required when '${field}' is missing`, () => {
                delete loginAttemptBody[field];

                return supertest(app)
                    .post('/api/auth/login')
                    .send(loginAttemptBody)
                    .expect(400, {error: `Missing '${field}' in request body`});
            });
        });

        it(`responds 400 'invalid user name or password' when bad user name`, () => {
            const userInvalidName = {user_name: 'user-not', password: 'existy'};
            return supertest(app)
                .post('/api/auth/login')
                .send(userInvalidName)
                .expect(400, {error: 'Invalid user name or password'});
        });

        it(`responds 400 'invalid user name or password' when bad password`, () => {
            const userInvalidPassword = {user_name: testUsers[0].user_name, password: 'incorrect-password'};
            return supertest(app)
                .post('/api/auth/login')
                .send(userInvalidPassword)
                .expect(400, {error: 'Invalid user name or password'});
        });

        it(`responds 200 and a JWT auth token using secret when valid credentials`, () => {
            const userValidCreds = { user_name: testUser.user_name, password: testUser.password };
            const expectedToken = jwt.sign(
                { user_id: testUser.id }, //payload
                process.env.JWT_SECRET,
                {
                    subject: testUser.user_name,
                    algorithm: 'HS256',
                }
            );

            return supertest(app)
                .post('/api/auth/login')
                .send(userValidCreds)
                .expect(200, { authToken: expectedToken });
        });
    });
});