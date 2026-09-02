import { useEffect, useState } from 'react';
import { useSetTopbar } from '../../context/TopbarContext';
import { BASE_URL } from '../../config';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
);

const F   = "'Inter', system-ui, sans-serif";
const NAV = '#1a3a5c';

const CH = {
  linkedin:  '#2D6A9F',
  instagram: '#A8405A',
  blog:      '#1A7A5A',
  other:     '#4A5568',
};

// ── Mock datasets ──────────────────────────────────────────────────────────────

const PERIODS = {
  month: {
    label: 'March 2026',
    metrics: {
      impressions: { value: '48,200',  change: +12.4 },
      followers:   { value: '312',     change: +8.7  },
      posts:       { value: '18',      change: -5.3  },
      leads:       { value: '34',      change: +22.1 },
      cpl:         { value: '€41',     change: -9.8  },
    },
    lineLabels: ['1 Mar', '5 Mar', '10 Mar', '15 Mar', '20 Mar', '25 Mar', '30 Mar'],
    lineData: {
      linkedin:  [3200, 4800, 5100, 6200, 7100, 7800, 9400],
      instagram: [1100, 1400, 1600, 2000, 2100, 2300, 2600],
      blog:      [800,  900,  950,  1100, 1200, 1350, 1500],
    },
    doughnut: [57, 21, 14, 8],
    barLabels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
    barData: {
      carousels: [4, 5, 3, 6],
      blog:      [2, 1, 2, 1],
      instagram: [3, 4, 2, 3],
    },
    roiLabels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
    roiRevenue: [8200, 11400, 9800, 13600],
    roiSpend:   [1400, 1400, 1400, 1400],
    posts: [
      { title: 'Nueva línea CDTI: ayudas reembolsables para I+D', channel: 'linkedin',  date: '22 Mar', impressions: '8,420', engagement: '4.2%', leads: 9  },
      { title: 'VC europeo rebota en Q1 2026 — ¿qué significa?', channel: 'linkedin',  date: '19 Mar', impressions: '6,140', engagement: '3.8%', leads: 7  },
      { title: 'CFO externo: cuándo y por qué tu PYME lo necesita', channel: 'instagram', date: '18 Mar', impressions: '4,310', engagement: '5.1%', leads: 5  },
      { title: '5 métricas que todo CFO de startup debe monitorizar', channel: 'blog',    date: '15 Mar', impressions: '3,890', engagement: '6.4%', leads: 4  },
      { title: 'Financiación pública vs privada en 2026',           channel: 'linkedin',  date: '12 Mar', impressions: '3,240', engagement: '3.1%', leads: 3  },
    ],
  },

  quarter: {
    label: 'Q1 2026 — Jan, Feb, Mar',
    metrics: {
      impressions: { value: '142,600', change: +18.3 },
      followers:   { value: '874',     change: +14.2 },
      posts:       { value: '54',      change: +3.8  },
      leads:       { value: '98',      change: +31.4 },
      cpl:         { value: '€37',     change: -14.2 },
    },
    lineLabels: ['Ene', 'Feb', 'Mar'],
    lineData: {
      linkedin:  [28400, 36200, 47800],
      instagram: [9200,  11400, 14800],
      blog:      [5100,  6400,  7800],
    },
    doughnut: [59, 19, 14, 8],
    barLabels: ['Enero', 'Febrero', 'Marzo'],
    barData: {
      carousels: [14, 16, 18],
      blog:      [5,  6,  6],
      instagram: [10, 11, 12],
    },
    roiLabels: ['Enero', 'Febrero', 'Marzo'],
    roiRevenue: [38200, 44100, 43000],
    roiSpend:   [5600,  5600,  5600],
    posts: [
      { title: 'Nueva línea CDTI: ayudas reembolsables para I+D', channel: 'linkedin',  date: '22 Mar', impressions: '8,420', engagement: '4.2%', leads: 9  },
      { title: 'El ecosistema startup español alcanza €4.2B',      channel: 'blog',      date: '14 Feb', impressions: '7,210', engagement: '5.8%', leads: 8  },
      { title: 'VC europeo rebota en Q1 2026',                     channel: 'linkedin',  date: '19 Mar', impressions: '6,140', engagement: '3.8%', leads: 7  },
      { title: 'Financiación sin equity: las mejores alternativas', channel: 'instagram', date: '28 Ene', impressions: '5,980', engagement: '4.9%', leads: 6  },
      { title: 'CFO externo: cuándo y por qué tu PYME lo necesita', channel: 'instagram', date: '18 Mar', impressions: '4,310', engagement: '5.1%', leads: 5  },
    ],
  },

  year: {
    label: '2026 — Enero a Marzo',
    metrics: {
      impressions: { value: '142,600', change: +42.1 },
      followers:   { value: '874',     change: +38.6 },
      posts:       { value: '54',      change: +12.5 },
      leads:       { value: '98',      change: +58.2 },
      cpl:         { value: '€37',     change: -22.8 },
    },
    lineLabels: ['Ene', 'Feb', 'Mar'],
    lineData: {
      linkedin:  [28400, 36200, 47800],
      instagram: [9200,  11400, 14800],
      blog:      [5100,  6400,  7800],
    },
    doughnut: [59, 19, 14, 8],
    barLabels: ['Enero', 'Febrero', 'Marzo'],
    barData: {
      carousels: [14, 16, 18],
      blog:      [5,  6,  6],
      instagram: [10, 11, 12],
    },
    roiLabels: ['Enero', 'Febrero', 'Marzo'],
    roiRevenue: [38200, 44100, 43000],
    roiSpend:   [5600,  5600,  5600],
    posts: [
      { title: 'Nueva línea CDTI: ayudas reembolsables para I+D', channel: 'linkedin',  date: '22 Mar', impressions: '8,420', engagement: '4.2%', leads: 9  },
      { title: 'El ecosistema startup español alcanza €4.2B',      channel: 'blog',      date: '14 Feb', impressions: '7,210', engagement: '5.8%', leads: 8  },
      { title: 'VC europeo rebota en Q1 2026',                     channel: 'linkedin',  date: '19 Mar', impressions: '6,140', engagement: '3.8%', leads: 7  },
      { title: 'Financiación sin equity: las mejores alternativas', channel: 'instagram', date: '28 Ene', impressions: '5,980', engagement: '4.9%', leads: 6  },
      { title: 'CFO externo: cuándo y por qué tu PYME lo necesita', channel: 'instagram', date: '18 Mar', impressions: '4,310', engagement: '5.1%', leads: 5  },
    ],
  },
};

