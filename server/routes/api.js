const express = require('express');
const {
  getAllElements,
  getElementById,
  getElementsByIds,
  searchElements,
  getDatabase
} = require('../db/database');

const router = express.Router();

/**
 * Fisher-Yates array shuffling
 */
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Builds Three.js configuration payload for atom visualization
 */
function buildThreeJsConfig(element) {
  const shells = Array.isArray(element.shells) ? element.shells : [];
  const shellLetters = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];

  const orbitals = shells.map((count, index) => ({
    shellIndex: index + 1,
    shellLetter: shellLetters[index] || `S${index + 1}`,
    electronCount: count,
    radius: Number((1.5 + index * 0.75).toFixed(2)),
    tiltX: Number(((index * Math.PI) / 6).toFixed(4)),
    tiltZ: Number(((index * Math.PI) / 8).toFixed(4)),
    rotationSpeed: Number((0.025 / (index + 1)).toFixed(5))
  }));

  const actualNeutrons = Number.isFinite(element.neutrons) ? element.neutrons : 0;
  const actualProtons = Number.isFinite(element.protons) ? element.protons : (element.number || 1);
  const actualNucleons = Math.max(1, actualProtons + actualNeutrons);
  const totalNucleons = Math.min(actualNucleons, 60);
  const visibleProtons = Math.round((totalNucleons * actualProtons) / actualNucleons);

  return {
    protons: actualProtons,
    neutrons: actualNeutrons,
    electrons: Number.isFinite(element.electrons) ? element.electrons : actualProtons,
    shells,
    shellCount: shells.length,
    nucleus: {
      totalNucleons,
      visibleProtons,
      visibleNeutrons: totalNucleons - visibleProtons,
      representativeIsotope: element.representativeIsotopeMassNumber ?? null
    },
    orbitals
  };
}

const CATEGORY_NAMES_FA = {
  'alkali-metal': 'فلز قلیایی',
  'alkaline-earth': 'فلز قلیایی خاکی',
  'transition-metal': 'فلز واسطه',
  'post-transition-metal': 'فلز پس‌واسطه',
  'post-transition': 'فلز پس‌واسطه',
  'metalloid': 'شبه‌فلز',
  'reactive-nonmetal': 'نافلز فعال',
  'halogen': 'هالوژن',
  'noble-gas': 'گاز نجیب',
  'lanthanide': 'لانتانید',
  'actinide': 'اکتینید',
  'unknown': 'خواص شیمیایی ناشناخته'
};

const UNIQUE_CATEGORIES_FA = [
  'فلز قلیایی',
  'فلز قلیایی خاکی',
  'فلز واسطه',
  'فلز پس‌واسطه',
  'شبه‌فلز',
  'نافلز فعال',
  'هالوژن',
  'گاز نجیب',
  'لانتانید',
  'اکتینید'
];

/**
 * GET /api/health
 * Backend health check and database status
 */
