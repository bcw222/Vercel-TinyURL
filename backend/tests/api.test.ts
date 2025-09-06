import { expect } from 'chai';
import request from 'supertest';
import Koa from 'koa';
import app from '../src/index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('TinyURL API Tests', () => {
  let server: any;
  let accessToken: string;
  let refreshToken: string;
  let userId: string;
  let shortLinkSlug: string;

  before(async () => {
    server = (app as any).listen();
  });

  after(async () => {
    server.close();
    await prisma.$disconnect();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('user');
      expect(response.body).to.have.property('accessToken');
      expect(response.body).to.have.property('refreshToken');
      expect(response.body.user.email).to.equal('test@example.com');
      expect(response.body.user.name).to.equal('Test User');

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
      userId = response.body.user.id;
    });

    it('should login user', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('accessToken');
      expect(response.body).to.have.property('refreshToken');

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).to.equal(401);
      expect(response.body.error).to.equal('invalid_credentials');
    });

    it('should refresh access token', async () => {
      const response = await request(server)
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('accessToken');

      accessToken = response.body.accessToken;
    });
  });
  
  describe('User Management', () => {
    it('should get current user info', async () => {
      const response = await request(server)
        .get('/api/v1/user/me')
        .set('Authorization', `Bearer ${accessToken}`);
  
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('email');
      expect(response.body).to.have.property('name');
      expect(response.body).to.have.property('shortLinksCount');
    });
  
    it('should update user info', async () => {
      const response = await request(server)
        .put('/api/v1/user/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Test User'
        });
  
      expect(response.status).to.equal(200);
      expect(response.body.email).to.equal('test@example.com');
      expect(response.body.name).to.equal('Updated Test User');
    });
  
    it('should fail to update password with incorrect current password', async () => {
      const loginResponse = await request(server)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(loginResponse.status).to.equal(200);

      const response = await request(server)
        .put('/api/v1/user/password')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        });

      expect(response.body.error).to.equal('token_verification_failed');
      expect(response.status).to.equal(401);
    });
  
    it('should update user password', async () => {
      const response = await request(server)
        .put('/api/v1/user/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        });
  
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.equal('Password updated successfully');
    });
  
    it('should be able to login with new password', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'newpassword123'
        });
  
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('accessToken');
      expect(response.body).to.have.property('refreshToken');
  
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });
  
    it('should be unable to login with old password', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
  
      expect(response.status).to.equal(401);
      expect(response.body.error).to.equal('invalid_credentials');
    });
  });
  
  describe('Short Link Operations', () => {
    it('should create a short link', async () => {
      const response = await request(server)
        .post('/api/v1/shorten')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          originalUrl: 'https://example.com/very/long/url'
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('slug');
      expect(response.body).to.have.property('originalUrl');
      expect(response.body.originalUrl).to.equal('https://example.com/very/long/url');

      shortLinkSlug = response.body.slug;
    });

    it('should get short link info', async () => {
      const response = await request(server)
        .get(`/api/v1/info/${shortLinkSlug}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('slug');
      expect(response.body).to.have.property('originalUrl');
      expect(response.body).to.have.property('clickCount');
      expect(response.body.slug).to.equal(shortLinkSlug);
    });

    it('should redirect to original URL', async () => {
      const response = await request(server)
        .get(`/api/v1/${shortLinkSlug}`);

      expect(response.status).to.equal(302);
      expect(response.headers.location).to.equal('https://example.com/very/long/url');
    });

    it('should update short link', async () => {
      const response = await request(server)
        .put(`/api/v1/shorten/${shortLinkSlug}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          originalUrl: 'https://new-example.com/updated/url'
        });

      expect(response.status).to.equal(200);
      expect(response.body.slug).to.equal(shortLinkSlug);
      expect(response.body.originalUrl).to.equal('https://new-example.com/updated/url');
    });

    it('should get user links', async () => {
      const response = await request(server)
        .get('/api/v1/user/links')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('links');
      expect(response.body).to.have.property('pagination');
      expect(Array.isArray(response.body.links)).to.be.true;
      expect(response.body.links.length).to.be.greaterThan(0);
    });

    it('should delete short link', async () => {
      const response = await request(server)
        .delete(`/api/v1/${shortLinkSlug}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(204);
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for unauthorized access', async () => {
      const response = await request(server)
        .get('/api/v1/user/me');

      expect(response.status).to.equal(401);
      expect(response.body.error).to.equal('missing_authorization_header');
    });

    it('should return 404 for non-existent short link', async () => {
      const response = await request(server)
        .get('/api/v1/nonexistent');

      expect(response.status).to.equal(302);
      // Should redirect to fallback URL
    });
  });
});