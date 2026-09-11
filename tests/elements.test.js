const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { app } = require('../server/index');
const {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  getAllElements,
  getElementById
} = require('../server/db/database');

describe('Smart Periodic Table Test Suite', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Ensure database is initialized and auto-seeded
    initializeDatabase();

    // Start HTTP server on an ephemeral free port
    await new Promise((resolve, reject) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
      server.on('error', reject);
    });
  });

  after(async () => {
    // Cleanly terminate HTTP server and close SQLite connection
    await new Promise((resolve) => {
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });
    closeDatabase();
  });

  // =========================================================================
  // ۱. تست جامعیت داده‌های علمی ۱۱۸ عنصر (Scientific Data Integrity)
  // =========================================================================
  describe('1. Scientific Data Integrity of 118 Elements (Unit & Database Layer)', () => {
    it('باید دقیقا ۱۱۸ عنصر بدون هیچ شماره اتمی جاافتاده (از ۱ تا ۱۱۸) در دیتابیس وجود داشته باشد', () => {
      const elements = getAllElements();
      assert.equal(elements.length, 118, 'تعداد عناصر جدول باید دقیقا ۱۱۸ باشد');

      const atomicNumbers = elements.map(e => e.number).sort((a, b) => a - b);
      const expectedNumbers = Array.from({ length: 118 }, (_, i) => i + 1);

      assert.deepEqual(
        atomicNumbers,
        expectedNumbers,
        'شماره‌های اتمی باید دنباله‌ای پیوسته و کامل از ۱ تا ۱۱۸ باشند'
      );
    });

    it('تمامی ۱۱۸ عنصر باید دارای نماد شیمیایی یکتا و معتبر و نام‌های فارسی و انگلیسی کامل باشند', () => {
      const elements = getAllElements();
      const symbolSet = new Set();

      for (const el of elements) {
        assert.ok(el.symbol && typeof el.symbol === 'string', `نماد عنصر ${el.number} نامعتبر است`);
        assert.ok(/^[A-Z][a-z]?$/.test(el.symbol), `فرمت نماد عنصر ${el.symbol} استاندارد نیست`);
        assert.equal(symbolSet.has(el.symbol), false, `نماد شیمیایی تکراری کشف شد: ${el.symbol}`);
        symbolSet.add(el.symbol);

        assert.ok(el.nameFa && el.nameFa.trim().length > 0, `نام فارسی برای ${el.symbol} یافت نشد`);
        assert.ok(el.nameEn && el.nameEn.trim().length > 0, `نام انگلیسی برای ${el.symbol} یافت نشد`);
        assert.ok(typeof el.atomicMass === 'number' && el.atomicMass > 0, `جرم اتمی ${el.symbol} نامعتبر است`);
      }

      assert.equal(symbolSet.size, 118, 'باید دقیقا ۱۱۸ نماد شیمیایی متمایز وجود داشته باشد');
    });

    it('تعداد پروتون‌ها، الکترون‌ها و ساختار لایه‌های الکترونی باید با عدد اتمی تطابق ریاضی داشته باشد', () => {
      const elements = getAllElements();

      for (const el of elements) {
        assert.equal(el.protons, el.number, `تعداد پروتون‌های ${el.symbol} باید برابر با عدد اتمی باشد`);
        assert.equal(el.electrons, el.number, `تعداد الکترون‌های ${el.symbol} باید برابر با عدد اتمی باشد`);

        assert.ok(Array.isArray(el.shells) && el.shells.length > 0, `لایه‌های الکترونی ${el.symbol} خالی است`);
        const totalShellElectrons = el.shells.reduce((sum, count) => sum + count, 0);
        assert.equal(
          totalShellElectrons,
          el.number,
          `مجموع الکترون‌های لایه‌های ${el.symbol} (${totalShellElectrons}) باید دقیقا برابر عدد اتمی (${el.number}) باشد`
        );
      }
    });

    it('تضمین عدم وجود داده جعلی: عناصر فوق‌سنگین فاقد داده‌های تجربی باید حتما دارای برچسب predicted یا مقدار null باشند', () => {
      const elements = getAllElements();
      const superheavy = elements.filter(e => e.number >= 100);

      assert.ok(superheavy.length >= 19, 'باید حداقل ۱۹ عنصر فوق‌سنگین (از ۱۰۰ به بالا) بررسی شوند');

      for (const el of superheavy) {
        // تمامی عناصر از ۱۰۰ به بالا باید با فلگ پیش‌بینی شده علامت‌گذاری شوند
        assert.equal(
          el.isPredicted,
          true,
          `عنصر فوق‌سنگین ${el.symbol} (${el.number}) باید فلگ isPredicted: true داشته باشد`
        );

        // مقادیر ناموجود باید صریحاً null باشند؛ هیچ عدد ساختگی (مثل 0 یا -1 یا NaN) مجاز نیست
        if (el.number >= 104) {
          // ترانزاکتینیدها فاقد دمای ذوب و جوش تجربی پایدار هستند
          assert.equal(
            el.meltingPoint,
            null,
            `عنصر ${el.symbol} نباید دمای ذوب جعلی داشته باشد؛ مقدار باید دقیقاً null باشد`
          );
          assert.equal(
            el.boilingPoint,
            null,
            `عنصر ${el.symbol} نباید دمای جوش جعلی داشته باشد؛ مقدار باید دقیقاً null باشد`
          );
          assert.equal(
            el.density,
            null,
            `عنصر ${el.symbol} نباید چگالی جعلی داشته باشد؛ مقدار باید دقیقاً null باشد`
          );
        }
      }
    });

    it('عناصر مرجع دارای داده‌های تجربی اثبات‌شده باید مقادیر فیزیکی دقیق و غیر null داشته باشند', () => {
      const iron = getElementById(26);
      assert.ok(iron, 'عنصر آهن (Fe) باید وجود داشته باشد');
      assert.equal(iron.symbol, 'Fe');
      assert.equal(iron.isPredicted, false);
      assert.ok(iron.meltingPoint > 1800 && iron.meltingPoint < 1820, 'دمای ذوب آهن باید حدود ۱۸۱۱ کلوین باشد');
      assert.ok(iron.density > 7.8 && iron.density < 7.9, 'چگالی آهن باید حدود ۷.۸۷ g/cm³ باشد');

      const gold = getElementById('Au');
      assert.ok(gold, 'عنصر طلا (Au) باید با نماد پیدا شود');
      assert.equal(gold.number, 79);
      assert.equal(gold.isPredicted, false);
      assert.ok(gold.meltingPoint > 1330 && gold.meltingPoint < 1345, 'دمای ذوب طلا باید حدود ۱۳۳۷ کلوین باشد');
      assert.ok(gold.density > 19.2 && gold.density < 19.4, 'چگالی طلا باید حدود ۱۹.۳ g/cm³ باشد');

      const hydrogen = getElementById('هیدروژن');
      assert.ok(hydrogen, 'عنصر هیدروژن باید با نام فارسی پیدا شود');
      assert.equal(hydrogen.number, 1);
      assert.ok(hydrogen.meltingPoint > 13 && hydrogen.meltingPoint < 15, 'دمای ذوب هیدروژن باید حدود ۱۴ کلوین باشد');
      assert.ok(hydrogen.boilingPoint > 20 && hydrogen.boilingPoint < 21, 'دمای جوش هیدروژن باید حدود ۲۰.۲ کلوین باشد');
    });
  });

  // =========================================================================
  // ۲. تست یکپارچگی اندپوینتهای API (API Endpoints Integrity)
  // =========================================================================
  describe('2. API Endpoints Integrity & Schema Validation (Integration Layer)', () => {
    it('GET /api/health - باید وضعیت 200 و سلامت دیتابیس را برگرداند', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);

      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.status, 'healthy');
      assert.equal(data.database, 'sqlite');
      assert.equal(data.elements, 118);
    });

    it('GET /api/elements - باید موفقیت‌آمیز باشد و اسکیمای کامل ۱۱۸ عنصر را برگرداند', async () => {
      const res = await fetch(`${baseUrl}/api/elements`);
      assert.equal(res.status, 200);

      const elements = await res.json();
      assert.ok(Array.isArray(elements));
      assert.equal(elements.length, 118);

      // اعتبارسنجی اسکیمای تک‌تک عناصر
      for (const el of elements) {
        assert.ok(Number.isInteger(el.number) && el.number >= 1 && el.number <= 118);
        assert.ok(typeof el.symbol === 'string' && el.symbol.length > 0);
        assert.ok(typeof el.nameFa === 'string' && el.nameFa.length > 0);
        assert.ok(typeof el.nameEn === 'string' && el.nameEn.length > 0);
        assert.ok(typeof el.category === 'string');
        assert.ok(typeof el.block === 'string');
        assert.ok(typeof el.period === 'number');
        assert.ok(typeof el.gridColumn === 'number');
        assert.ok(typeof el.gridRow === 'number');
        assert.ok(typeof el.atomicMass === 'number');
        assert.ok(Array.isArray(el.shells));
        assert.ok(typeof el.isPredicted === 'boolean');
      }
    });

    it('GET /api/elements?category=... - باید فیلتر دسته‌بندی را در هر دو زبان انگلیسی و فارسی یکسان اعمال کند', async () => {
      // فیلتر گازهای نجیب به انگلیسی
      const resEn = await fetch(`${baseUrl}/api/elements?category=noble-gas`);
      assert.equal(resEn.status, 200);
      const nobleGasesEn = await resEn.json();
      assert.equal(nobleGasesEn.length, 7, 'تعداد گازهای نجیب باید ۷ باشد (He, Ne, Ar, Kr, Xe, Rn, Og)');

      // فیلتر گازهای نجیب به فارسی
      const resFa = await fetch(`${baseUrl}/api/elements?category=${encodeURIComponent('گاز نجیب')}`);
      assert.equal(resFa.status, 200);
      const nobleGasesFa = await resFa.json();
      assert.equal(nobleGasesFa.length, 7, 'تعداد گازهای نجیب با فیلتر فارسی باید دقیقا ۷ باشد');

      const enSymbols = nobleGasesEn.map(e => e.symbol).sort();
      const faSymbols = nobleGasesFa.map(e => e.symbol).sort();
      assert.deepEqual(enSymbols, faSymbols, 'خروجی فیلتر انگلیسی و فارسی باید دقیقا یکسان باشد');
      assert.deepEqual(enSymbols, ['Ar', 'He', 'Kr', 'Ne', 'Og', 'Rn', 'Xe']);

      // فیلتر فلزات قلیایی
      const resAlkaliEn = await fetch(`${baseUrl}/api/elements?category=alkali-metal`);
      const alkaliEn = await resAlkaliEn.json();
      const resAlkaliFa = await fetch(`${baseUrl}/api/elements?category=${encodeURIComponent('فلز قلیایی')}`);
      const alkaliFa = await resAlkaliFa.json();
      assert.equal(alkaliEn.length, alkaliFa.length);
      assert.deepEqual(alkaliEn.map(e => e.symbol), alkaliFa.map(e => e.symbol));
    });

    it('GET /api/elements?phase=... - باید فیلتر فاز را به درستی برای گاز، مایع و جامد اعمال کند', async () => {
      // فاز مایع (شامل Br و Hg)
      const resLiquidEn = await fetch(`${baseUrl}/api/elements?phase=liquid`);
      assert.equal(resLiquidEn.status, 200);
      const liquidEn = await resLiquidEn.json();
      const resLiquidFa = await fetch(`${baseUrl}/api/elements?phase=${encodeURIComponent('مایع')}`);
      const liquidFa = await resLiquidFa.json();

      assert.equal(liquidEn.length, 2);
      assert.equal(liquidFa.length, 2);
      const liquidSymbols = liquidEn.map(e => e.symbol).sort();
      assert.deepEqual(liquidSymbols, ['Br', 'Hg']);

      // فاز گاز
      const resGas = await fetch(`${baseUrl}/api/elements?phase=gas`);
      const gasElements = await resGas.json();
      assert.equal(gasElements.length, 12); // ۱۱ گاز استاندارد + Og پیش‌بینی شده

      // فاز جامد
      const resSolid = await fetch(`${baseUrl}/api/elements?phase=solid`);
      const solidElements = await resSolid.json();
      assert.equal(solidElements.length, 104);

      // مجموع فازها باید ۱۱۸ باشد
      assert.equal(liquidEn.length + gasElements.length + solidElements.length, 118);
    });

    it('GET /api/elements/:id - باید جزئیات عنصر را به همراه کانفیگ Three.js برای رندر سه‌بعدی برگرداند', async () => {
      const res = await fetch(`${baseUrl}/api/elements/26`);
      assert.equal(res.status, 200);

      const iron = await res.json();
      assert.equal(iron.number, 26);
      assert.equal(iron.symbol, 'Fe');
      assert.equal(iron.nameEn, 'Iron');
      assert.equal(iron.nameFa, 'آهن');

      // اعتبارسنجی آبجکت threeJsConfig
      assert.ok(iron.threeJsConfig, 'کانفیگ Three.js باید در پاسخ موجود باشد');
      assert.equal(iron.threeJsConfig.protons, 26);
      assert.equal(iron.threeJsConfig.electrons, 26);
      assert.ok(iron.threeJsConfig.nucleus);
      assert.ok(Array.isArray(iron.threeJsConfig.orbitals));
      assert.equal(iron.threeJsConfig.orbitals.length, iron.shells.length);

      for (const orb of iron.threeJsConfig.orbitals) {
        assert.ok(Number.isInteger(orb.shellIndex));
        assert.ok(typeof orb.shellLetter === 'string');
        assert.ok(Number.isInteger(orb.electronCount));
        assert.ok(typeof orb.radius === 'number' && orb.radius > 0);
        assert.ok(typeof orb.rotationSpeed === 'number');
      }
    });

    it('GET /api/elements/:id - باید با نماد شیمیایی و نام فارسی نیز عنصر را بیابد', async () => {
      const resSymbol = await fetch(`${baseUrl}/api/elements/Au`);
      assert.equal(resSymbol.status, 200);
      const gold = await resSymbol.json();
      assert.equal(gold.number, 79);
      assert.equal(gold.symbol, 'Au');

      const resFa = await fetch(`${baseUrl}/api/elements/${encodeURIComponent('طلا')}`);
      assert.equal(resFa.status, 200);
      const goldFa = await resFa.json();
      assert.equal(goldFa.number, 79);
    });

    it('GET /api/search?q=... - باید نتایج جستجو را بر اساس نماد، نام و عدد اتمی بیابد', async () => {
      const resSymbol = await fetch(`${baseUrl}/api/search?q=Fe`);
      assert.equal(resSymbol.status, 200);
      const dataSymbol = await resSymbol.json();
      assert.ok(dataSymbol.some(e => e.symbol === 'Fe'));

      const resName = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent('اورانیوم')}`);
      assert.equal(resName.status, 200);
      const dataName = await resName.json();
      assert.ok(dataName.some(e => e.symbol === 'U'));

      const resEmpty = await fetch(`${baseUrl}/api/search?q=`);
      assert.equal(resEmpty.status, 200);
      const dataEmpty = await resEmpty.json();
      assert.deepEqual(dataEmpty, []);
    });

    it('GET /api/quiz - باید سوالات آزمون چهارگزینه‌ای با ساختار استاندارد تولید کند', async () => {
      const res = await fetch(`${baseUrl}/api/quiz?count=6&type=symbol`);
      assert.equal(res.status, 200);

      const questions = await res.json();
      assert.ok(Array.isArray(questions));
      assert.equal(questions.length, 6);

      for (const q of questions) {
        assert.ok(Number.isInteger(q.id));
        assert.equal(q.type, 'symbol');
        assert.ok(typeof q.question === 'string' && q.question.length > 0);
        assert.ok(Array.isArray(q.options));
        assert.equal(q.options.length, 4, 'هر سوال باید دقیقا ۴ گزینه داشته باشد');
        assert.ok(q.options.includes(q.correctAnswer), 'پاسخ صحیح باید در بین گزینه‌ها وجود داشته باشد');
        assert.ok(typeof q.explanation === 'string');
      }
    });

    it('POST /api/compare - باید ماتریس مقایسه عناصر را به همراه مقادیر حداقل، حداکثر و دلتا محاسبه کند', async () => {
      const res = await fetch(`${baseUrl}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [1, 6, 26] })
      });

      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.success, true);
      assert.equal(data.count, 3);
      assert.equal(data.elements.length, 3);

      assert.ok(data.comparison);
      assert.ok(data.comparison.atomicMass);
      assert.equal(data.comparison.atomicMass.available, true);
      assert.equal(data.comparison.atomicMass.min.symbol, 'H');
      assert.equal(data.comparison.atomicMass.max.symbol, 'Fe');
      assert.ok(data.comparison.atomicMass.delta > 0);

      assert.ok(Array.isArray(data.summary));
      assert.ok(data.summary.length > 0);
    });

    // =======================================================================
    // تست رفتار سرور در مواجهه با ورودی‌های نامعتبر (Negative Testing)
    // =======================================================================
    it('رفتار سرور در مواجهه با عنصر ناموجود (عنصر ۱۱۹) باید خطای ۴۰۴ تمیز باشد', async () => {
      const res = await fetch(`${baseUrl}/api/elements/119`);
      assert.equal(res.status, 404, 'درخواست عنصر ۱۱۹ باید خطای 404 برگرداند');

      const body = await res.json();
      assert.deepEqual(
        body,
        { error: 'Element not found' },
        'پیام خطا باید دقیق و به فرمت JSON استاندارد باشد'
      );
    });

    it('درخواست عنصر با شماره ۹۹۹ یا نماد ساختگی باید خطای ۴۰۴ تمیز برگرداند', async () => {
      const resNum = await fetch(`${baseUrl}/api/elements/999`);
      assert.equal(resNum.status, 404);
      const bodyNum = await resNum.json();
      assert.equal(bodyNum.error, 'Element not found');

      const resFake = await fetch(`${baseUrl}/api/elements/FakeElementXYZ`);
      assert.equal(resFake.status, 404);
      const bodyFake = await resFake.json();
      assert.equal(bodyFake.error, 'Element not found');
    });

    it('درخواست مقایسه با ورودی نامعتبر یا خالی باید خطای ۴۰۰ یا ۴۰۴ مناسب برگرداند', async () => {
      // آرایه خالی
      const resEmpty = await fetch(`${baseUrl}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [] })
      });
      assert.equal(resEmpty.status, 400);

      // شناسه‌های کاملاً ناموجود
      const resNotFound = await fetch(`${baseUrl}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [119, 999] })
      });
      assert.equal(resNotFound.status, 404);
      const bodyNotFound = await resNotFound.json();
      assert.ok(bodyNotFound.notFound);
      assert.deepEqual(bodyNotFound.notFound, [119, 999]);
    });

    it('درخواست مسیر API تعریف‌نشده باید پاسخ ۴۰۴ با ساختار JSON بازگرداند', async () => {
      const res = await fetch(`${baseUrl}/api/non_existent_route_test`);
      assert.equal(res.status, 404);

      const data = await res.json();
      assert.ok(data.error && data.error.includes('API route not found'));
    });
  });
});