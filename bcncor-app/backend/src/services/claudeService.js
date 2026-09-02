/**
 * services/claudeService.js
 *
 * Calls the Anthropic Claude API to generate social media content
 * from a scraped BcnCor blog article.
 *
 * Exported functions:
 *  generateContent(title, fullText, template) → { linkedin, instagram, slides, hashtags, cta, qa_notes }
 *
 * Template format:
 *  [{ slide: 1, hook: true, title: true, subtitle: true, body: false }, ...]
 */

const Anthropic = require('@anthropic-ai/sdk');
const { promptSettings: carouselPromptSettings } = require('../controllers/carouselPromptsController');
const { getAnthropicKey } = require('../controllers/settingsController');

// ── Default carousel template ─────────────────────────────────────────────────

const DEFAULT_TEMPLATE = [
  { slide: 1,     hook: true,  title: true,  subtitle: true,  body: false },
  { slide: 2,     hook: true,  title: true,  subtitle: true,  body: true  },
  { slide: 3,     hook: true,  title: true,  subtitle: true,  body: true  },
  { slide: 4,     hook: true,  title: true,  subtitle: true,  body: true  },
  { slide: 5,     hook: true,  title: true,  subtitle: false, body: true  },
  { slide: 'CTA', hook: false, title: false, subtitle: false, body: true  },
];

// ── Brand system prompt ───────────────────────────────────────────────────────

const BRAND_PROMPT = `
Eres el motor de contenido de BcnCor, una firma boutique de servicios financieros para startups y PYMEs innovadoras con más de 20 años de experiencia.

AUDIENCIA OBJETIVO:
- Startups tech con MRR +30K€ buscando financiación
- CTOs y CFOs de empresas en crecimiento
- Fundadores en rondas seed, Series A o B
- PYMEs innovadoras que buscan financiación pública o privada

TONO Y VOZ:
- Profesional pero cercano — como un socio de confianza, no un banco
- Técnico sin ser críptico — explica conceptos complejos con claridad
- Autoridad desde la experiencia — "lo hemos visto", "trabajamos con"
- Empático — entendemos los dolores del founder
- Nunca genérico, siempre específico

SERVICIOS DE BCNCOR (mencionar con precisión):
- CFO Externo: rol de director financiero externo para startups
- Financiación Pública: ENISA, Torres Quevedo, CDTI, PERTE, SETT
- Financiación Privada: rondas seed, Series A/B, inversores ángel
- Servicios Legales: estructuración legal y societaria
- Lead Angel: actividad de venture capital propio

REGLAS DE CONTENIDO:
- No inventar datos ni estadísticas no presentes en el artículo
- Fidelidad total a las fuentes — si el artículo dice X, el contenido dice X
- Específico, no genérico — evitar frases vacías
- CTA siempre orientado a conversación o contacto con BcnCor

ESTILO CAROUSEL (estilo Studio Bridges):
- Hook: 3-5 palabras en mayúsculas, impactante, sin verbo auxiliar — ej: "EL CDTI FINANCIA TU LAB"
- Title: 6-10 palabras, frase directa y clara — ej: "Hasta el 75% para infraestructuras de ensayo"
- Subtitle: 10-15 palabras, contexto adicional — ej: "Válido para centros tecnológicos, incubadoras y parques científicos"
- Body: 2-3 frases narrativas cortas, sin bullets, sin emojis — máximo 40 palabras
- Sin emojis en ningún campo del carousel
- Sin bullets ni guiones en el carousel

IMPORTANTE: Responde ÚNICAMENTE con JSON válido, sin texto adicional ni bloques de código markdown.
`.trim();

// ── Build slide instruction from template ─────────────────────────────────────

function buildSlideInstruction(slide) {
  const fields = [];
  if (slide.hook)     fields.push(`"hook": "3-5 palabras en MAYÚSCULAS, impactante"`);
  if (slide.title)    fields.push(`"title": "6-10 palabras, directo y claro"`);
  if (slide.subtitle) fields.push(`"subtitle": "10-15 palabras, contexto adicional"`);
  if (slide.body)     fields.push(`"body": "2-3 frases narrativas cortas, máximo 40 palabras"`);
  return `{ "slide": ${typeof slide.slide === 'string' ? `"${slide.slide}"` : slide.slide}, ${fields.join(', ')} }`;
}

// ── Main function ─────────────────────────────────────────────────────────────

async function generateContent(title, fullText, template = DEFAULT_TEMPLATE) {
  const client = new Anthropic({ apiKey: await getAnthropicKey() });

  const slideInstructions = template.map(buildSlideInstruction).join(',\n    ');

  const systemPrompt = carouselPromptSettings.systemPrompt || BRAND_PROMPT;
  const userMessage  = (carouselPromptSettings.generationPrompt || '')
    .replace('{title}', title)
    .replace('{fullText}', fullText)
    .replace('{slidesSchema}', slideInstructions)
    || `
Basándote en el siguiente artículo del blog de BcnCor, genera contenido para redes sociales.

TÍTULO: ${title}

TEXTO COMPLETO:
${fullText}

Genera y devuelve ÚNICAMENTE este JSON (sin markdown, sin backticks):
{
  "slides": [
    ${slideInstructions}
  ],
  "linkedin": "post completo de LinkedIn (300-500 palabras, en español, secciones en negrita con **, bullets con →)",
  "instagram": "caption de Instagram (5-7 líneas cortas, emojis, CTA claro)",
  "hashtags": "#hashtag1 #hashtag2 ... (8-12 hashtags relevantes en español)",
  "cta": "CTA corto de 1-2 frases para usar en cualquier plataforma",
  "qa_notes": "Notas breves de QA: verificación de datos, tono, consistencia"
}

CRÍTICO para los slides: Cada slide tiene un esquema exacto. SOLO incluye los campos que aparecen en ese esquema. Si un slide NO tiene "body" en su esquema, NO incluyas el campo "body". Si NO tiene "subtitle", NO lo incluyas. Respeta EXACTAMENTE los campos de cada slide — ni más ni menos.
`.trim();

  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: carouselPromptSettings.maxTokens || 4096,
    messages:   [{ role: 'user', content: userMessage }],
    system:     systemPrompt,
  });

  const rawText = response.content[0]?.text ?? '';

  const jsonText = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return {
      linkedin:  rawText,
      instagram: '',
      slides:    [],
      hashtags:  '',
      cta:       '',
      qa_notes:  'JSON parse failed — raw response returned in linkedin field',
    };
  }

  return {
    linkedin:  parsed.linkedin  || '',
    instagram: parsed.instagram || '',
    slides:    Array.isArray(parsed.slides) ? parsed.slides : [],
    hashtags:  parsed.hashtags  || '',
    cta:       parsed.cta       || '',
    qa_notes:  parsed.qa_notes  || '',
  };
}

module.exports = { generateContent, DEFAULT_TEMPLATE };