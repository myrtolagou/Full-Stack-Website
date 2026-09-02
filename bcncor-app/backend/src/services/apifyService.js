/**
 * services/apifyService.js
 *
 * Scrapes LinkedIn company posts via the Apify harvestapi~linkedin-company-posts actor.
 * APIFY_TOKEN must be set in .env — if missing, scraping is skipped gracefully.
 */

const APIFY_TOKEN     = process.env.APIFY_TOKEN;
const APIFY_TOKEN_OWN = process.env.APIFY_TOKEN_OWN;
const ACTOR_ID        = 'harvestapi~linkedin-company-posts';

async function scrapeLinkedInPosts(linkedinUrls, competitors = [], maxPostsPerCompany = 5) {
  if (!APIFY_TOKEN) {
    throw new Error('APIFY_TOKEN not set in environment variables');
  }
  if (!linkedinUrls || linkedinUrls.length === 0) return [];

  // Build a URL → {name, id} map from the competitors list for post normalisation
  const urlToCompetitor = new Map();
  for (const c of competitors) {
    if (c.linkedinUrl) urlToCompetitor.set(c.linkedinUrl.replace(/\/$/, ''), { name: c.name, id: c.id });
  }

  // Start the actor run
  const startResponse = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ targetUrls: linkedinUrls, maxPostsPerCompany, sortBy: 'date' }),
    }
  );

  if (!startResponse.ok) {
    const err = await startResponse.text();
    throw new Error(`Apify actor start failed: ${err}`);
  }

  const startData = await startResponse.json();
  const runId     = startData.data.id;

  // Poll until finished (max 2 minutes)
  const maxWaitMs      = 120000;
  const pollIntervalMs = 3000;
  const startTime      = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    const statusResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
    );
    const statusData = await statusResponse.json();
    const status     = statusData.data.status;

    if (status === 'SUCCEEDED') break;
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
      throw new Error(`Apify run ${status}: ${runId}`);
    }
  }

  // Fetch results
  const datasetId       = startData.data.defaultDatasetId;
  const resultsResponse = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&clean=true`
  );

  if (!resultsResponse.ok) throw new Error('Failed to fetch Apify dataset results');

  const rawPosts = await resultsResponse.json();
  return rawPosts.map(raw => normaliseLinkedInPost(raw, urlToCompetitor));
}

function normaliseLinkedInPost(raw, urlToCompetitor = new Map()) {
  const targetUrl  = (raw.query?.targetUrl || '').replace(/\/$/, '');
  const fromMap    = urlToCompetitor.get(targetUrl);
  return {
    id:            raw.id,
    channel:       'linkedin',
    source:        'competitor',
    competitor:    fromMap?.name || raw.author?.name || 'Unknown',
    competitorId:  fromMap?.id  || raw.author?.universalName || '',
    title:         raw.content?.split('\n')[0]?.slice(0, 120) || 'LinkedIn post',
    content:       raw.content || '',
    url:           raw.linkedinUrl || '',
    date:          raw.postedAt?.date || new Date().toISOString(),
    postedAgo:     raw.postedAt?.postedAgoText || '',
    isRepost:      !!(raw.repostedBy || raw.repostId),
    repostedFrom:  raw.repostedBy?.name || null,
    imageUrl:      raw.postImages?.[0]?.url || null,
    videoUrl:      raw.postVideo?.videoUrl || null,
    articleTitle:  raw.article?.title || null,
    articleUrl:    raw.article?.link || null,
    engagement: {
      likes:    raw.engagement?.likes    || 0,
      comments: raw.engagement?.comments || 0,
      shares:   raw.engagement?.shares   || 0,
    },
    status:    'new',
    createdAt: new Date().toISOString(),
  };
}

// ── Instagram ─────────────────────────────────────────────────────────────────

const IG_ACTOR_ID = 'apify~instagram-scraper';

async function scrapeInstagramPosts(handles, competitors = [], maxPostsPerAccount = 5) {
  if (!APIFY_TOKEN) throw new Error('APIFY_TOKEN not set in environment variables');
  if (!handles || handles.length === 0) return [];

  const handleToCompetitor = new Map();
  for (const c of competitors) {
    if (c.instagramHandle) {
      handleToCompetitor.set(c.instagramHandle.toLowerCase(), { name: c.name, id: c.id });
    }
  }

  const directUrls = handles.map(h => `https://www.instagram.com/${h}/`);

  const startResponse = await fetch(
    `https://api.apify.com/v2/acts/${IG_ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        directUrls,
        resultsType:   'posts',
        resultsLimit:  maxPostsPerAccount,
        addParentData: false,
      }),
    }
  );

  if (!startResponse.ok) {
    const err = await startResponse.text();
    throw new Error(`Apify Instagram actor start failed: ${err}`);
  }

  const startData = await startResponse.json();
  const runId     = startData.data.id;

  const maxWaitMs      = 120000;
  const pollIntervalMs = 3000;
  const startTime      = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
    const statusData     = await statusResponse.json();
    const status         = statusData.data.status;
    if (status === 'SUCCEEDED') break;
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
      throw new Error(`Apify Instagram run ${status}: ${runId}`);
    }
  }

  const datasetId       = startData.data.defaultDatasetId;
  const resultsResponse = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&clean=true`
  );
  if (!resultsResponse.ok) throw new Error('Failed to fetch Apify Instagram dataset results');

  const rawPosts = await resultsResponse.json();
  return rawPosts.map(raw => normaliseInstagramPost(raw, handleToCompetitor));
}

