import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json());

// Static assets (built Vite frontend)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../frontend/dist');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Fetch a single Reddit thread (post + top comments) via JSON endpoint
async function fetchRedditThread(permalink) {
  const threadUrl = `https://www.reddit.com${permalink}.json?limit=20`;

  const res = await fetch(threadUrl, {
    headers: {
      'User-Agent': 'UniHandle/1.0 (by u/your-username)',
    },
  });

  if (!res.ok) {
    throw new Error('Reddit thread fetch failed');
  }

  const json = await res.json();

  const postData = json?.[0]?.data?.children?.[0]?.data;
  const comments = json?.[1]?.data?.children || [];

  const commentsText = comments
    .filter((c) => c.kind === 't1')
    .slice(0, 10) // top 10 comments
    .map((c) => c.data?.body || '')
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 1500); // cap combined comments

  return {
    title: postData?.title || '',
    selftext: (postData?.selftext || '').slice(0, 1500),
    url: `https://www.reddit.com${postData?.permalink || permalink}`,
    score: postData?.score,
    num_comments: postData?.num_comments,
    created_utc: postData?.created_utc,
    subreddit: postData?.subreddit,
    commentsText,
  };
}

// Light Reddit search for university-score: listing only, no full thread fetch (saves tokens)
async function fetchRedditPostsLight(universityName, country) {
  const searchQuery = country && country.trim()
    ? `${universityName} ${country.trim()} university student reviews`
    : `${universityName} university student reviews`;
  const q = encodeURIComponent(searchQuery);
  const url = `https://www.reddit.com/search.json?q=${q}&limit=10&sort=relevance`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'UniHandle/1.0 (by u/your-username)',
    },
  });

  if (!res.ok) {
    throw new Error('Reddit search failed');
  }

  const json = await res.json();
  const allPosts = (json.data?.children || []).map((c) => c.data);

  const nowSeconds = Date.now() / 1000;
  const threeYearsSeconds = 3 * 365 * 24 * 60 * 60;
  const cutoff = nowSeconds - threeYearsSeconds;

  const recentPosts = allPosts.filter(
    (p) => typeof p.created_utc === 'number' && p.created_utc >= cutoff
  );

  return recentPosts.slice(0, 3).map((p) => ({
    title: p.title || '',
    snippet: (p.selftext || '').slice(0, 220),
    score: p.score,
    subreddit: p.subreddit,
  }));
}

// Search Reddit and then fetch full threads (post + top comments)
async function fetchRedditPosts(universityName, country) {
  const searchQuery = country && country.trim()
    ? `${universityName} ${country.trim()} university student reviews`
    : `${universityName} university student reviews`;
  const q = encodeURIComponent(searchQuery);
  const url = `https://www.reddit.com/search.json?q=${q}&limit=10&sort=relevance`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'UniHandle/1.0 (by u/your-username)',
    },
  });

  if (!res.ok) {
    throw new Error('Reddit search failed');
  }

  const json = await res.json();

  const allPosts = (json.data?.children || []).map((c) => c.data);

  // Only keep posts from roughly the last 3 years
  const nowSeconds = Date.now() / 1000;
  const threeYearsSeconds = 3 * 365 * 24 * 60 * 60;
  const cutoff = nowSeconds - threeYearsSeconds;

  const recentPosts = allPosts.filter(
    (p) => typeof p.created_utc === 'number' && p.created_utc >= cutoff
  );

  // Take top 3 recent threads
  const posts = recentPosts.slice(0, 3);

  // For each search result, pull the full thread (post + top comments)
  const threads = await Promise.all(
    posts.map((p) => fetchRedditThread(p.permalink))
  );

  return threads;
}

// Search Reddit for student living-cost threads for a country/city
async function fetchRedditLivingCosts(location) {
  const q = encodeURIComponent(`${location} student living costs accommodation food monthly budget`);
  const url = `https://www.reddit.com/search.json?q=${q}&limit=10&sort=relevance`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'UniHandle/1.0 (by u/your-username)',
    },
  });

  if (!res.ok) {
    throw new Error('Reddit living-cost search failed');
  }

  const json = await res.json();

  const allPosts = (json.data?.children || []).map((c) => c.data);

  // Only keep posts from roughly the last 3 years
  const nowSeconds = Date.now() / 1000;
  const threeYearsSeconds = 3 * 365 * 24 * 60 * 60;
  const cutoff = nowSeconds - threeYearsSeconds;

  const recentPosts = allPosts.filter(
    (p) => typeof p.created_utc === 'number' && p.created_utc >= cutoff
  );

  const posts = recentPosts.slice(0, 3);

  const threads = await Promise.all(posts.map((p) => fetchRedditThread(p.permalink)));

  return threads;
}

