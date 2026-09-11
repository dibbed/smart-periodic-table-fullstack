const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { app } = require('../server/index');
const {
  initializeDatabase,
  closeDatabase,
  getAllElements,
  getElementById,
  getElementPhaseAtKelvin
} = require('../server/db/database');

describe('Scientific Integrity & API Automated Test Suite', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Ensure database is initialized with full 118 elements
    initializeDatabase();

    // Start HTTP server on an ephemeral free port to avoid conflicts
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
  // ۱. تضمین داده‌های علمی و عدم داده‌سازی جعلی (Scientific Data Integrity)
  // =========================================================================
  describe('1. Scientific Data Integrity & Anti-Hallucination Guarantees', () => {
    it('باید دقیقا ۱۱۸ عنصر بدون جای‌افتادگی (از ۱ تا ۱۱۸) در خروجی API وجود داشته باشد', async () => {
      const res = await fetch(`${baseUrl}/api/elements`);
      assert.equal(res.status, 200);

      const elements = await res.json();
      assert.ok(Array.isArray(elements), 'خروجی باید یک آرایه باشد');
      assert.equal(elements.length, 118, 'تعداد عناصر جدول تناوبی در خروجی API باید دقیقا ۱۱۸ باشد');

      const atomicNumbers = elements.map(e => e.number).sort((a, b) => a - b);
      const expectedNumbers = Array.from({ length: 118 }, (_, i) => i + 1);

      assert.deepEqual(
        atomicNumbers,
        expectedNumbers,
        'شماره‌های اتمی خروجی API باید دنباله‌ای پیوسته و بدون هیچ گپی از ۱ تا ۱۱۸ باشند'
      );
    });

    it('تمامی ۱۱۸ عنصر باید دارای نمادهای شیمیایی استاندارد آیوپاک یکتا و نام‌های دوزبانه معتبر باشند', async () => {
      const res = await fetch(`${baseUrl}/api/elements`);
      const elements = await res.json();
      const symbolSet = new Set();

      for (const el of elements) {
        // نماد شیمیایی استاندارد
        assert.ok(el.symbol && typeof el.symbol === 'string', `نماد برای Z=${el.number} نامعتبر است`);
        assert.ok(/^[A-Z][a-z]?$/.test(el.symbol), `فرمت نماد ${el.symbol} با استاندارد آیوپاک همخوانی ندارد`);
        assert.equal(symbolSet.has(el.symbol), false, `نماد تکراری کشف شد: ${el.symbol}`);
        symbolSet.add(el.symbol);

        // نام‌های دوزبانه
        assert.ok(typeof el.nameFa === 'string' && el.nameFa.trim().length > 0, `نام فارسی برای ${el.symbol} خالی است`);
        assert.ok(typeof el.nameEn === 'string' && el.nameEn.trim().length > 0, `نام انگلیسی برای ${el.symbol} خالی است`);

        // جرم اتمی معتبر و مثبت
        assert.ok(typeof el.atomicMass === 'number' && el.atomicMass > 0, `جرم اتمی ${el.symbol} باید عددی مثبت باشد`);
      }

      assert.equal(symbolSet.size, 118, 'باید دقیقا ۱۱۸ نماد شیمیایی متمایز وجود داشته باشد');
    });

    it('فیزیک اتم خنثی: تعداد پروتون‌ها، الکترون‌ها و مجموع لایه‌ها باید دقیقا با عدد اتمی تطابق داشته باشد', async () => {
      const res = await fetch(`${baseUrl}/api/elements`);
      const elements = await res.json();

      for (const el of elements) {
        assert.equal(el.protons, el.number, `پروتون‌های ${el.symbol} باید برابر با عدد اتمی ${el.number} باشد`);
        assert.equal(el.electrons, el.number, `الکترون‌های ${el.symbol} باید برابر با عدد اتمی ${el.number} باشد`);

        assert.ok(Array.isArray(el.shells) && el.shells.length > 0, `لایه‌های الکترونی ${el.symbol} باید آرایه‌ای غیرخالی باشد`);
        const totalElectronsInShells = el.shells.reduce((sum, count) => sum + count, 0);
        assert.equal(
          totalElectronsInShells,
          el.number,
          `مجموع الکترون‌های لایه‌های ${el.symbol} (${totalElectronsInShells}) باید دقیقا برابر Z=${el.number} باشد`
        );
      }
    });

    it('تضمین عدم داده‌سازی جعلی: عناصر فوق‌سنگین فاقد داده تجربی باید حتما برچسب isPredicted یا مقدار null داشته باشند', async () => {
      const res = await fetch(`${baseUrl}/api/elements`);
      const elements = await res.json();

      // بررسی عناصر ترانزاکتینید و فوق‌سنگین (از ۱۰۰ تا ۱۱۸)
      const superheavy = elements.filter(e => e.number >= 100);
      assert.ok(superheavy.length >= 19, 'باید حداقل ۱۹ عنصر فوق‌سنگین بررسی شوند');

      for (const el of superheavy) {
        assert.equal(
          el.isPredicted,
          true,
          `عنصر فوق‌سنگین ${el.symbol} (Z=${el.number}) باید برچسب isPredicted: true داشته باشد`
        );
        assert.equal(
          el.predicted,
          true,
          `عنصر فوق‌سنگین ${el.symbol} (Z=${el.number}) باید برچسب predicted: true داشته باشد`
        );

        // ترانزاکتینیدها (Z >= 104) فاقد مقادیر تجربی پایدار برای نقطه ذوب/جوش و چگالی هستند
        if (el.number >= 104) {
          assert.equal(
            el.meltingPoint,
            null,
            `عنصر ${el.symbol} نباید دمای ذوب جعلی داشته باشد و باید دقیقا null باشد`
          );
          assert.equal(
            el.boilingPoint,
            null,
            `عنصر ${el.symbol} نباید دمای جوش جعلی داشته باشد و باید دقیقا null باشد`
          );
          assert.equal(
            el.density,
            null,
            `عنصر ${el.symbol} نباید چگالی جعلی داشته باشد و باید دقیقا null باشد`
          );
        }

        // بررسی عدم وجود برچسب‌های ساختگی ساختار الکترونی نظیر [Z=...]
        assert.ok(
          !String(el.electronConfig || '').includes('[Z='),
          `عنصر ${el.symbol} نباید دارای کانفیگ الکترونی ساختگی با تگ [Z=] باشد`
        );
      }

      // تست دقیق عناصر اوگانسون (118) و تنسین (117)
      const og = elements.find(e => e.number === 118);
      assert.ok(og, 'اوگانسون باید در دیتابیس وجود داشته باشد');
      assert.equal(og.symbol, 'Og');
      assert.equal(og.meltingPoint, null);
      assert.equal(og.boilingPoint, null);
      assert.equal(og.density, null);
      assert.equal(og.isPredicted, true);
      assert.equal(og.predicted, true);
      assert.ok(
        og.electronConfig.includes('predicted') || og.standardState.toLowerCase().includes('expected'),
        'اوگانسون باید دارای برچسب predicted یا expected در خواص خود باشد'
      );

      const ts = elements.find(e => e.number === 117);
      assert.ok(ts, 'تنسین باید در دیتابیس وجود داشته باشد');
      assert.equal(ts.symbol, 'Ts');
      assert.equal(ts.density, null);
      assert.equal(ts.isPredicted, true);
      assert.equal(ts.predicted, true);
    });

    it('تطابق داده‌های تجربی عناصر مرجع: مقادیر فیزیکی عناصر شناخته‌شده باید دقیق و غیر null باشند', async () => {
      const resH = await fetch(`${baseUrl}/api/elements/1`);
      const h = await resH.json();
      assert.equal(h.symbol, 'H');
      assert.ok(Math.abs(h.meltingPoint - 14.01) < 0.5, 'دمای ذوب هیدروژن باید حدود ۱۴ کلوین باشد');
      assert.ok(Math.abs(h.boilingPoint - 20.28) < 0.5, 'دمای جوش هیدروژن باید حدود ۲۰.۲ کلوین باشد');
      assert.ok(h.density > 0, 'چگالی هیدروژن باید مقداری معتبر و مثبت باشد');

      const resFe = await fetch(`${baseUrl}/api/elements/26`);
      const fe = await resFe.json();
      assert.equal(fe.symbol, 'Fe');
      assert.equal(fe.isPredicted, false);
      assert.equal(fe.predicted, false);
      assert.ok(Math.abs(fe.meltingPoint - 1811) < 10, 'دمای ذوب آهن باید حدود ۱۸۱۱ کلوین باشد');
      assert.ok(Math.abs(fe.density - 7.874) < 0.05, 'چگالی آهن باید حدود ۷.۸۷ g/cm³ باشد');

      const resAu = await fetch(`${baseUrl}/api/elements/79`);
      const au = await resAu.json();
      assert.equal(au.symbol, 'Au');
      assert.equal(au.isPredicted, false);
      assert.equal(au.predicted, false);
      assert.ok(Math.abs(au.meltingPoint - 1337.33) < 5, 'دمای ذوب طلا باید حدود ۱۳۳۷ کلوین باشد');
      assert.ok(Math.abs(au.density - 19.3) < 0.2, 'چگالی طلا باید حدود ۱۹.۳ g/cm³ باشد');
    });
  });

  // =========================================================================
  // ۲. اندپوینت‌های اصلی، فیلتر فاز و شبیه‌سازی با دما (Core API Endpoints)
  // =========================================================================
  describe('2. Core API Endpoints, Phase Filtering & Temperature Simulation', () => {
    it('GET /api/health - باید وضعیت 200، وضعیت سلامت و تعداد ۱۱۸ عنصر را برگرداند', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);

      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.status, 'healthy');
      assert.equal(data.database, 'sqlite');
      assert.equal(data.elements, 118);
      assert.ok(data.timestamp, 'باید دارای تایم‌استمپ معتبر باشد');
    });

    it('GET /api/elements - باید اسکیمای کامل همه فیلدهای اصلی عناصر را ارائه دهد', async () => {
      const res = await fetch(`${baseUrl}/api/elements`);
      assert.equal(res.status, 200);

      const elements = await res.json();
      assert.equal(elements.length, 118);

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

    it('GET /api/elements?category=... - باید دسته‌بندی را در هر دو زبان انگلیسی و فارسی یکسان فیلتر کند', async () => {
      // گازهای نجیب
      const resNobleEn = await fetch(`${baseUrl}/api/elements?category=noble-gas`);
      assert.equal(resNobleEn.status, 200);
      const nobleEn = await resNobleEn.json();
      assert.equal(nobleEn.length, 7);

      const resNobleFa = await fetch(`${baseUrl}/api/elements?category=${encodeURIComponent('گاز نجیب')}`);
      assert.equal(resNobleFa.status, 200);
      const nobleFa = await resNobleFa.json();
      assert.equal(nobleFa.length, 7);

      assert.deepEqual(
        nobleEn.map(e => e.symbol).sort(),
        nobleFa.map(e => e.symbol).sort(),
        'خروجی فیلتر انگلیسی و فارسی گازهای نجیب باید کاملا یکسان باشد'
      );

      // فلزات قلیایی
      const resAlkaliEn = await fetch(`${baseUrl}/api/elements?category=alkali-metal`);
      const alkaliEn = await resAlkaliEn.json();
      assert.equal(alkaliEn.length, 6);

      const resAlkaliFa = await fetch(`${baseUrl}/api/elements?category=${encodeURIComponent('فلز قلیایی')}`);
      const alkaliFa = await resAlkaliFa.json();
      assert.equal(alkaliFa.length, 6);
      assert.deepEqual(alkaliEn.map(e => e.symbol), alkaliFa.map(e => e.symbol));
    });

    it('GET /api/elements?phase=... - باید فیلتر فاز استاندارد را برای گاز، مایع و جامد دقیق اعمال کند', async () => {
      // فاز مایع در شرایط استاندارد (شامل جیوه Hg و برم Br)
      const resLiquid = await fetch(`${baseUrl}/api/elements?phase=liquid`);
      assert.equal(resLiquid.status, 200);
      const liquid = await resLiquid.json();
      assert.equal(liquid.length, 2);
      assert.deepEqual(liquid.map(e => e.symbol).sort(), ['Br', 'Hg']);

      // فاز مایع با کلمه فارسی «مایع»
      const resLiquidFa = await fetch(`${baseUrl}/api/elements?phase=${encodeURIComponent('مایع')}`);
      assert.equal(resLiquidFa.status, 200);
      const liquidFa = await resLiquidFa.json();
      assert.equal(liquidFa.length, 2);

      // فاز گاز در شرایط استاندارد
      const resGas = await fetch(`${baseUrl}/api/elements?phase=gas`);
      const gas = await resGas.json();
      assert.equal(gas.length, 12);

      // فاز جامد در شرایط استاندارد
      const resSolid = await fetch(`${baseUrl}/api/elements?phase=solid`);
      const solid = await resSolid.json();
      assert.equal(solid.length, 104);

      // مجموع کل فازها باید دقیقا ۱۱۸ باشد
      assert.equal(liquid.length + gas.length + solid.length, 118);
    });

    it('شبیه‌سازی فاز با دمای کلوین (/api/elements?temperature=... و فیلتر ترکیبی با فاز)', async () => {
      // ۱. در دمای بسیار پایین ۱۰ کلوین: هیدروژن جامد است (نقطه ذوب ۱۴ کلوین)
      const res10KSolid = await fetch(`${baseUrl}/api/elements?temperature=10&phase=solid`);
      assert.equal(res10KSolid.status, 200);
      const elements10KSolid = await res10KSolid.json();
      assert.ok(elements10KSolid.some(e => e.symbol === 'H'), 'هیدروژن در دمای ۱۰ کلوین باید جامد باشد');

      const res10KLiquid = await fetch(`${baseUrl}/api/elements?temperature=10&phase=liquid`);
      const elements10KLiquid = await res10KLiquid.json();
      assert.equal(elements10KLiquid.some(e => e.symbol === 'H'), false, 'هیدروژن در دمای ۱۰ کلوین نباید مایع باشد');

      // ۲. در دمای ۱۵ کلوین: هیدروژن ذوب شده و مایع است (14.01K < T < 20.28K)
      const res15KLiquid = await fetch(`${baseUrl}/api/elements?temperature=15&phase=liquid`);
      const elements15KLiquid = await res15KLiquid.json();
      assert.ok(elements15KLiquid.some(e => e.symbol === 'H'), 'هیدروژن در دمای ۱۵ کلوین باید مایع باشد');

      // ۳. در دمای اتاق (۲۹۸ کلوین): برم و جیوه مایع هستند
      const res298KLiquid = await fetch(`${baseUrl}/api/elements?temperature=298&phase=liquid`);
      const elements298KLiquid = await res298KLiquid.json();
      assert.ok(elements298KLiquid.some(e => e.symbol === 'Br'));
      assert.ok(elements298KLiquid.some(e => e.symbol === 'Hg'));

      // ۴. در دمای بالا (۲۰۰۰ کلوین): آهن ذوب شده (نقطه ذوب ۱۸۱۱ کلوین) و مایع است
      const res2000KLiquid = await fetch(`${baseUrl}/api/elements?temperature=2000&phase=liquid`);
      const elements2000KLiquid = await res2000KLiquid.json();
      assert.ok(elements2000KLiquid.some(e => e.symbol === 'Fe'), 'آهن در دمای ۲۰۰۰ کلوین باید در فاز مایع باشد');
      assert.ok(elements2000KLiquid.some(e => e.symbol === 'Au'), 'طلا در دمای ۲۰۰۰ کلوین باید در فاز مایع باشد');

      // ۵. در دمای ۴۰۰۰ کلوین: آهن (جوش ۳۱۳۴ کلوین) و طلا (جوش ۳۲۴۳ کلوین) تبخیر شده و گاز هستند
      const res4000KGas = await fetch(`${baseUrl}/api/elements?temperature=4000&phase=gas`);
      const elements4000KGas = await res4000KGas.json();
      assert.ok(elements4000KGas.some(e => e.symbol === 'Fe'), 'آهن در دمای ۴۰۰۰ کلوین باید گاز باشد');
      assert.ok(elements4000KGas.some(e => e.symbol === 'Au'), 'طلا در دمای ۴۰۰۰ کلوین باید گاز باشد');

      // ۶. بررسی ویژگی phaseAtTemp در پاسخ عمومی دما
      const resTempAll = await fetch(`${baseUrl}/api/elements?temperature=300`);
      assert.equal(resTempAll.status, 200);
      const allAt300K = await resTempAll.json();
      assert.equal(allAt300K.length, 118);
      const feAt300 = allAt300K.find(e => e.symbol === 'Fe');
      assert.equal(feAt300.phaseAtTemp, 'solid');
      const hgAt300 = allAt300K.find(e => e.symbol === 'Hg');
      assert.equal(hgAt300.phaseAtTemp, 'liquid');
      const heAt300 = allAt300K.find(e => e.symbol === 'He');
      assert.equal(heAt300.phaseAtTemp, 'gas');

      // ۷. پشتیبانی از نام مستعار temp در پارامترهای کوئری
      const resAliasTemp = await fetch(`${baseUrl}/api/elements?temp=300`);
      assert.equal(resAliasTemp.status, 200);
      const aliasData = await resAliasTemp.json();
      assert.equal(aliasData.length, 118);
      assert.equal(aliasData.find(e => e.symbol === 'Fe').phaseAtTemp, 'solid');

      // ۸. مرز صفر مطلق (0 کلوین): عناصر شناخته‌شده باید در فاز جامد باشند
      const resZeroK = await fetch(`${baseUrl}/api/elements?temperature=0`);
      assert.equal(resZeroK.status, 200);
      const zeroKData = await resZeroK.json();
      assert.equal(zeroKData.find(e => e.symbol === 'Fe').phaseAtTemp, 'solid');

      // ۹. دمای ۳۰۵ کلوین (ذوب گالیوم با نقطه ذوب ۳۰۲.۹۱ کلوین): گالیوم باید مایع باشد
      const res305KLiquid = await fetch(`${baseUrl}/api/elements?temperature=305&phase=liquid`);
      assert.equal(res305KLiquid.status, 200);
      const elements305KLiquid = await res305KLiquid.json();
      assert.ok(elements305KLiquid.some(e => e.symbol === 'Ga'), 'گالیوم در دمای ۳۰۵ کلوین باید مایع باشد');
      assert.ok(elements305KLiquid.some(e => e.symbol === 'Br'), 'برم در دمای ۳۰۵ کلوین باید مایع باشد');
      assert.ok(elements305KLiquid.some(e => e.symbol === 'Hg'), 'جیوه در دمای ۳۰۵ کلوین باید مایع باشد');
    });

    it('GET /api/elements/:id - باید جزئیات کامل عنصر و کانفیگ Three.js را برای مدل سه‌بعدی بازگرداند', async () => {
      const res = await fetch(`${baseUrl}/api/elements/26`);
      assert.equal(res.status, 200);

      const iron = await res.json();
      assert.equal(iron.number, 26);
      assert.equal(iron.symbol, 'Fe');
      assert.equal(iron.nameEn, 'Iron');
      assert.equal(iron.nameFa, 'آهن');

      // اعتبارسنجی کانفیگ رندر سه‌بعدی Three.js
      assert.ok(iron.threeJsConfig, 'آبجکت threeJsConfig باید در خروجی موجود باشد');
      assert.equal(iron.threeJsConfig.protons, 26);
      assert.equal(iron.threeJsConfig.electrons, 26);
      assert.ok(iron.threeJsConfig.nucleus);
      assert.ok(iron.threeJsConfig.nucleus.totalNucleons > 0);
      assert.ok(iron.threeJsConfig.nucleus.visibleProtons > 0);
      assert.ok(Array.isArray(iron.threeJsConfig.orbitals));
      assert.equal(iron.threeJsConfig.orbitals.length, iron.shells.length);

      for (const orb of iron.threeJsConfig.orbitals) {
        assert.ok(Number.isInteger(orb.shellIndex));
        assert.ok(typeof orb.shellLetter === 'string');
        assert.ok(orb.electronCount > 0);
        assert.ok(typeof orb.radius === 'number' && orb.radius > 0);
        assert.ok(typeof orb.rotationSpeed === 'number' && orb.rotationSpeed > 0);
      }
    });

    it('GET /api/elements/:id - باید با نماد (حساس نبودن به حروف کوچک/بزرگ) و نام فارسی کار کند', async () => {
      const resSymbolLower = await fetch(`${baseUrl}/api/elements/fe`);
      assert.equal(resSymbolLower.status, 200);
      const iron = await resSymbolLower.json();
      assert.equal(iron.number, 26);
      assert.equal(iron.symbol, 'Fe');

      const resSymbolUpper = await fetch(`${baseUrl}/api/elements/Au`);
      assert.equal(resSymbolUpper.status, 200);
      const gold = await resSymbolUpper.json();
      assert.equal(gold.number, 79);

      const resFa = await fetch(`${baseUrl}/api/elements/${encodeURIComponent('طلا')}`);
      assert.equal(resFa.status, 200);
      const goldFa = await resFa.json();
      assert.equal(goldFa.number, 79);
    });

    it('GET /api/search?q=... - جستجوی سریع عناصر بر اساس نماد، نام و شماره اتمی', async () => {
      // بر اساس نماد
      const resSymbol = await fetch(`${baseUrl}/api/search?q=Fe`);
      assert.equal(resSymbol.status, 200);
      const dataSymbol = await resSymbol.json();
      assert.ok(dataSymbol.some(e => e.symbol === 'Fe'));

      // بر اساس نام فارسی
      const resName = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent('اورانیوم')}`);
      assert.equal(resName.status, 200);
      const dataName = await resName.json();
      assert.ok(dataName.some(e => e.symbol === 'U'));

      // جستجوی خالی
      const resEmpty = await fetch(`${baseUrl}/api/search?q=`);
      assert.equal(resEmpty.status, 200);
      const dataEmpty = await resEmpty.json();
      assert.deepEqual(dataEmpty, []);
    });

    it('GET /api/quiz - تولید سوالات چهارگزینه‌ای تصادفی با توزیع یکنواخت و گزینه‌های معتبر', async () => {
      const res = await fetch(`${baseUrl}/api/quiz?count=8&type=symbol`);
      assert.equal(res.status, 200);

      const questions = await res.json();
      assert.ok(Array.isArray(questions));
      assert.equal(questions.length, 8);

      for (const q of questions) {
        assert.ok(Number.isInteger(q.id));
        assert.equal(q.type, 'symbol');
        assert.ok(typeof q.question === 'string' && q.question.length > 0);
        assert.ok(Array.isArray(q.options));
        assert.equal(q.options.length, 4, 'هر سوال چهارگزینه‌ای باید دقیقا ۴ گزینه داشته باشد');
        assert.ok(q.options.includes(q.correctAnswer), 'گزینه‌ها باید پاسخ صحیح را در بر داشته باشند');
        assert.ok(typeof q.explanation === 'string' && q.explanation.length > 0);
      }
    });

    it('POST /api/compare - محاسبه ماتریس آماری مقایسه چند عنصره با حذف شناسه تکراری', async () => {
      const res = await fetch(`${baseUrl}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [1, 6, 26, 'fe', 'Iron'] })
      });

      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.success, true);
      // عناصر تکراری ۲۶، fe و Iron باید به یک عنصر تجمیع شوند (۱، ۶، ۲۶ -> ۳ عنصر متمایز)
      assert.equal(data.count, 3);
      assert.equal(data.elements.length, 3);

      assert.ok(data.comparison);
      assert.ok(data.comparison.atomicMass);
      assert.equal(data.comparison.atomicMass.available, true);
      assert.equal(data.comparison.atomicMass.min.symbol, 'H');
      assert.equal(data.comparison.atomicMass.max.symbol, 'Fe');
      assert.ok(data.comparison.atomicMass.delta > 0);
      assert.ok(Array.isArray(data.summary) && data.summary.length > 0);
    });
  });

  // =========================================================================
  // ۳. تست رفتارهای منفی و خطای ۴۰۴ تمیز (Negative Testing & Clean 404)
  // =========================================================================
  describe('3. Negative Testing & Clean 404 Error Handling', () => {
    it('درخواست عنصر خارج از بازه ۱۱۸ تایی (عنصر ۱۱۹) باید خطای ۴۰۴ استاندارد JSON برگرداند', async () => {
      const res = await fetch(`${baseUrl}/api/elements/119`);
      assert.equal(res.status, 404, 'درخواست Z=119 باید کد وضعیت 404 داشته باشد');

      const body = await res.json();
      assert.deepEqual(
        body,
        { error: 'Element not found' },
        'پاسخ خطای عنصر ناموجود باید دقیقاً آبجکت JSON استاندارد باشد'
      );
    });

    it('درخواست عنصر با شماره ۹۹۹ یا عدد منفی یا صفر باید خطای ۴۰۴ تمیز برگرداند', async () => {
      const res999 = await fetch(`${baseUrl}/api/elements/999`);
      assert.equal(res999.status, 404);
      const body999 = await res999.json();
      assert.equal(body999.error, 'Element not found');

      const resZero = await fetch(`${baseUrl}/api/elements/0`);
      assert.equal(resZero.status, 404);
      const bodyZero = await resZero.json();
      assert.equal(bodyZero.error, 'Element not found');

      const resNegative = await fetch(`${baseUrl}/api/elements/-5`);
      assert.equal(resNegative.status, 404);
      const bodyNegative = await resNegative.json();
      assert.equal(bodyNegative.error, 'Element not found');
    });

    it('درخواست با نماد شیمیایی نامعتبر و ساختگی باید خطای ۴۰۴ تمیز برگرداند', async () => {
      const resFake = await fetch(`${baseUrl}/api/elements/FakeElementXYZ`);
      assert.equal(resFake.status, 404);
      const bodyFake = await resFake.json();
      assert.equal(bodyFake.error, 'Element not found');

      const resXz = await fetch(`${baseUrl}/api/elements/Xz`);
      assert.equal(resXz.status, 404);
      const bodyXz = await resXz.json();
      assert.equal(bodyXz.error, 'Element not found');
    });

    it('درخواست مسیر API تعریف‌نشده باید خطای ۴۰۴ با ساختار JSON بازگرداند', async () => {
      const res = await fetch(`${baseUrl}/api/non_existent_route_random_xyz`);
      assert.equal(res.status, 404);

      const body = await res.json();
      assert.ok(body.error && body.error.includes('API route not found'));
    });

    it('درخواست مقایسه با داده نامعتبر یا فراتر از محدودیت باید پاسخ ۴۰۰ یا ۴۰۴ مناسب برگرداند', async () => {
      // بدنه خالی
      const resEmpty = await fetch(`${baseUrl}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [] })
      });
      assert.equal(resEmpty.status, 400);

      // بیش از ۲۰ عنصر (محدودیت سقف سرور)
      const resLimit = await fetch(`${baseUrl}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from({ length: 25 }, (_, i) => i + 1) })
      });
      assert.equal(resLimit.status, 400);
      const bodyLimit = await resLimit.json();
      assert.ok(bodyLimit.error.includes('maximum of 20'));

      // عناصر کاملا ناموجود
      const resNotFound = await fetch(`${baseUrl}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [999, 1000] })
      });
      assert.equal(resNotFound.status, 404);
      const bodyNotFound = await resNotFound.json();
      assert.deepEqual(bodyNotFound.notFound, [999, 1000]);
    });

    it('درخواست فیلتر با دمای منفی (زیر صفر مطلق) باید خطای ۴۰۰ بازگرداند', async () => {
      const res = await fetch(`${baseUrl}/api/elements?temperature=-50`);
      assert.equal(res.status, 400);

      const body = await res.json();
      assert.ok(body.error && body.error.includes('Invalid temperature'));
    });

    it('درخواست فیلتر با دمای غیرعددی و نامعتبر باید خطای ۴۰۰ بازگرداند', async () => {
      const res = await fetch(`${baseUrl}/api/elements?temperature=not_a_valid_temp`);
      assert.equal(res.status, 400);

      const body = await res.json();
      assert.ok(body.error && body.error.includes('Invalid temperature'));
    });

    it('هدرهای امنیتی سرور (Security Headers) باید در تمامی پاسخ‌ها حضور داشته باشند', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    });
  });
});