function normaliseInstagramPost(raw, handleToCompetitor = new Map()) {
  const handle  = (raw.ownerUsername || '').toLowerCase();
  const fromMap = handleToCompetitor.get(handle);
  return {
    id:           raw.id || raw.shortCode,
    channel:      'instagram',
    source:       'competitor',
    competitor:   fromMap?.name || raw.ownerUsername || 'Unknown',
    competitorId: fromMap?.id   || handle || '',
    content:      raw.caption   || '',
    url:          raw.url || (raw.shortCode ? `https://www.instagram.com/p/${raw.shortCode}/` : ''),
    date:         raw.timestamp || new Date().toISOString(),
    imageUrl:     raw.displayUrl || null,
    videoUrl:     raw.videoUrl   || null,
    postType:     (raw.type || 'image').toLowerCase(),
    likes:        raw.likesCount    || 0,
    comments:     raw.commentsCount || 0,
    status:       'new',
    createdAt:    new Date().toISOString(),
  };
}

// ── Own content (BcnCor) ─────────────────────────────────────────────────

async function scrapeOwnLinkedInPosts(maxPosts = 20) {
  if (!APIFY_TOKEN_OWN) throw new Error('APIFY_TOKEN_OWN not set');

  const startResponse = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN_OWN}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        targetUrls:         ['https://www.linkedin.com/company/bcncor/'],
        maxPostsPerCompany: maxPosts,
        sortBy:             'date',
      }),
    }
  );

  if (!startResponse.ok) {
    const err = await startResponse.text();
    throw new Error(`Apify actor start failed: ${err}`);
  }

  const startData = await startResponse.json();
  const runId     = startData.data.id;

  const maxWaitMs      = 120000;
  const pollIntervalMs = 3000;
  const startTime      = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN_OWN}`);
    const statusData     = await statusResponse.json();
    const status         = statusData.data.status;
    if (status === 'SUCCEEDED') break;
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
      throw new Error(`Apify run ${status}: ${runId}`);
    }
  }

  const datasetId       = startData.data.defaultDatasetId;
  const resultsResponse = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN_OWN}&clean=true`
  );
  if (!resultsResponse.ok) throw new Error('Failed to fetch Apify dataset results');

  const rawPosts = await resultsResponse.json();
  return rawPosts.map(raw => ({
    id:           raw.id,
    channel:      'linkedin',
    source:       'own',
    title:        raw.content?.split('\n')[0]?.slice(0, 120) || 'LinkedIn post',
    content:      raw.content || '',
    url:          raw.linkedinUrl || '',
    date:         raw.postedAt?.date || new Date().toISOString(),
    postedAgo:    raw.postedAt?.postedAgoText || '',
    isRepost:     !!(raw.repostedBy || raw.repostId),
    imageUrl:     raw.postImages?.[0]?.url || null,
    videoUrl:     raw.postVideo?.videoUrl  || null,
    articleTitle: raw.article?.title || null,
    articleUrl:   raw.article?.link  || null,
    engagement: {
      likes:    raw.engagement?.likes    || 0,
      comments: raw.engagement?.comments || 0,
      shares:   raw.engagement?.shares   || 0,
    },
  }));
}

async function scrapeOwnInstagramPosts(maxPosts = 20) {
  if (!APIFY_TOKEN_OWN) throw new Error('APIFY_TOKEN_OWN not set');

  const startResponse = await fetch(
    `https://api.apify.com/v2/acts/${IG_ACTOR_ID}/runs?token=${APIFY_TOKEN_OWN}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        directUrls:    ['https://www.instagram.com/bcncor_/'],
        resultsType:   'posts',
        resultsLimit:  maxPosts,
        addParentData: false,
      }),
    }
  );

  if (!startResponse.ok) {
    const err = await startResponse.text();
    throw new Error(`Apify Instagram actor start failed: ${err}`);
  }

  const startData = await startResponse.json();
  const runId     = startData.data.id;

  const maxWaitMs      = 120000;
  const pollIntervalMs = 3000;
  const startTime      = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN_OWN}`);
    const statusData     = await statusResponse.json();
    const status         = statusData.data.status;
    if (status === 'SUCCEEDED') break;
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
      throw new Error(`Apify Instagram run ${status}: ${runId}`);
    }
  }

  const datasetId       = startData.data.defaultDatasetId;
  const resultsResponse = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN_OWN}&clean=true`
  );
  if (!resultsResponse.ok) throw new Error('Failed to fetch Apify Instagram dataset results');

  const rawPosts = await resultsResponse.json();
  return rawPosts.map(raw => ({
    id:       raw.id || raw.shortCode,
    channel:  'instagram',
    source:   'own',
    content:  raw.caption || '',
    url:      raw.url || (raw.shortCode ? `https://www.instagram.com/p/${raw.shortCode}/` : ''),
    date:     raw.timestamp || new Date().toISOString(),
    imageUrl: raw.displayUrl || null,
    videoUrl: raw.videoUrl   || null,
    postType: (raw.type || 'image').toLowerCase(),
    likes:    raw.likesCount    || 0,
    comments: raw.commentsCount || 0,
  }));
}

module.exports = { scrapeLinkedInPosts, normaliseLinkedInPost, scrapeInstagramPosts, normaliseInstagramPost, scrapeOwnLinkedInPosts, scrapeOwnInstagramPosts };