// Placeholder for Quora data – you can later plug in a real web/search API (e.g. SerpAPI)
async function fetchQuoraSnippets(universityName) {
  // TODO: Replace with a real search integration for Quora if you want deeper grounding.
  // For now we just return an empty array and rely mainly on Reddit.
  return [];
}

app.post('/api/university-score', async (req, res) => {
  const { name, country } = req.body || {};
  const countryTrimmed = country && typeof country === 'string' ? country.trim() : '';

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Missing university name' });
  }

  try {
    const [redditSnippets, quoraSnippets] = await Promise.all([
      fetchRedditPostsLight(name, countryTrimmed || undefined),
      fetchQuoraSnippets(name),
    ]);

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content:
              'Score universities from Reddit/Quora snippets. Use nicknames (e.g. UofG, Oxbridge) as the university. Reply only with valid JSON. Keep output very short: 2 pros, 2 cons, 1–2 sentence summary, one short evidence line.',
          },
          {
            role: 'user',
            content: `
Uni: "${name}"${countryTrimmed ? ` | Country: "${countryTrimmed}"` : ''}

Reddit (title + snippet):
${JSON.stringify(redditSnippets)}

Quora:
${JSON.stringify(quoraSnippets.slice(0, 3))}

JSON only:
{"name":"...","rating":1-10,"summary":"1-2 sentences","pros":["...","..."],"cons":["...","..."],"evidenceStrength":"one short phrase"}
Name: include country only if given (e.g. "University of Glasgow, Scotland").
            `,
          },
        ],
        temperature: 0.4,
      }),
    });

    if (!groqRes.ok) {
      console.error('Groq error status:', groqRes.status, await groqRes.text());
      return res.status(500).json({ error: 'Groq API failed' });
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error('Parse error:', err, 'content:', content);
      return res.status(500).json({ error: 'Could not parse Groq response' });
    }

    return res.json({
      ...parsed,
      country: countryTrimmed || undefined,
    });
  } catch (err) {
    console.error('Backend error:', err);
    return res.status(500).json({ error: 'Failed to evaluate university' });
  }
});

// Profile-based university matching
app.post('/api/profile-match', async (req, res) => {
  const {
    cgpa,
    degree,
    ielts,
    budget,
    countryPreference,
    needScholarship,
    wantPr,
  } = req.body || {};

  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert international admissions advisor. Given a student profile, you recommend realistic university options grouped into Safe, Moderate, and Ambitious categories. Focus on commonly known, reasonably reputable universities for international students.',
          },
          {
            role: 'user',
            content: `
Student profile:
- CGPA: ${cgpa || 'N/A'}
- Degree / background: ${degree || 'N/A'}
- IELTS (or equivalent): ${ielts || 'N/A'}
- Budget: ${budget || 'N/A'}
- Country preference: ${countryPreference || 'N/A'}
- Needs scholarship: ${needScholarship ? 'Yes' : 'No'}
- Wants PR-friendly country: ${wantPr ? 'Yes' : 'No'}

Task:
1. Suggest 3–5 universities in each of these buckets:
   - Safe
   - Moderate
   - Ambitious
2. For each university include:
   - "name": official university name
   - "country": country
   - "reason": 1–2 sentence explanation tailored to this profile
   - "city": city if relevant (optional)
3. Only include universities where teaching is primarily in English for the student’s degree level.
4. Prefer countries that roughly match the stated preferences (budget, PR, scholarships, country).

Respond ONLY as strict JSON with this shape:
{
  "safe": { "universities": { "name": string, "country": string, "city"?: string, "reason": string }[] },
  "moderate": { "universities": { "name": string, "country": string, "city"?: string, "reason": string }[] },
  "ambitious": { "universities": { "name": string, "country": string, "city"?: string, "reason": string }[] }
}
          `,
          },
        ],
        temperature: 0.4,
      }),
    });

    if (!groqRes.ok) {
      console.error('Groq profile-match error:', groqRes.status, await groqRes.text());
      return res.status(500).json({ error: 'Groq profile match failed' });
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      console.error('Profile-match parse error:', err, 'content:', content);
      return res.status(500).json({ error: 'Could not parse profile match response' });
    }

    return res.json(parsed);
  } catch (err) {
    console.error('Backend profile-match error:', err);
    return res.status(500).json({ error: 'Failed to generate profile-based matches' });
  }
});