router.get('/health', (req, res) => {
  try {
    const db = getDatabase();
    const countRow = db.prepare('SELECT COUNT(*) AS count FROM elements').get();
    const elementsCount = countRow ? Number(countRow.count) : 0;

    res.json({
      ok: true,
      status: 'healthy',
      database: 'sqlite',
      elements: elementsCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * GET /api/elements
 * Retrieves all elements with optional filtering by category and phase
 */
router.get('/elements', (req, res) => {
  try {
    const { category, phase, block, period, group, q, search, temperature, temp } = req.query;

    const rawTemp = temperature !== undefined ? temperature : temp;
    let validatedTemp = null;

    if (rawTemp !== undefined && rawTemp !== null && String(rawTemp).trim() !== '') {
      const parsedTemp = parseFloat(rawTemp);
      if (!Number.isFinite(parsedTemp) || parsedTemp < 0) {
        return res.status(400).json({
          error: 'Invalid temperature: must be a non-negative number in Kelvin (>= 0)'
        });
      }
      validatedTemp = parsedTemp;
    }

    const elements = getAllElements({
      category,
      phase,
      block,
      period,
      group,
      search: search || q,
      temperature: validatedTemp
    });

    res.json(elements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve elements: ' + error.message });
  }
});

/**
 * GET /api/search
 * Fast element search by query keyword
 */
router.get('/search', (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json([]);
    }
    const results = searchElements(q);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Search failed: ' + error.message });
  }
});

/**
 * GET /api/elements/:id
 * Detailed element view with complete electron configuration and Three.js geometry data
 */
router.get('/elements/:id', (req, res) => {
  try {
    const { id } = req.params;
    const element = getElementById(id);

    if (!element) {
      return res.status(404).json({ error: 'Element not found' });
    }

    const threeJsConfig = buildThreeJsConfig(element);

    res.json({
      ...element,
      threeJsConfig
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch element: ' + error.message });
  }
});

/**
 * GET /api/quiz
 * Generates dynamic random quiz questions based on elemental properties
 */
router.get('/quiz', (req, res) => {
  try {
    const allElements = getAllElements();
    if (allElements.length === 0) {
      return res.status(503).json({ error: 'Elements database not ready for quiz generation' });
    }

    let count = 10;
    if (req.query.count !== undefined) {
      const parsed = parseInt(req.query.count, 10);
      if (Number.isFinite(parsed)) {
        count = Math.min(Math.max(1, parsed), 50);
      }
    }
    const mode = (req.query.type || req.query.mode || 'mixed').toLowerCase();

    // Select random elements pool
    const selectedElements = shuffleArray(allElements).slice(0, count);
    const availableTypes = ['symbol', 'atomicNumber', 'name', 'category', 'block', 'period'];

    const questions = selectedElements.map((targetEl, index) => {
      let qType = mode;
      if (mode === 'mixed' || !availableTypes.includes(mode)) {
        qType = availableTypes[index % availableTypes.length];
      }

      let questionText = '';
      let correctAnswer = '';
      let explanation = '';
      const pool = new Set();

      switch (qType) {
        case 'symbol': {
          questionText = `نماد شیمیایی عنصر «${targetEl.nameFa}» (${targetEl.nameEn}) چیست؟`;
          correctAnswer = targetEl.symbol;
          explanation = `عنصر ${targetEl.nameFa} با نماد شیمیایی «${targetEl.symbol}» و عدد اتمی ${targetEl.number} شناخته می‌شود.`;
          pool.add(correctAnswer);
          while (pool.size < 4) {
            const distractor = allElements[Math.floor(Math.random() * allElements.length)];
            pool.add(distractor.symbol);
          }
          break;
        }

        case 'atomicNumber': {
          questionText = `عدد اتمی عنصر «${targetEl.nameFa}» (${targetEl.symbol}) چند است؟`;
          correctAnswer = String(targetEl.number);
          explanation = `عنصر ${targetEl.nameFa} (${targetEl.symbol}) دارای ${targetEl.number} پروتون در هسته خود است و عدد اتمی آن ${targetEl.number} می‌باشد.`;
          pool.add(correctAnswer);
          while (pool.size < 4) {
            const distractor = allElements[Math.floor(Math.random() * allElements.length)];
            pool.add(String(distractor.number));
          }
          break;
        }

        case 'name': {
          questionText = `نام فارسی عنصر شیمیایی با نماد «${targetEl.symbol}» (${targetEl.nameEn}) چیست؟`;
          correctAnswer = targetEl.nameFa;
          explanation = `نماد شیمیایی «${targetEl.symbol}» متعلق به عنصر «${targetEl.nameFa}» (${targetEl.nameEn}) با عدد اتمی ${targetEl.number} است.`;
          pool.add(correctAnswer);
          while (pool.size < 4) {
            const distractor = allElements[Math.floor(Math.random() * allElements.length)];
            pool.add(distractor.nameFa);
          }
          break;
        }

        case 'category': {
          const catFa = CATEGORY_NAMES_FA[targetEl.category] || targetEl.category;
          questionText = `عنصر «${targetEl.nameFa}» (${targetEl.symbol}) متعلق به کدام دسته از عناصر جدول تناوبی است؟`;
          correctAnswer = catFa;
          explanation = `عنصر ${targetEl.nameFa} در ردهٔ «${catFa}» قرار دارد.`;
          pool.add(correctAnswer);
          while (pool.size < 4 && pool.size < UNIQUE_CATEGORIES_FA.length) {
            const distractor = UNIQUE_CATEGORIES_FA[Math.floor(Math.random() * UNIQUE_CATEGORIES_FA.length)];
            pool.add(distractor);
          }
          break;
        }

        case 'block': {
          questionText = `عنصر «${targetEl.nameFa}» (${targetEl.symbol}) در کدام بلوک الکترونی جدول تناوبی قرار دارد؟`;
          correctAnswer = `بلوک ${targetEl.block.toUpperCase()}`;
          explanation = `الکترون ظرفیت عنصر ${targetEl.nameFa} در زیرلایه ${targetEl.block} قرار می‌گیرد (بلوک ${targetEl.block.toUpperCase()}).`;
          pool.add(correctAnswer);
          ['بلوک S', 'بلوک P', 'بلوک D', 'بلوک F'].forEach(b => pool.add(b));
          break;
        }

        case 'period': {
          questionText = `عنصر «${targetEl.nameFa}» (${targetEl.symbol}) در کدام دوره (تناوب) جدول تناوبی واقع شده است؟`;
          correctAnswer = `دوره ${targetEl.period}`;
          explanation = `عنصر ${targetEl.nameFa} دارای ${targetEl.period} لایه الکترونی اصلی فعال بوده و در دوره ${targetEl.period} جدول است.`;
          pool.add(correctAnswer);
          while (pool.size < 4) {
            const randomPeriod = Math.floor(Math.random() * 7) + 1;
            pool.add(`دوره ${randomPeriod}`);
          }
          break;
        }
      }

      const options = shuffleArray(Array.from(pool)).slice(0, 4);

      return {
        id: index + 1,
        type: qType,
        question: questionText,
        element: {
          number: targetEl.number,
          symbol: targetEl.symbol,
          nameFa: targetEl.nameFa,
          nameEn: targetEl.nameEn
        },
        options,
        correctAnswer,
        explanation
      };
    });

    if (req.query.format === 'object' || req.query.wrap === 'true') {
      return res.json({
        success: true,
        count: questions.length,
        questions
      });
    }

    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate quiz: ' + error.message });
  }
});

/**
 * POST /api/compare
 * Compares an array of element identifiers (numbers, symbols, or names)
 */
router.post('/compare', (req, res) => {
  try {
    let identifiers = [];

    if (Array.isArray(req.body)) {
      identifiers = req.body;
    } else if (req.body && typeof req.body === 'object') {
      if (Array.isArray(req.body.ids)) {
        identifiers = req.body.ids;
      } else if (Array.isArray(req.body.elements)) {
        identifiers = req.body.elements;
      } else if (Array.isArray(req.body.symbols)) {
        identifiers = req.body.symbols;
      } else if (Array.isArray(req.body.numbers)) {
        identifiers = req.body.numbers;
      }
    }

    if (!Array.isArray(identifiers) || identifiers.length === 0) {
      return res.status(400).json({
        error: "An array of element identifiers (atomic numbers or symbols) is required in the request body (e.g. { ids: [1, 6, 26] } or [1, 6, 26])"
      });
    }

    if (identifiers.length > 20) {
      return res.status(400).json({
        error: 'A maximum of 20 elements can be compared at once.'
      });
    }

    const matchedElements = [];
    const seenNumbers = new Set();
    const notFoundIdentifiers = [];

    for (const id of identifiers) {
      if (id === null || id === undefined || String(id).trim() === '') {
        continue;
      }
      const el = getElementById(id);
      if (el) {
        if (!seenNumbers.has(el.number)) {
          seenNumbers.add(el.number);
          matchedElements.push(el);
        }
      } else {
        notFoundIdentifiers.push(id);
      }
    }

    if (matchedElements.length === 0) {
      return res.status(404).json({
        error: 'No matching elements found for the provided identifiers.',
        notFound: notFoundIdentifiers
      });
    }

    // Helper to calculate property metrics across compared elements
    const computeMetric = (propertyName) => {
      const validEntries = matchedElements
        .map(el => ({
          number: el.number,
          symbol: el.symbol,
          nameEn: el.nameEn,
          nameFa: el.nameFa,
          value: el[propertyName]
        }))
        .filter(item => Number.isFinite(item.value));

      if (validEntries.length === 0) {
        return {
          available: false,
          values: matchedElements.map(el => ({
            number: el.number,
            symbol: el.symbol,
            value: el[propertyName] ?? null
          }))
        };
      }

      let min = validEntries[0];
      let max = validEntries[0];

      for (const item of validEntries) {
        if (item.value < min.value) min = item;
        if (item.value > max.value) max = item;
      }

      return {
        available: true,
        min,
        max,
        delta: Number((max.value - min.value).toFixed(4)),
        values: matchedElements.map(el => ({
          number: el.number,
          symbol: el.symbol,
          value: el[propertyName] ?? null
        }))
      };
    };

    const comparisonMetrics = {
      atomicMass: computeMetric('atomicMass'),
      density: computeMetric('density'),
      meltingPoint: computeMetric('meltingPoint'),
      boilingPoint: computeMetric('boilingPoint'),
      electronegativity: computeMetric('electronegativity'),
      ionizationEnergy: computeMetric('ionizationEnergy'),
      atomicRadius: computeMetric('atomicRadius'),
      electronAffinity: computeMetric('electronAffinity')
    };

    // Human-readable summary highlights
    const highlights = [];
    if (comparisonMetrics.atomicMass.available) {
      highlights.push(`سنگین‌ترین عنصر: ${comparisonMetrics.atomicMass.max.nameFa} (${comparisonMetrics.atomicMass.max.symbol}) با جرم ${comparisonMetrics.atomicMass.max.value} u`);
      if (matchedElements.length > 1 && comparisonMetrics.atomicMass.min.value !== comparisonMetrics.atomicMass.max.value) {
        highlights.push(`سبک‌ترین عنصر: ${comparisonMetrics.atomicMass.min.nameFa} (${comparisonMetrics.atomicMass.min.symbol}) با جرم ${comparisonMetrics.atomicMass.min.value} u`);
      }
    }
    if (comparisonMetrics.electronegativity.available) {
      highlights.push(`بیشترین الکترونگاتیوی: ${comparisonMetrics.electronegativity.max.nameFa} (${comparisonMetrics.electronegativity.max.symbol}) با مقدار ${comparisonMetrics.electronegativity.max.value}`);
    }
    if (comparisonMetrics.density.available) {
      highlights.push(`بیشترین چگالی: ${comparisonMetrics.density.max.nameFa} (${comparisonMetrics.density.max.symbol}) با ${comparisonMetrics.density.max.value} g/cm³`);
    }
    if (comparisonMetrics.meltingPoint.available && comparisonMetrics.meltingPoint.max.value !== comparisonMetrics.meltingPoint.min.value) {
      highlights.push(`بیشترین دمای ذوب: ${comparisonMetrics.meltingPoint.max.nameFa} (${comparisonMetrics.meltingPoint.max.symbol}) با ${comparisonMetrics.meltingPoint.max.value} K`);
    }
    if (comparisonMetrics.boilingPoint.available && comparisonMetrics.boilingPoint.max.value !== comparisonMetrics.boilingPoint.min.value) {
      highlights.push(`بیشترین دمای جوش: ${comparisonMetrics.boilingPoint.max.nameFa} (${comparisonMetrics.boilingPoint.max.symbol}) با ${comparisonMetrics.boilingPoint.max.value} K`);
    }

    res.json({
      success: true,
      count: matchedElements.length,
      elements: matchedElements,
      comparison: comparisonMetrics,
      summary: highlights,
      ...(notFoundIdentifiers.length > 0 ? { notFound: notFoundIdentifiers } : {})
    });
  } catch (error) {
    res.status(500).json({ error: 'Element comparison failed: ' + error.message });
  }
});

module.exports = router;
