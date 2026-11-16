/**
 * Automated Test Suite for ENECTRON Backend API
 * Uses Node.js native test runner and assert module.
 */

const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');
const { initDatabase, closeDatabase } = require('../src/config/database');
const { generateOwnerNotificationHtml, generateCustomerAckHtml } = require('../src/services/emailService');

let server = null;
let baseUrl = '';

test.before(async () => {
  await initDatabase();
  // Start test server on random available port
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeDatabase();
});

// Helper for making HTTP JSON requests in tests
async function makeRequest(path, { method = 'GET', body = null, headers = {} } = {}) {
  const url = `${baseUrl}${path}`;
  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  const response = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined
  });

  const json = await response.json().catch(() => null);
  return {
    status: response.status,
    headers: response.headers,
    data: json
  };
}

test('1. Health Check Endpoint - GET /api/health returns health status', async () => {
  const res = await makeRequest('/api/health');
  // Health returns 200 or 503 (if db offline during testing)
  assert.ok(res.status === 200 || res.status === 503);
  assert.ok(res.data.service === 'ENECTRON Enquiry Management API');
  assert.ok('database' in res.data);
  assert.ok('smtp' in res.data);
});

test('2. Root Info Endpoint - GET / returns system info', async () => {
  const res = await makeRequest('/');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.name, 'ENECTRON Full-Stack Enquiry Management API');
});

test('3. Validation - Missing Name rejected with 400', async () => {
  const res = await makeRequest('/api/enquiries', {
    method: 'POST',
    body: {
      name: '',
      mobile_number: '+91 98765 43210',
      email: 'john@example.com'
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.data.success, false);
  assert.ok(res.data.errors.some(e => e.includes('name')));
});

test('4. Validation - Missing Mobile Number rejected with 400', async () => {
  const res = await makeRequest('/api/enquiries', {
    method: 'POST',
    body: {
      name: 'John Doe',
      mobile_number: '',
      email: 'john@example.com'
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.data.success, false);
  assert.ok(res.data.errors.some(e => e.toLowerCase().includes('mobile')));
});

test('5. Validation - Too short mobile number rejected with 400', async () => {
  const res = await makeRequest('/api/enquiries', {
    method: 'POST',
    body: {
      name: 'John Doe',
      mobile_number: '123',
      email: 'john@example.com'
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.data.success, false);
  assert.ok(res.data.errors.some(e => e.includes('mobile number')));
});

test('6. Validation - Invalid Email Address rejected with 400', async () => {
  const res = await makeRequest('/api/enquiries', {
    method: 'POST',
    body: {
      name: 'John Doe',
      mobile_number: '+91 98765 43210',
      email: 'not-a-valid-email'
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.data.success, false);
  assert.ok(res.data.errors.some(e => e.includes('email')));
});

test('7. 404 Handler - Unknown route returns 404 JSON', async () => {
  const res = await makeRequest('/api/unknown-endpoint');
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.data.success, false);
});

test('8. Email Service - HTML template generates correct customer details', () => {
  const sampleEnquiry = {
    id: 101,
    name: 'Alice Johnson',
    mobile_number: '+91 98765 43210',
    email: 'alice@company.com',
    company_name: 'SolarTech Ltd',
    application_use_case: 'Showrooms',
    requirement: 'Need product details for multiple showroom branches.'
  };

  const html = generateOwnerNotificationHtml(sampleEnquiry);
  assert.ok(html.includes('Alice Johnson'));
  assert.ok(html.includes('+91 98765 43210'));
  assert.ok(html.includes('alice@company.com'));
  assert.ok(html.includes('SolarTech Ltd'));
  assert.ok(html.includes('Showrooms'));
  assert.ok(html.includes('Need product details for multiple showroom branches.'));

  const ackHtml = generateCustomerAckHtml(sampleEnquiry);
  assert.ok(ackHtml.includes('Alice Johnson'));
  assert.ok(ackHtml.includes('#101'));
});

test('9. Security - XSS characters are escaped in email template', () => {
  const sampleEnquiry = {
    id: 102,
    name: '<script>alert("xss")</script>',
    mobile_number: '+91 98765 43210',
    email: 'safe@test.com',
    company_name: '<b>Bad Company</b>',
    application_use_case: 'Others',
    requirement: '<img src=x onerror=alert(1)>'
  };

  const html = generateOwnerNotificationHtml(sampleEnquiry);
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<b>Bad Company</b>'));
  assert.ok(html.includes('&lt;b&gt;Bad Company&lt;/b&gt;'));
});

test('10. Rate Limiting - Excessive submissions trigger 429 Too Many Requests', async () => {
  let hitRateLimit = false;
  // Send rapid requests to trip rate limiter
  for (let i = 0; i < 18; i++) {
    const res = await makeRequest('/api/enquiries', {
      method: 'POST',
      body: {
        name: 'Rapid Submitter',
        mobile_number: '+91 98765 43210',
        email: `rapid${i}@example.com`
      }
    });

    if (res.status === 429) {
      hitRateLimit = true;
      assert.strictEqual(res.data.success, false);
      assert.ok(res.data.message.includes('Too many enquiry submissions'));
      break;
    }
  }

  assert.ok(hitRateLimit, 'Rate limiter should trigger HTTP 429 after threshold');
});