// Budget & pre-arrival cost overview for a given country / city
app.post('/api/budget-info', async (req, res) => {
  const { country, city } = req.body || {};

  if (!country || !country.trim()) {
    return res.status(400).json({ error: 'Country is required' });
  }

  const locationLabel = city ? `${city}, ${country}` : country;

  try {
    let livingCostThreads = [];
    try {
      livingCostThreads = await fetchRedditLivingCosts(locationLabel);
    } catch (err) {
      console.error('Reddit living-cost error:', err);
      livingCostThreads = [];
    }

    const redditSearchUrl = `https://www.reddit.com/search/?q=${encodeURIComponent(
      `${locationLabel} student living costs`
    )}`;

    const sources = [
      {
        type: 'official',
        label: `${country} official student visa information (search)`,
        url: `https://www.google.com/search?q=${encodeURIComponent(
          `${country} official student visa fee`
        )}`,
      },
      {
        type: 'official',
        label: `${country} official healthcare / insurance for international students (search)`,
        url: `https://www.google.com/search?q=${encodeURIComponent(
          `${country} mandatory health insurance for international students`
        )}`,
      },
      {
        type: 'flights',
        label: 'Flight prices (Skyscanner search)',
        url: `https://www.skyscanner.net/transport/flights-to/${encodeURIComponent(
          country
        )}/`,
      },
      {
        type: 'community',
        label: 'Reddit threads on student living costs',
        url: redditSearchUrl,
      },
    ];

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content:
              'You are an assistant that summarises up-to-date-looking but approximate cost information for international students. Use the Reddit threads provided mainly for monthly living cost ranges and student lifestyle details. For visa fees, mandatory insurance, and flights, use your general knowledge and clearly warn that exact figures must be checked on official websites. Never claim to have literally browsed any website; instead, say that these are approximate ranges and always provide clear disclaimers.',
          },
          {
            role: 'user',
            content: `
Location: ${locationLabel}

Reddit living-cost threads (original post + top comments text, last ~12 months):
${JSON.stringify(livingCostThreads, null, 2)}

From this, produce a concise JSON summary of:

1. Visa & mandatory fees:
   - typical student visa application fee range in local currency and an approximate equivalent in USD
   - any mandatory healthcare / insurance or immigration health surcharge that must be paid before or during studies
   - high-level notes on when these are usually paid

2. Pre-arrival costs (outside tuition):
   - initial accommodation deposit / first month rent range
   - approximate one-way flight cost range from common source regions (e.g. South Asia to Europe/North America), in USD
   - other common pre-arrival expenses (e.g. visa biometrics, translations, medical checks, proof-of-funds requirements)

3. Monthly living expenses (from Reddit threads + typical knowledge):
   - a low, typical, and high monthly budget in local currency and USD
   - short bullet points summarising what drives costs up/down (city size, sharing, cooking vs eating out, etc.)
   - a short summary paragraph of what students on Reddit say about affordability and lifestyle
   - a short statement about evidence strength (few vs many posts, mixed opinions vs consistent).

4. Part-time work for students:
   - typical legal maximum working hours per week during term time and during vacations for international students
   - a typical part-time hourly wage range in local currency and an approximate equivalent in USD for common student jobs (e.g. retail, hospitality)
   - short notes on how realistic it is to cover living costs from part-time work alone, based on Reddit sentiment and typical policies.

5. Disclaimers:
   - Clear text reminding the user that all numbers are approximate and can change quickly
   - Encourage them to verify all fees on official government and university websites, and to read recent Reddit threads.

Respond ONLY as strict JSON with this shape:
{
  "location": string,
  "visa": {
    "feeRangeLocal": string,
    "feeRangeUsd": string,
    "insuranceOrHealthCharge": string,
    "notes": string
  },
  "preArrival": {
    "accommodationDeposit": string,
    "flightRangeUsd": string,
    "otherUpfrontCosts": string
  },
  "living": {
    "monthlyRangeLocal": string,
    "monthlyRangeUsd": string,
    "drivers": string[],
    "redditSummary": string,
    "evidenceStrength": string
  },
  "partTime": {
    "maxHoursPerWeekTerm": string,
    "maxHoursPerWeekVacation": string,
    "hourlyRangeLocal": string,
    "hourlyRangeUsd": string,
    "notes": string
  },
  "disclaimer": string
}
          `,
          },
        ],
        temperature: 0.4,
      }),
    });

    if (!groqRes.ok) {
      console.error('Groq budget-info error:', groqRes.status, await groqRes.text());
      return res.status(500).json({ error: 'Groq budget-info failed' });
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      console.error('Budget-info parse error:', err, 'content:', content);
      return res.status(500).json({ error: 'Could not parse budget-info response' });
    }

    return res.json({
      ...parsed,
      sources,
    });
  } catch (err) {
    console.error('Backend budget-info error:', err);
    return res.status(500).json({ error: 'Failed to generate budget information' });
  }
});

