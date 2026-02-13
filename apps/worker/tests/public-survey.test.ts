import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';

describe('Public Survey API', () => {
  it.skip('GET /api/surveys/public/:slug returns 404 for unknown slug', async () => {
    const res = await SELF.fetch('http://example.com/api/surveys/public/unknown-slug');
    expect(res.status).toBe(404);
  });

  // Test for the NEW feature (Redirect)
  it('GET /s/:slug redirects to frontend', async () => {
    const slug = 'test-slug';
    // We expect a redirect to the frontend URL
    const res = await SELF.fetch(`http://example.com/s/${slug}`, { redirect: 'manual' });
    
    // CURRENTLY RED: This should fail because the route is missing/removed
    expect(res.status).toBe(302);
    const location = res.headers.get('Location');
    expect(location).toMatch(/\/s\/test-slug$/);
  });
});
