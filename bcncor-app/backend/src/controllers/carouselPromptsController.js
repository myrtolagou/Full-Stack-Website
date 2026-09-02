/**
 * controllers/carouselPromptsController.js
 *
 * Stores and retrieves the AI prompts used for carousel generation.
 * Prompts are kept in memory (no DB yet).
 *
 * Variables available in generationPrompt:
 *   {title}       — article title
 *   {fullText}    — article body
 *   {slidesSchema} — auto-generated slide schema (injected at runtime)
 */

const DEFAULT_SYSTEM_PROMPT = `
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

const DEFAULT_GENERATION_PROMPT = `Basándote en el siguiente artículo del blog de BcnCor, genera contenido para redes sociales.

TÍTULO: {title}

TEXTO COMPLETO:
{fullText}

Genera y devuelve ÚNICAMENTE este JSON (sin markdown, sin backticks):
{
  "slides": [
    {slidesSchema}
  ],
  "linkedin": "post completo de LinkedIn (300-500 palabras, en español, secciones en negrita con **, bullets con →)",
  "instagram": "caption de Instagram (5-7 líneas cortas, emojis, CTA claro)",
  "hashtags": "#hashtag1 #hashtag2 ... (8-12 hashtags relevantes en español)",
  "cta": "CTA corto de 1-2 frases para usar en cualquier plataforma",
  "qa_notes": "Notas breves de QA: verificación de datos, tono, consistencia"
}

CRÍTICO para los slides: Cada slide tiene un esquema exacto. SOLO incluye los campos que aparecen en ese esquema. Si un slide NO tiene "body" en su esquema, NO incluyas el campo "body". Si NO tiene "subtitle", NO lo incluyas. Respeta EXACTAMENTE los campos de cada slide — ni más ni menos.`;

const promptSettings = {
  systemPrompt:     DEFAULT_SYSTEM_PROMPT,
  generationPrompt: DEFAULT_GENERATION_PROMPT,
  maxTokens:        4096,
  language:         'spanish',
};

function getPromptSettings(req, res) {
  res.json(promptSettings);
}

function savePromptSettings(req, res) {
  const { systemPrompt, generationPrompt, maxTokens, language } = req.body;
  if (systemPrompt     !== undefined) promptSettings.systemPrompt     = systemPrompt;
  if (generationPrompt !== undefined) promptSettings.generationPrompt = generationPrompt;
  if (maxTokens        !== undefined) promptSettings.maxTokens        = maxTokens;
  if (language         !== undefined) promptSettings.language         = language;
  res.json({ ok: true, promptSettings });
}

module.exports = { getPromptSettings, savePromptSettings, promptSettings };