// Overall one-look insight for international applicants (reviews + rough costs + worth-it verdict)
app.post('/api/overall-insight', async (req, res) => {
  const { university, country } = req.body || {};

  if (!university || !university.trim() || !country || !country.trim()) {
    return res.status(400).json({ error: 'University and country are required' });
  }

  const uniName = university.trim();
  const countryName = country.trim();

  try {
    // Fetch Reddit data for the university and living costs for the country
    let uniThreads = [];
    let livingCostThreads = [];

    try {
      uniThreads = await fetchRedditPosts(uniName);
    } catch (err) {
      console.error('overall-insight reddit university error:', err);
      uniThreads = [];
    }

    try {
      livingCostThreads = await fetchRedditLivingCosts(countryName);
    } catch (err) {
      console.error('overall-insight reddit living-cost error:', err);
      livingCostThreads = [];
    }

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content:
              'You are advising international students on studying abroad. Given Reddit-style threads about a university and about student living costs in a country, give a super short, on-point summary – no long paragraphs, just crisp phrases. Focus on what applicants care about: fees + living cost ballpark in INR, USD, and EUR; placements / ROI; acceptance rate (infer from all available data: Reddit, and general knowledge from sources like GradCafe, Admit.com, etc.); and whether the vibe from students is positive or mixed. Always provide rough yearly cost estimates in all three currencies (convert from local currency if needed). For acceptance rate, synthesize what is commonly reported or discussed online and note that it varies by program and is not official unless stated.',
          },
          {
            role: 'user',
            content: `
University: ${uniName}
Country: ${countryName}

Reddit threads about the university (post + comments):
${JSON.stringify(uniThreads, null, 2)}

Reddit threads about student living costs for the country:
${JSON.stringify(livingCostThreads, null, 2)}

For an international applicant, give a VERY SHORT JSON-only answer in this exact shape. Use compact, WhatsApp-style phrases, not essays:
{
  "university": string,            // cleaned display name
  "country": string,
  "isWorthItVerdict": string,      // 1 short line, e.g. "Worth it if you get some scholarship" or "Only worth it for top CS/engg profiles"
  "reviewMood": string,            // 1 short line about Reddit sentiment: "Mostly positive", "Mixed", "Many complaints about admin", etc.
  "yearlyCostInr": string,         // rough all-in yearly budget in INR, e.g. "₹18–22L (tuition + living)"
  "yearlyCostUsd": string,        // rough all-in yearly budget in USD, e.g. "$25–30k (tuition + living)"
  "yearlyCostEur": string,         // rough all-in yearly budget in EUR, e.g. "€22–28k (tuition + living)"
  "acceptanceRate": string,        // 1–2 lines: best estimate from Reddit + common sources (GradCafe, Admit.com, etc.), e.g. "~15–25% for CS; often cited online, varies by program"
  "difficultyLevel": string,       // 1 line: "Safe option", "Competitive", or "Very competitive" with 3–4 words of context
  "quickNotes": string[],          // 3–4 bullet-style very short notes, max 10–12 words each
  "similarUniversities": [         // 3–5 unis similar in prestige, focus, or location (same or comparable country). Use full names.
    { "name": string, "country": string }
  ]
}

Suggest similar universities based on the data and your knowledge (same country or region, similar reputation/programs). Be honest if data is weak, but still give a rough idea.
Respond ONLY with JSON, no extra text.
          `,
          },
        ],
        temperature: 0.4,
      }),
    });

    if (!groqRes.ok) {
      console.error('Groq overall-insight error:', groqRes.status, await groqRes.text());
      return res.status(500).json({ error: 'Failed to generate overall insight' });
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    let parsed;
    try {
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanedContent);
    } catch (err) {
      console.error('overall-insight parse error:', err, 'content:', content);
      return res.status(500).json({ error: 'Could not parse overall insight response' });
    }

    // Normalize similar universities: ensure array of { name, country }
    const rawSimilar = parsed.similarUniversities;
    if (Array.isArray(rawSimilar)) {
      parsed.similarUniversities = rawSimilar
        .filter((s) => s && typeof s.name === 'string' && s.name.trim())
        .map((s) => ({ name: s.name.trim(), country: (s.country && String(s.country).trim()) || countryName }));
    } else {
      parsed.similarUniversities = [];
    }

    // Also expose a couple of links so the UI can point users to raw sources
    const sources = [
      {
        type: 'reddit',
        label: `Reddit reviews about ${uniName}`,
        url: `https://www.reddit.com/search/?q=${encodeURIComponent(`${uniName} university student`)}`,
      },
      {
        type: 'living_costs',
        label: `Reddit threads on student living costs in ${countryName}`,
        url: `https://www.reddit.com/search/?q=${encodeURIComponent(
          `${countryName} student living costs`
        )}`,
      },
    ];

    return res.json({
      ...parsed,
      sources,
    });
  } catch (err) {
    console.error('Backend overall-insight error:', err);
    return res.status(500).json({ error: 'Failed to generate overall insight' });
  }
});

