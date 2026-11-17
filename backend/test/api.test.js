/**
 * Automated Test Suite for ENECTRON Backend API
 * Uses Node.js native test runner and assert module.
 */

const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const { generateOwnerNotificationHtml, generateCustomerAckHtml } = require('../src/services/emailService');

let server = null;
let baseUrl = '';

test.before(async () => {
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

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  return {
    status: response.status,
    headers: response.headers,
    data
  };
}

test('1. Health Check Endpoint - GET /api/health returns 200 and healthy status', async () => {
  const res = await makeRequest('/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.status, 'healthy');
  assert.strictEqual(res.data.service, 'ENECTRON Enquiry Management API');
  assert.ok('email' in res.data || 'deliveryMode' in res.data);
});

test('2. Root Endpoint - GET / serves existing frontend index.html', async () => {
  const res = await makeRequest('/');
  assert.strictEqual(res.status, 200);
  assert.ok(typeof res.data === 'string');
  assert.ok(res.data.includes('ENECTRON'));
  assert.ok(res.data.includes('Enquire Now'));
});

test('3. Validation - Missing Name rejected with 400', async () => {
  const res = await makeRequest('/api/enquiry', {
    method: 'POST',
    body: {
      user_name: '',
      mobile_number: '+91 98765 43210',
      user_email: 'john@example.com'
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.data.success, false);
  assert.ok(res.data.errors.some(e => e.toLowerCase().includes('name')));
});

test('4. Validation - Missing Mobile Number rejected with 400', async () => {
  const res = await makeRequest('/api/enquiry', {
    method: 'POST',
    body: {
      user_name: 'John Doe',
      mobile_number: '',
      user_email: 'john@example.com'
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.data.success, false);
  assert.ok(res.data.errors.some(e => e.toLowerCase().includes('mobile')));
});

test('5. Validation - Too short mobile number rejected with 400', async () => {
  const res = await makeRequest('/api/enquiry', {
    method: 'POST',
    body: {
      user_name: 'John Doe',
      mobile_number: '123',
      user_email: 'john@example.com'
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.data.success, false);
  assert.ok(res.data.errors.some(e => e.toLowerCase().includes('mobile number')));
});

test('6. Validation - Invalid Email Address rejected with 400', async () => {
  const res = await makeRequest('/api/enquiry', {
    method: 'POST',
    body: {
      user_name: 'John Doe',
      mobile_number: '+91 98765 43210',
      user_email: 'not-a-valid-email'
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.data.success, false);
  assert.ok(res.data.errors.some(e => e.toLowerCase().includes('email')));
});

test('7. 404 Handler - Unknown API route returns 404 JSON', async () => {
  const res = await makeRequest('/api/unknown-endpoint');
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.data.success, false);
});

test('8. Email Service - HTML template generates correct customer details', () => {
  const sampleEnquiry = {
    user_name: 'Alice Johnson',
    mobile_number: '+91 98765 43210',
    user_email: 'alice@company.com',
    company_name: 'SolarTech Ltd',
    application: 'Showrooms',
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
  assert.ok(ackHtml.includes('SolarTech Ltd') === false); // ack has requirement summary
  assert.ok(ackHtml.includes('Showrooms'));
});

test('9. Security - XSS characters are escaped in email template', () => {
  const sampleEnquiry = {
    user_name: '<script>alert("xss")</script>',
    mobile_number: '+91 98765 43210',
    user_email: 'safe@test.com',
    company_name: '<b>Bad Company</b>',
    application: 'Others',
    requirement: '<img src=x onerror=alert(1)>'
  };

  const html = generateOwnerNotificationHtml(sampleEnquiry);
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<b>Bad Company</b>'));
  assert.ok(html.includes('&lt;b&gt;Bad Company&lt;/b&gt;'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;img src=x'));
});

test('10. Rate Limiting - Excessive submissions trigger 429 Too Many Requests', async () => {
  let hitRateLimit = false;
  for (let i = 0; i < 20; i++) {
    const res = await makeRequest('/api/enquiry', {
      method: 'POST',
      body: {
        user_name: 'Rapid Submitter',
        mobile_number: '+91 98765 43210',
        user_email: `rapid${i}@example.com`
      }
    });

    if (res.status === 429) {
      hitRateLimit = true;
      assert.strictEqual(res.data.success, false);
      assert.ok(res.data.message.includes('Too many enquiry submissions') || res.data.message.includes('wait'));
      break;
    }
  }

  assert.ok(hitRateLimit, 'Rate limiter should trigger HTTP 429 after threshold');
});
