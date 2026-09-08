import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressHandlers, MAX_PROGRESS_BYTES } from '../server/progress-api.ts';

const user = {userId:'alice', email:'test@example.invalid', displayName:'Test', fullName:null};
const fixture = () => {
  const calls = [];
  const handlers = createProgressHandlers(async request => request.headers.get('authorization') === 'Bearer valid' ? {
    user,
    read: async () => { calls.push('read'); return {progress:{history:[]},updatedAt:1}; },
    write: async value => { calls.push(value); return 2; },
    remove: async () => { calls.push('delete'); },
  } : null);
  return {handlers,calls};
};
const request = (method = 'GET', headers = {}, body) => new Request('https://paceprep.test/api/progress', {
  method, headers: {authorization:'Bearer valid', 'content-type':'application/json', ...headers}, ...(body === undefined ? {} : {body}),
});

test('account changes fail before reading, writing or deleting data', async () => {
  for (const method of ['GET','PUT','DELETE']) {
    const {handlers,calls} = fixture();
    const response = await handlers[method](request(method, {'X-PacePrep-Account':'bob'}, method==='PUT' ? '{}' : undefined));
    assert.equal(response.status, 409);
    assert.deepEqual(calls, []);
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
});
test('forged client account expectations do not authenticate', async () => {
  const {handlers} = fixture();
  assert.equal((await handlers.GET(request('GET', {authorization:'', 'X-PacePrep-Account':'alice'}))).status, 401);
});
test('identity lookup never retrieves private learning history', async () => {
  const {handlers,calls} = fixture();
  const response = await handlers.GET(new Request('https://paceprep.test/api/progress?identity=1', {headers:{authorization:'Bearer valid'}}));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).progress, undefined);
  assert.deepEqual(calls, []);
});
test('malformed, oversized and cross-origin writes are rejected before storage', async () => {
  const {handlers,calls} = fixture();
  for (const body of ['null', '[]', '{"history":{}}', '{"stats":{"x":{"attempts":-1}}}', '{"history":[{"id":"__proto__"}]}'])
    assert.equal((await handlers.PUT(request('PUT',{},body))).status,400);
  assert.equal((await handlers.PUT(request('PUT',{},' '.repeat(MAX_PROGRESS_BYTES+1)))).status,413);
  assert.equal((await handlers.PUT(request('PUT',{origin:'https://evil.test'},'{}'))).status,403);
  assert.equal((await handlers.DELETE(request('DELETE',{'sec-fetch-site':'cross-site'}))).status,403);
  assert.deepEqual(calls,[]);
});
test('valid writes and backend failures have deliberate private responses', async () => {
  const {handlers,calls} = fixture();
  assert.equal((await handlers.PUT(request('PUT',{},'{"history":[],"stats":{}}'))).status,200);
  assert.equal(calls.length,1);
  const failed = createProgressHandlers(async () => {throw new Error('private details');});
  const response = await failed.GET(request());
  assert.equal(response.status,503);
  assert.doesNotMatch(await response.text(),/private details/);
});