// Required documents for student visa by country
app.post('/api/required-documents', async (req, res) => {
  const { country } = req.body || {};

  if (!country || !country.trim()) {
    return res.status(400).json({ error: 'Country is required' });
  }

  try {
    const sources = [
      {
        type: 'official',
        label: `${country} official student visa document requirements`,
        url: `https://www.google.com/search?q=${encodeURIComponent(
          `${country} official student visa required documents`
        )}`,
      },
      {
        type: 'official',
        label: `${country} embassy/consulate student visa page`,
        url: `https://www.google.com/search?q=${encodeURIComponent(
          `${country} embassy student visa application documents`
        )}`,
      },
    ];

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert on international student visa requirements. Provide accurate, comprehensive lists of required documents for student visa applications. Always include common requirements like academic transcripts, language test scores, financial proof, passport, photos, and country-specific requirements. Format your response as valid JSON.',
          },
          {
            role: 'user',
            content: `Provide a comprehensive list of all required documents for international students applying for a student visa to ${country}.

Include:
1. A brief summary (2-3 sentences) about the document requirements for this country
2. A complete checklist of all required documents with brief descriptions
3. Organize documents by category if helpful (e.g., Academic, Financial, Identity, Health, etc.)
4. Any important notes or special requirements specific to this country
5. Common document formats accepted (PDF, original copies, certified translations, etc.)

Respond ONLY as strict JSON with this structure:
{
  "country": "${country}",
  "summary": "Brief 2-3 sentence summary of document requirements",
  "documents": [
    {
      "name": "Document name",
      "description": "Brief description of what this document is and why it's needed",
      "notes": "Optional: any special notes about this document"
    }
  ],
  "categories": {
    "Academic Documents": [
      {
        "name": "Document name",
        "description": "Description"
      }
    ],
    "Financial Documents": [...],
    "Identity Documents": [...],
    "Other Documents": [...]
  },
  "importantNotes": [
    "Important note 1",
    "Important note 2"
  ]
}

Be thorough and include all standard requirements plus any country-specific documents.`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!groqRes.ok) {
      console.error('Groq required-documents error:', groqRes.status, await groqRes.text());
      return res.status(500).json({ error: 'Failed to fetch document requirements' });
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    let parsed;
    try {
      // Clean up the content in case there are markdown code blocks
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanedContent);
    } catch (err) {
      console.error('Required-documents parse error:', err, 'content:', content);
      return res.status(500).json({ error: 'Could not parse document requirements response' });
    }

    return res.json({
      ...parsed,
      sources,
    });
  } catch (err) {
    console.error('Backend required-documents error:', err);
    return res.status(500).json({ error: 'Failed to generate document requirements' });
  }
});