const MONTHS = [
  { key: 'mar26', label: 'March 2026',   data: PERIODS.month },
  {
    key: 'feb26', label: 'February 2026',
    data: {
      label: 'February 2026',
      metrics: {
        impressions: { value: '39,100', change: +6.2  },
        followers:   { value: '281',    change: +4.1  },
        posts:       { value: '19',     change: +5.6  },
        leads:       { value: '28',     change: +12.0 },
        cpl:         { value: '€45',    change: +4.7  },
      },
      lineLabels: ['1 Feb', '5 Feb', '10 Feb', '15 Feb', '20 Feb', '25 Feb'],
      lineData: { linkedin: [3100,3800,4200,5100,5600,6200], instagram: [900,1100,1300,1500,1700,1900], blog: [700,800,850,950,1050,1150] },
      doughnut: [55, 22, 15, 8],
      barLabels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
      barData: { carousels: [3,4,4,5], blog: [2,1,2,1], instagram: [2,3,3,3] },
      roiLabels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
      roiRevenue: [7400,9200,8600,10800], roiSpend: [1400,1400,1400,1400],
      posts: [
        { title: 'El ecosistema startup español alcanza €4.2B',      channel: 'blog',      date: '14 Feb', impressions: '7,210', engagement: '5.8%', leads: 8 },
        { title: 'Inveready lanza fondo de €80M para deeptech',       channel: 'linkedin',  date: '10 Feb', impressions: '5,640', engagement: '3.9%', leads: 6 },
        { title: 'Subvenciones ENISA 2026: guía completa',            channel: 'linkedin',  date: '6 Feb',  impressions: '4,120', engagement: '4.4%', leads: 5 },
        { title: 'Cómo preparar tu startup para una ronda seed',      channel: 'instagram', date: '20 Feb', impressions: '3,980', engagement: '5.2%', leads: 4 },
        { title: '10 errores al buscar financiación pública',         channel: 'blog',      date: '25 Feb', impressions: '3,410', engagement: '6.1%', leads: 3 },
      ],
    },
  },
  {
    key: 'jan26', label: 'January 2026',
    data: {
      label: 'January 2026',
      metrics: {
        impressions: { value: '34,800', change: +2.1  },
        followers:   { value: '281',    change: +1.8  },
        posts:       { value: '17',     change: -2.9  },
        leads:       { value: '22',     change: +5.6  },
        cpl:         { value: '€51',    change: +8.3  },
      },
      lineLabels: ['1 Ene', '5 Ene', '10 Ene', '15 Ene', '20 Ene', '25 Ene', '31 Ene'],
      lineData: { linkedin: [2800,3200,3600,4100,4600,5100,5800], instagram: [800,900,1000,1200,1300,1450,1600], blog: [600,650,700,780,840,920,1000] },
      doughnut: [54, 23, 15, 8],
      barLabels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
      barData: { carousels: [3,3,4,4], blog: [1,2,1,1], instagram: [2,2,3,3] },
      roiLabels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
      roiRevenue: [6800,8200,7900,9400], roiSpend: [1400,1400,1400,1400],
      posts: [
        { title: 'Financiación sin equity: las mejores alternativas', channel: 'instagram', date: '28 Ene', impressions: '5,980', engagement: '4.9%', leads: 6 },
        { title: 'CDTI 2026: novedades en ayudas para I+D+i',         channel: 'linkedin',  date: '21 Ene', impressions: '4,880', engagement: '3.7%', leads: 5 },
        { title: 'Cómo valorar tu startup antes de una ronda',        channel: 'blog',      date: '15 Ene', impressions: '3,920', engagement: '5.5%', leads: 4 },
        { title: 'Due diligence: qué esperan los inversores',         channel: 'linkedin',  date: '8 Ene',  impressions: '3,410', engagement: '3.2%', leads: 3 },
        { title: 'Métricas SaaS que interesan a los VCs',             channel: 'instagram', date: '24 Ene', impressions: '2,980', engagement: '4.6%', leads: 2 },
      ],
    },
  },
  {
    key: 'dec25', label: 'December 2025',
    data: {
      label: 'December 2025',
      metrics: {
        impressions: { value: '31,200', change: -4.1  },
        followers:   { value: '198',    change: -1.2  },
        posts:       { value: '14',     change: -12.5 },
        leads:       { value: '18',     change: -8.0  },
        cpl:         { value: '€58',    change: +14.1 },
      },
      lineLabels: ['1 Dic', '5 Dic', '10 Dic', '15 Dic', '20 Dic', '25 Dic'],
      lineData: { linkedin: [2400,2800,3100,3600,3900,4200], instagram: [700,800,850,950,1050,1100], blog: [500,550,580,640,690,730] },
      doughnut: [52, 24, 16, 8],
      barLabels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
      barData: { carousels: [2,3,3,2], blog: [1,1,1,1], instagram: [2,2,2,1] },
      roiLabels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
      roiRevenue: [5800,6900,6200,7100], roiSpend: [1400,1400,1400,1400],
      posts: [
        { title: 'Balance 2025: el año del VC europeo',              channel: 'blog',      date: '29 Dic', impressions: '4,120', engagement: '5.1%', leads: 4 },
        { title: 'Predicciones de financiación para 2026',           channel: 'linkedin',  date: '22 Dic', impressions: '3,840', engagement: '3.5%', leads: 3 },
        { title: 'Startups que cerraron ronda en diciembre',         channel: 'instagram', date: '18 Dic', impressions: '2,910', engagement: '4.2%', leads: 3 },
        { title: 'Guía rápida: ICO Empresas 2025',                   channel: 'linkedin',  date: '10 Dic', impressions: '2,640', engagement: '2.9%', leads: 2 },
        { title: 'Por qué el Q4 es el peor momento para captar',     channel: 'instagram', date: '5 Dic',  impressions: '2,180', engagement: '3.8%', leads: 1 },
      ],
    },
  },
  {
    key: 'nov25', label: 'November 2025',
    data: {
      label: 'November 2025',
      metrics: {
        impressions: { value: '33,400', change: +7.8  },
        followers:   { value: '224',    change: +6.4  },
        posts:       { value: '16',     change: +6.7  },
        leads:       { value: '20',     change: +11.1 },
        cpl:         { value: '€52',    change: -3.7  },
      },
      lineLabels: ['1 Nov', '5 Nov', '10 Nov', '15 Nov', '20 Nov', '25 Nov'],
      lineData: { linkedin: [2600,3000,3400,3900,4200,4600], instagram: [750,880,960,1050,1120,1200], blog: [540,590,630,680,730,780] },
      doughnut: [53, 22, 16, 9],
      barLabels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
      barData: { carousels: [3,3,4,3], blog: [1,1,2,1], instagram: [2,2,2,2] },
      roiLabels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
      roiRevenue: [6400,7600,7200,8200], roiSpend: [1400,1400,1400,1400],
      posts: [
        { title: 'Crescenta amplía su base de inversores minoristas', channel: 'blog',      date: '24 Nov', impressions: '4,680', engagement: '5.4%', leads: 5 },
        { title: 'Cómo estructurar un cap table antes de escalar',    channel: 'linkedin',  date: '19 Nov', impressions: '3,920', engagement: '3.6%', leads: 4 },
        { title: 'Newsletter de financiación: top deals de noviembre', channel: 'instagram', date: '12 Nov', impressions: '3,140', engagement: '4.8%', leads: 3 },
        { title: 'Venture debt: la alternativa al equity que debes conocer', channel: 'linkedin', date: '7 Nov', impressions: '2,860', engagement: '3.1%', leads: 3 },
        { title: 'ENISA Jóvenes Emprendedores: guía práctica 2025',   channel: 'blog',      date: '3 Nov',  impressions: '2,420', engagement: '5.8%', leads: 2 },
      ],
    },
  },
  {
    key: 'oct25', label: 'October 2025',
    data: {
      label: 'October 2025',
      metrics: {
        impressions: { value: '30,900', change: +4.3  },
        followers:   { value: '210',    change: +3.9  },
        posts:       { value: '15',     change: 0     },
        leads:       { value: '18',     change: +5.9  },
        cpl:         { value: '€54',    change: -1.8  },
      },
      lineLabels: ['1 Oct', '5 Oct', '10 Oct', '15 Oct', '20 Oct', '25 Oct', '31 Oct'],
      lineData: { linkedin: [2400,2700,3000,3400,3700,4000,4300], instagram: [680,760,840,930,1010,1080,1150], blog: [500,540,570,610,650,690,730] },
      doughnut: [52, 23, 16, 9],
      barLabels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
      barData: { carousels: [3,3,3,3], blog: [1,1,1,1], instagram: [2,2,2,2] },
      roiLabels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
      roiRevenue: [5900,6800,6400,7600], roiSpend: [1400,1400,1400,1400],
      posts: [
        { title: 'Inveready y Seaya: las gestoras más activas de octubre', channel: 'linkedin',  date: '28 Oct', impressions: '4,210', engagement: '3.8%', leads: 5 },
        { title: 'Qué es el MRR y cómo optimizarlo en tu SaaS',           channel: 'blog',      date: '21 Oct', impressions: '3,640', engagement: '5.6%', leads: 4 },
        { title: 'Rondas pre-seed en España: estado del mercado',          channel: 'instagram', date: '14 Oct', impressions: '2,980', engagement: '4.4%', leads: 3 },
        { title: 'Cómo preparar tu pitch deck para inversores',            channel: 'linkedin',  date: '8 Oct',  impressions: '2,740', engagement: '3.2%', leads: 3 },
        { title: 'Financiación europea para startups de impacto',          channel: 'blog',      date: '2 Oct',  impressions: '2,310', engagement: '5.1%', leads: 2 },
      ],
    },
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const PERIOD_KEYS = ['month', 'quarter', 'year'];
const PERIOD_LABELS = { month: 'This month', quarter: 'This quarter', year: 'This year' };

const CH_BADGE = {
  linkedin:  { bg: '#E8F0F8', color: '#2D6A9F', label: 'LinkedIn'  },
  instagram: { bg: '#F5E8EC', color: '#A8405A', label: 'Instagram' },
  blog:      { bg: '#E8F4F0', color: '#1A7A5A', label: 'Blog'      },
};

function fmt(n) { return n > 0 ? `+${n.toFixed(1)}%` : `${n.toFixed(1)}%`; }

const CHART_OPTS_BASE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { bodyFont: { family: F }, titleFont: { family: F } } },
};

