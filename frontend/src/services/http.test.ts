import { http as mswHttp, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '../test/msw-server';

import { http, HttpError, setUnauthorizedHandler } from './http';

const API_URL = 'http://localhost:3000';

describe('http client', () => {
  beforeEach(() => {
    document.cookie = '';
    setUnauthorizedHandler(null);
  });

  it('includes credentials and JSON content-type for body requests', async () => {
    const seen: { contentType: string | null } = { contentType: null };
    server.use(
      mswHttp.post(`${API_URL}/echo`, ({ request }) => {
        seen.contentType = request.headers.get('Content-Type');
        return HttpResponse.json({ ok: true });
      }),
    );

    await http('/echo', { method: 'POST', body: JSON.stringify({ a: 1 }) });

    expect(seen.contentType).toBe('application/json');
  });

  it('attaches X-CSRF-Token header from the csrf_token cookie on mutations', async () => {
    document.cookie = 'csrf_token=token-abc-123; path=/';
    let captured: string | null = null;
    server.use(
      mswHttp.post(`${API_URL}/with-csrf`, ({ request }) => {
        captured = request.headers.get('X-CSRF-Token');
        return HttpResponse.json({ ok: true });
      }),
    );

    await http('/with-csrf', { method: 'POST', body: '{}' });

    expect(captured).toBe('token-abc-123');
  });

  it('does not send X-CSRF-Token on GET requests', async () => {
    document.cookie = 'csrf_token=token-xyz; path=/';
    let captured: string | null = 'INITIAL';
    server.use(
      mswHttp.get(`${API_URL}/safe`, ({ request }) => {
        captured = request.headers.get('X-CSRF-Token');
        return HttpResponse.json({ ok: true });
      }),
    );

    await http('/safe');

    expect(captured).toBeNull();
  });

  it('invokes the unauthorized handler and throws on 401', async () => {
    server.use(
      mswHttp.get(`${API_URL}/forbidden`, () => {
        return new HttpResponse(null, { status: 401 });
      }),
    );
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    await expect(http('/forbidden')).rejects.toBeInstanceOf(HttpError);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('throws HttpError with the body message on non-2xx', async () => {
    server.use(
      mswHttp.get(`${API_URL}/bad`, () => {
        return HttpResponse.json({ message: 'Boom' }, { status: 400 });
      }),
    );

    await expect(http('/bad')).rejects.toMatchObject({
      status: 400,
      message: 'Boom',
    });
  });
});