// Compare universities (up to 3)
app.post('/api/compare-universities', async (req, res) => {
  const { universities } = req.body || {};

  if (!universities || !Array.isArray(universities) || universities.length < 2) {
    return res.status(400).json({ error: 'At least 2 universities are required' });
  }

  if (universities.length > 3) {
    return res.status(400).json({ error: 'Maximum 3 universities can be compared' });
  }

  const validUniversities = universities.filter((uni) => uni && uni.trim());

  if (validUniversities.length < 2) {
    return res.status(400).json({ error: 'At least 2 valid university names are required' });
  }

  try {
    // Light Reddit snippets per university (saves tokens)
    const redditDataPromises = validUniversities.map((uni) =>
      fetchRedditPostsLight(uni).catch((err) => {
        console.error(`Reddit fetch error for ${uni}:`, err);
        return [];
      })
    );

    const allRedditData = await Promise.all(redditDataPromises);

    const contextText = validUniversities
      .map((uni, idx) => {
        const snippets = allRedditData[idx] || [];
        const text = snippets.map((s) => `"${s.title}" ${(s.snippet || '').slice(0, 180)}`).join(' | ');
        return `${idx + 1}. ${uni}: ${text || 'No Reddit data'}`;
      })
      .join('\n\n');

    // Build sources array
    const sources = [];
    validUniversities.forEach((uni) => {
      sources.push({
        type: 'reddit',
        label: `Reddit discussions about ${uni}`,
        url: `https://www.reddit.com/search/?q=${encodeURIComponent(`${uni} university student`)}`,
      });
      sources.push({
        type: 'official',
        label: `${uni} official website`,
        url: `https://www.google.com/search?q=${encodeURIComponent(`${uni} official website`)}`,
      });
    });

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content:
              'Compare universities from Reddit snippets and knowledge. Reply only with valid JSON. Use exactly one short sentence per description. Keep summary and insights to one sentence each.',
          },
          {
            role: 'user',
            content: `Compare these ${validUniversities.length} universities (one sentence per answer):

${contextText}

Criteria: 1) Academic Quality & Reputation 2) Student Life & Campus Experience 3) Career Outcomes & Job Prospects 4) Value for Money.

For each university and each criterion: rating 1-10 and ONE short sentence. Then one-sentence overall summary and 2 short insight sentences.

JSON only:
{
  "comparison": [
    { "name": "University name", "points": [
      { "rating": 8, "description": "One sentence." },
      { "rating": 7, "description": "One sentence." },
      { "rating": 9, "description": "One sentence." },
      { "rating": 8, "description": "One sentence." }
    ]}
  ],
  "comparisonPoints": [
    { "name": "Academic Quality & Reputation" },
    { "name": "Student Life & Campus Experience" },
    { "name": "Career Outcomes & Job Prospects" },
    { "name": "Value for Money" }
  ],
  "summary": "One sentence overall.",
  "insights": ["Short insight 1.", "Short insight 2."]
}`,
          },
        ],
        temperature: 0.4,
      }),
    });

    if (!groqRes.ok) {
      console.error('Groq compare-universities error:', groqRes.status, await groqRes.text());
      return res.status(500).json({ error: 'Failed to compare universities' });
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    let parsed;
    try {
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanedContent);
    } catch (err) {
      console.error('Compare-universities parse error:', err, 'content:', content);
      return res.status(500).json({ error: 'Could not parse comparison response' });
    }

    return res.json({
      ...parsed,
      sources,
    });
  } catch (err) {
    console.error('Backend compare-universities error:', err);
    return res.status(500).json({ error: 'Failed to generate comparison' });
  }
});

const PORT = process.env.PORT || 4000;

// Serve frontend build (after API routes so they keep working)
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend API listening on http://localhost:${PORT}`);
});