const CHECKLIST = [
  'Analytics data collected',
  'Financial metrics compiled',
  'Writing activity summary…',
  'Formatting PDF',
];

const SF = "Georgia, 'Times New Roman', serif"; // serif for report body

// ── Main component ─────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const setTopbar = useSetTopbar();

  const [period, setPeriod]           = useState('quarter');
  const [month, setMonth]             = useState(null);
  const [reportState, setReportState] = useState(null); // null | 'loading' | 'preview'
  const [reportContent, setReportContent] = useState(null);
  const [checkDone, setCheckDone]     = useState([false, false, false, false]);

  const data = month
    ? MONTHS.find(m => m.key === month)?.data ?? PERIODS.quarter
    : PERIODS[period];

  useEffect(() => {
    setTopbar({
      title:    'Analytics',
      subtitle: reportState === 'preview' ? `Report — ${data.label}` : data.label,
      actions:  null,
    });
  }, [data.label, reportState]);

  function selectPeriod(p) {
    setPeriod(p);
    setMonth(null);
  }

  function selectMonth(key) {
    setMonth(key);
    setPeriod(null);
  }

  function getReportMetrics() {
    const totalSpend   = data.roiSpend.reduce((a, b) => a + b, 0);
    const totalRevenue = data.roiRevenue.reduce((a, b) => a + b, 0);
    const roi = Math.round(((totalRevenue - totalSpend) / totalSpend) * 100);
    return [
      { label: 'Marketing spend',    value: `€${totalSpend.toLocaleString()}`,   change: null },
      { label: 'Cost per lead',      value: data.metrics.cpl.value,              change: data.metrics.cpl.change },
      { label: 'Revenue attributed', value: `€${totalRevenue.toLocaleString()}`, change: null },
      { label: 'ROI',                value: `${roi}%`,                           change: null },
      { label: 'Leads generated',    value: data.metrics.leads.value,            change: data.metrics.leads.change },
      { label: 'Total impressions',  value: data.metrics.impressions.value,      change: data.metrics.impressions.change },
    ];
  }

  async function handleGenerateReport() {
    setReportState('loading');
    setCheckDone([false, false, false, false]);

    setTimeout(() => setCheckDone([true, false, false, false]), 500);
    setTimeout(() => setCheckDone([true, true, false, false]), 1300);

    let content;
    try {
      const res = await fetch(`${BASE_URL}/api/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: data.label, metrics: data.metrics, posts: data.posts }),
      });
      if (!res.ok) throw new Error();
      content = await res.json();
    } catch {
      content = {
        introduction: `This report presents BcnCor's marketing performance for ${data.label}, covering all content published across LinkedIn, Instagram, and the BcnCor blog. The analysis consolidates audience growth, lead generation, and content ROI metrics into a single executive view. Overall performance reflects continued growth in organic reach and improving cost-per-lead efficiency.`,
        activitySummary: `Content production this period centred on high-demand themes including CDTI public funding instruments, European venture capital market recovery, and CFO advisory for innovative Spanish SMEs. Top-performing content on CDTI aid schemes and Q1 VC funding data delivered the strongest lead conversion rates, consistent with sustained audience demand for actionable financing intelligence. The Spanish startup ecosystem remains active, with Barcelona and Madrid attracting the majority of domestic venture activity.`,
      };
    }

    setTimeout(() => setCheckDone([true, true, true, false]), 2500);
    setTimeout(() => {
      setCheckDone([true, true, true, true]);
      setReportContent(content);
      setTimeout(() => setReportState('preview'), 700);
    }, 3500);
  }

  function handleDownloadPDF() {
    const doc = document.getElementById('report-document');
    if (!doc) return;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Marketing Performance Report — ${data.label}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#fff;font-family:Georgia,'Times New Roman',serif;color:#1a1a2e;padding:60px 72px;max-width:800px;margin:0 auto;font-size:13px;line-height:1.7;}
        h1{font-size:22px;font-weight:700;color:#1a3a5c;}
        h2{font-size:14px;font-weight:700;color:#1a3a5c;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;}
        p{margin-bottom:12px;color:#2d2d2d;}
        table{width:100%;border-collapse:collapse;}
        th{text-align:left;padding:6px 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#4A5568;border-bottom:1px solid #ddd;}
        td{padding:8px 10px;border-bottom:0.5px solid #eee;font-size:12px;}
        .metric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;}
        .metric-box{border:0.5px solid #ddd;border-radius:6px;padding:12px 14px;}
        .metric-label{font-size:10px;color:#4A5568;text-transform:uppercase;letter-spacing:0.4px;font-family:Arial,sans-serif;margin-bottom:4px;}
        .metric-value{font-size:20px;font-weight:700;color:#1a3a5c;}
        .metric-change{font-size:10px;font-family:Arial,sans-serif;margin-top:2px;}
        .section{margin-bottom:32px;}
        .divider{border:none;border-top:0.5px solid #ddd;margin:24px 0;}
        .chart-placeholder{background:#F7F8FA;border:0.5px solid #ddd;border-radius:6px;height:120px;display:flex;align-items:center;justify-content:center;color:#9CA3AF;font-size:11px;font-family:Arial,sans-serif;margin-bottom:8px;}
        .badge{display:inline-block;font-size:9px;font-weight:600;border-radius:10px;padding:2px 7px;font-family:Arial,sans-serif;}
        .footer{margin-top:40px;padding-top:12px;border-top:0.5px solid #ddd;font-size:10px;color:#9CA3AF;font-family:Arial,sans-serif;display:flex;justify-content:space-between;}
      </style>
    </head><body>${doc.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 300);
  }

  // ── Line chart ──────────────────────────────────────────────────────────────
  const lineChartData = {
    labels: data.lineLabels,
    datasets: [
      { label: 'LinkedIn',  data: data.lineData.linkedin,  borderColor: CH.linkedin,  backgroundColor: CH.linkedin  + '18', fill: true, tension: 0.35, pointRadius: 3, borderWidth: 2 },
      { label: 'Instagram', data: data.lineData.instagram, borderColor: CH.instagram, backgroundColor: CH.instagram + '18', fill: true, tension: 0.35, pointRadius: 3, borderWidth: 2 },
      { label: 'Blog',      data: data.lineData.blog,      borderColor: CH.blog,      backgroundColor: CH.blog      + '18', fill: true, tension: 0.35, pointRadius: 3, borderWidth: 2 },
    ],
  };
  const lineOpts = {
    ...CHART_OPTS_BASE,
    plugins: {
      ...CHART_OPTS_BASE.plugins,
      legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 11, family: F }, color: '#4A5568', padding: 16 } },
    },
    scales: {
      x: { grid: { color: '#F0F0F0' }, ticks: { font: { size: 10, family: F }, color: '#9CA3AF' } },
      y: { grid: { color: '#F0F0F0' }, ticks: { font: { size: 10, family: F }, color: '#9CA3AF' } },
    },
  };

  // ── Doughnut ────────────────────────────────────────────────────────────────
  const doughnutData = {
    labels: ['LinkedIn', 'Instagram', 'Blog', 'Other'],
    datasets: [{ data: data.doughnut, backgroundColor: [CH.linkedin, CH.instagram, CH.blog, CH.other], borderWidth: 0, hoverOffset: 4 }],
  };
  const doughnutOpts = {
    ...CHART_OPTS_BASE,
    cutout: '68%',
    plugins: {
      ...CHART_OPTS_BASE.plugins,
      legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 11, family: F }, color: '#4A5568', padding: 12 } },
      tooltip: { ...CHART_OPTS_BASE.plugins.tooltip, callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` } },
    },
  };

  // ── Bar — Content production ────────────────────────────────────────────────
  const barData = {
    labels: data.barLabels,
    datasets: [
      { label: 'Carousels',  data: data.barData.carousels, backgroundColor: CH.linkedin,  borderRadius: 3, stack: 'stack' },
      { label: 'Blog posts', data: data.barData.blog,      backgroundColor: CH.blog,      borderRadius: 3, stack: 'stack' },
      { label: 'Instagram',  data: data.barData.instagram, backgroundColor: CH.instagram, borderRadius: 3, stack: 'stack' },
    ],
  };
  const barOpts = {
    ...CHART_OPTS_BASE,
    plugins: {
      ...CHART_OPTS_BASE.plugins,
      legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 11, family: F }, color: '#4A5568', padding: 14 } },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10, family: F }, color: '#9CA3AF' } },
      y: { stacked: true, grid: { color: '#F0F0F0' }, ticks: { font: { size: 10, family: F }, color: '#9CA3AF', stepSize: 4 } },
    },
  };

  // ── Bar — ROI ───────────────────────────────────────────────────────────────
  const roiData = {
    labels: data.roiLabels,
    datasets: [
      { label: 'Revenue attributed', data: data.roiRevenue, backgroundColor: CH.blog,      borderRadius: 3 },
      { label: 'Marketing spend',    data: data.roiSpend,   backgroundColor: CH.linkedin,  borderRadius: 3 },
    ],
  };
  const roiOpts = {
    ...CHART_OPTS_BASE,
    plugins: {
      ...CHART_OPTS_BASE.plugins,
      legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 11, family: F }, color: '#4A5568', padding: 14 } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10, family: F }, color: '#9CA3AF' } },
      y: { grid: { color: '#F0F0F0' }, ticks: { font: { size: 10, family: F }, color: '#9CA3AF', callback: v => `€${(v/1000).toFixed(0)}k` } },
    },
  };

  const METRICS = [
    { label: 'Total impressions', ...data.metrics.impressions },
    { label: 'New followers',     ...data.metrics.followers   },
    { label: 'Posts published',   ...data.metrics.posts       },
    { label: 'Leads generated',   ...data.metrics.leads       },
    { label: 'Cost per lead',     ...data.metrics.cpl         },
  ];

  const cardStyle = {
    background: 'var(--color-surface)',
    border: '0.5px solid var(--color-border)',
    borderRadius: 8,
    padding: '14px 18px',
  };

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Period selector + Generate report button ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {PERIOD_KEYS.map(p => {
            const active = period === p && !month;
            return (
              <button
                key={p}
                onClick={() => selectPeriod(p)}
                style={{
                  padding: '5px 14px', borderRadius: 20,
                  border: active ? 'none' : '0.5px solid var(--color-border)',
                  background: active ? NAV : 'var(--color-surface)',
                  color: active ? '#fff' : 'var(--color-text-muted)',
                  fontSize: 12, fontWeight: active ? 500 : 400,
                  cursor: 'pointer', fontFamily: F,
                }}
              >
                {PERIOD_LABELS[p]}
              </button>
            );
          })}
        </div>

        <div style={{ width: '0.5px', height: 20, background: 'var(--color-border)' }} />

        <select
          value={month ?? ''}
          onChange={e => e.target.value ? selectMonth(e.target.value) : null}
          style={{
            padding: '5px 10px', borderRadius: 6,
            border: `0.5px solid ${month ? NAV : 'var(--color-border)'}`,
            background: month ? '#EEF2F8' : 'var(--color-surface)',
            color: month ? NAV : 'var(--color-text-muted)',
            fontSize: 12, cursor: 'pointer', fontFamily: F, outline: 'none',
          }}
        >
          <option value="">Select month…</option>
          {MONTHS.map(m => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>

        <div style={{ flex: 1 }} />

        <button
          onClick={handleGenerateReport}
          disabled={reportState === 'loading'}
          style={{
            padding: '5px 16px', borderRadius: 6, border: 'none',
            background: reportState === 'loading' ? '#8BAFC8' : NAV,
            color: '#fff', fontSize: 12, fontWeight: 500,
            cursor: reportState === 'loading' ? 'default' : 'pointer',
            fontFamily: F,
          }}
        >
          {reportState === 'loading' ? 'Generating…' : 'Generate report'}
        </button>
      </div>

      {/* ── Loading screen ── */}
      {reportState === 'loading' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: 400, gap: 32,
        }}>
          <style>{`@keyframes analyticspin { to { transform: rotate(360deg); } }`}</style>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid var(--color-border)',
            borderTopColor: NAV,
            animation: 'analyticspin 0.8s linear infinite',
          }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {CHECKLIST.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, color: checkDone[i] ? 'var(--color-text)' : 'var(--color-text-muted)',
                fontWeight: checkDone[i] ? 500 : 400,
                transition: 'color 0.3s',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  border: `1.5px solid ${checkDone[i] ? '#1a5c3a' : 'var(--color-border)'}`,
                  background: checkDone[i] ? '#1a5c3a' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                }}>
                  {checkDone[i] && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                </div>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Report preview ── */}
      {reportState === 'preview' && reportContent && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'flex-end', alignItems: 'center' }}>
            <button
              onClick={() => { setReportState(null); setReportContent(null); }}
              style={{
                padding: '5px 14px', borderRadius: 6,
                border: '0.5px solid var(--color-border)',
                background: 'var(--color-surface)', color: 'var(--color-text-muted)',
                fontSize: 12, cursor: 'pointer', fontFamily: F,
              }}
            >
              ← Back to analytics
            </button>
            <button
              onClick={handleGenerateReport}
              style={{
                padding: '5px 14px', borderRadius: 6,
                border: '0.5px solid var(--color-border)',
                background: 'var(--color-surface)', color: 'var(--color-text-muted)',
                fontSize: 12, cursor: 'pointer', fontFamily: F,
              }}
            >
              ↻ Regenerate
            </button>
            <button
              onClick={handleDownloadPDF}
              style={{
                padding: '5px 16px', borderRadius: 6, border: 'none',
                background: NAV, color: '#fff',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: F,
              }}
            >
              ↓ Download PDF
            </button>
          </div>

          <div id="report-document" style={{
            background: '#fff', border: '0.5px solid #D4DAE4',
            borderRadius: 8, padding: '48px 56px',
            fontFamily: SF, color: '#1a1a2e', fontSize: 13, lineHeight: 1.75,
            maxWidth: 820, margin: '0 auto',
          }}>
            {/* Report header */}
            <div style={{ marginBottom: 36, borderBottom: '1.5px solid #1a3a5c', paddingBottom: 20 }}>
              <div style={{ fontSize: 10, fontFamily: F, color: '#9CA3AF', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
                BcnCor · Marketing Performance Report
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a3a5c', fontFamily: SF, margin: '0 0 6px 0' }}>
                {data.label}
              </h1>
              <div style={{ fontSize: 11, fontFamily: F, color: '#9CA3AF' }}>
                Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* 1. Introduction */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 10, fontFamily: F, fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                1. Introduction
              </div>
              <p style={{ margin: 0, color: '#2d2d2d' }}>{reportContent.introduction}</p>
            </div>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '0 0 32px 0' }} />

            {/* 2. Financial Metrics */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 10, fontFamily: F, fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 16 }}>
                2. Financial Metrics
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {getReportMetrics().map(({ label, value, change }) => (
                  <div key={label} style={{ border: '0.5px solid #E5E7EB', borderRadius: 6, padding: '12px 14px' }}>
                    <div style={{ fontSize: 9, fontFamily: F, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1a3a5c', fontFamily: SF }}>{value}</div>
                    {change !== null && (
                      <div style={{ fontSize: 10, fontFamily: F, color: change > 0 ? '#1a5c3a' : '#8B1A1A', marginTop: 2 }}>
                        {fmt(change)} vs prev. period
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '0 0 32px 0' }} />

            {/* 3. Analytics Overview */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 10, fontFamily: F, fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 16 }}>
                3. Analytics Overview
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'Impressions',    ...data.metrics.impressions },
                  { label: 'New followers',  ...data.metrics.followers   },
                  { label: 'Posts published',...data.metrics.posts       },
                  { label: 'Leads generated',...data.metrics.leads       },
                ].map(({ label, value, change }) => (
                  <div key={label} style={{ border: '0.5px solid #E5E7EB', borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, fontFamily: F, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#1a3a5c', fontFamily: SF }}>{value}</div>
                    <div style={{ fontSize: 10, fontFamily: F, color: change > 0 ? '#1a5c3a' : change < 0 ? '#8B1A1A' : '#4A5568' }}>
                      {change === 0 ? '—' : fmt(change)}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#F8FAFC', border: '0.5px solid #E5E7EB', borderRadius: 6, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, fontFamily: F, color: '#4A5568', lineHeight: 1.5 }}>
                  Channel breakdown: <strong>LinkedIn</strong> {data.doughnut[0]}% · <strong>Instagram</strong> {data.doughnut[1]}% · <strong>BcnCor blog</strong> {data.doughnut[2]}% · Other {data.doughnut[3]}%
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '0 0 32px 0' }} />

            {/* 4. Activity Summary */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 10, fontFamily: F, fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                4. Activity Summary
              </div>
              <p style={{ margin: 0, color: '#2d2d2d' }}>{reportContent.activitySummary}</p>
            </div>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '0 0 32px 0' }} />

            {/* 5. Top Performing Posts */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 10, fontFamily: F, fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>
                5. Top Performing Posts
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: F }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid #E5E7EB' }}>
                    {['Post title', 'Channel', 'Impressions', 'Leads'].map(col => (
                      <th key={col} style={{ textAlign: 'left', padding: '4px 8px 8px', fontSize: 9, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.posts.map((post, i) => {
                    const badge = CH_BADGE[post.channel];
                    return (
                      <tr key={i} style={{ borderBottom: '0.5px solid #F0F2F5' }}>
                        <td style={{ padding: '8px 8px', color: '#2d2d2d', lineHeight: 1.4, maxWidth: 300 }}>{post.title}</td>
                        <td style={{ padding: '8px 8px' }}>
                          <span style={{ fontSize: 9, fontWeight: 600, background: badge.bg, color: badge.color, borderRadius: 10, padding: '2px 7px' }}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '8px 8px', color: '#2d2d2d', fontWeight: 500 }}>{post.impressions}</td>
                        <td style={{ padding: '8px 8px', color: '#2d2d2d', fontWeight: 600 }}>{post.leads}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ borderTop: '0.5px solid #E5E7EB', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: F, color: '#9CA3AF' }}>
              <span>BcnCor — Confidential</span>
              <span>Generated by BcnCor Marketing Hub</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Analytics content ── */}
      {!reportState && (
        <>
          {/* ── Metric cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {METRICS.map(({ label, value, change }) => (
              <div key={label} style={cardStyle}>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>{value}</div>
                <div style={{
                  fontSize: 11, fontWeight: 500,
                  color: change === 0 ? '#4A5568' : change > 0 ? '#1a5c3a' : '#8B1A1A',
                }}>
                  {change === 0 ? '—' : fmt(change)} vs prev. period
                </div>
              </div>
            ))}
          </div>

          {/* ── Charts row 1 ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div style={{ ...cardStyle }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', marginBottom: 14 }}>Content performance</div>
              <div style={{ height: 220 }}>
                <Line data={lineChartData} options={lineOpts} />
              </div>
            </div>
            <div style={{ ...cardStyle }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', marginBottom: 14 }}>Acquisition by source</div>
              <div style={{ height: 220 }}>
                <Doughnut data={doughnutData} options={doughnutOpts} />
              </div>
            </div>
          </div>

          {/* ── Charts row 2 ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', marginBottom: 14 }}>Content production</div>
              <div style={{ height: 200 }}>
                <Bar data={barData} options={barOpts} />
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', marginBottom: 14 }}>Marketing ROI</div>
              <div style={{ height: 200 }}>
                <Bar data={roiData} options={roiOpts} />
              </div>
            </div>
          </div>

          {/* ── Top posts table ── */}
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', marginBottom: 14 }}>Top performing posts</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--color-border)' }}>
                  {['Post title', 'Channel', 'Date', 'Impressions', 'Engagement', 'Leads'].map(col => (
                    <th key={col} style={{
                      textAlign: 'left', padding: '0 10px 10px',
                      fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.posts.map((post, i) => {
                  const badge = CH_BADGE[post.channel];
                  return (
                    <tr key={i} style={{ borderBottom: '0.5px solid var(--color-border)' }}>
                      <td style={{ padding: '10px 10px', color: 'var(--color-text)', fontWeight: 400, maxWidth: 280, lineHeight: 1.4 }}>
                        {post.title}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{ fontSize: 10, fontWeight: 500, background: badge.bg, color: badge.color, borderRadius: 10, padding: '2px 8px' }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{post.date}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--color-text)', fontWeight: 500 }}>{post.impressions}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--color-text-muted)' }}>{post.engagement}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--color-text)', fontWeight: 600 }}>{post.leads}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Info banner ── */}
          <div style={{
            background: 'rgba(58,175,221,0.07)', border: '0.5px solid rgba(58,175,221,0.22)',
            borderRadius: 8, padding: '11px 16px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
              background: 'rgba(58,175,221,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#3AAFDD',
            }}>
              i
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.55 }}>
              Click <strong style={{ color: 'var(--color-text)' }}>Generate report</strong> to create a PDF-ready performance summary for {data.label}.
              Claude will write the narrative sections based on the current analytics data.
            </div>
          </div>
        </>
      )}

    </div>
  );
}