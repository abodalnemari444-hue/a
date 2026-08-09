require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const sessionMiddleware = session({
  secret: crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 },
});

app.use(express.json());
app.use(sessionMiddleware);

// ---------------------------------------------------------------------------
// بيانات تجريبية في الذاكرة (بدون قاعدة بيانات - تُفقد عند إعادة تشغيل السيرفر)
// ---------------------------------------------------------------------------

const menu = [
  { id: 'm1', category: 'مقبلات', name: 'حمص بالطحينة', desc: 'حمص كريمي مع زيت زيتون وصنوبر', price: 14, emoji: '🥙', available: true },
  { id: 'm2', category: 'مقبلات', name: 'سلطة فتوش', desc: 'خضار طازجة مع خبز مقرمش ودبس الرمان', price: 16, emoji: '🥗', available: true },
  { id: 'm3', category: 'مقبلات', name: 'كبة مقلية', desc: '٦ قطع كبة محشوة باللحم والصنوبر', price: 22, emoji: '🍢', available: true },
  { id: 'm4', category: 'أطباق رئيسية', name: 'مشاوي مشكلة', desc: 'تشكيلة من الكباب والريش والدجاج', price: 65, emoji: '🍖', available: true },
  { id: 'm5', category: 'أطباق رئيسية', name: 'برياني دجاج', desc: 'أرز برياني مع دجاج متبل وبهارات خاصة', price: 42, emoji: '🍛', available: true },
  { id: 'm6', category: 'أطباق رئيسية', name: 'باستا ألفريدو', desc: 'باستا بصوص الكريمة والفطر', price: 38, emoji: '🍝', available: true },
  { id: 'm7', category: 'أطباق رئيسية', name: 'برجر لحم مشوي', desc: 'برجر لحم مع جبن شيدر وبطاطس مقلية', price: 34, emoji: '🍔', available: true },
  { id: 'm8', category: 'مشروبات', name: 'عصير برتقال طازج', desc: 'عصير طبيعي ١٠٠٪', price: 12, emoji: '🍊', available: true },
  { id: 'm9', category: 'مشروبات', name: 'ليموناضة بالنعناع', desc: 'مثلجة ومنعشة', price: 13, emoji: '🍋', available: true },
  { id: 'm10', category: 'مشروبات', name: 'قهوة عربية', desc: 'تقدم مع تمر', price: 10, emoji: '☕', available: true },
  { id: 'm11', category: 'حلويات', name: 'كنافة نابلسية', desc: 'كنافة بالجبن مع القطر', price: 24, emoji: '🍮', available: true },
  { id: 'm12', category: 'حلويات', name: 'أم علي', desc: 'حلا ساخن بالمكسرات والقشطة', price: 20, emoji: '🍰', available: true },
];

/** @type {Map<string, any>} email(lowercase) -> user */
const users = new Map();
let userCounter = 100;

// ---------------------------------------------------------------------------
// حفظ الحسابات على القرص حتى لا تُفقد عند إعادة تشغيل السيرفر
// (الطلبات والمنيو تبقى في الذاكرة فقط كما هو متفق، لكن الحسابات لازم تبقى)
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function loadUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const list = JSON.parse(raw);
    list.forEach((u) => users.set(u.email, u));
    const maxId = list.reduce((max, u) => Math.max(max, parseInt(String(u.id).replace('u', ''), 10) || 0), 100);
    userCounter = maxId;
    console.log(`[users] تم تحميل ${list.length} حساب محفوظ`);
  } catch (err) {
    // لا يوجد ملف بعد (أول تشغيل) - نبدأ بقائمة فارغة
  }
}

function persistUsers() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify([...users.values()], null, 2), 'utf8');
  } catch (err) {
    console.error('[users] فشل حفظ بيانات الحسابات:', err.message);
  }
}

loadUsers();

/** @type {Map<string, any>} email(lowercase) -> pending registration awaiting phone verification */
const pendingRegistrations = new Map();
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 45 * 1000;

const SMS_CONFIGURED = Boolean(
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER
);

function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

async function sendVerificationSms(toPhone, code) {
  console.log(`[verify] كود التحقق لـ ${toPhone}: ${code}`);
  if (!SMS_CONFIGURED) {
    throw new Error('لا توجد بيانات خدمة SMS (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER)');
  }
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
  const body = new URLSearchParams({
    To: toPhone,
    From: TWILIO_FROM_NUMBER,
    Body: `رمز التحقق الخاص بك في مطعم البيت الشامي: ${code}`,
  });
  const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Twilio error ${resp.status}: ${errText}`);
  }
}

/** @type {Map<string, any>} */
const orders = new Map();
let orderCounter = 1000;

const STATUS_FLOW = ['pending', 'preparing', 'ready', 'completed'];
const STATUS_LABELS = {
  pending: 'بانتظار موافقة المطبخ',
  preparing: 'قيد التحضير',
  ready: 'جاهز للاستلام',
  completed: 'تم التسليم',
  rejected: 'مرفوض',
};

function serializeOrder(order) {
  return { ...order, statusLabel: STATUS_LABELS[order.status] || order.status };
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, salt, expectedHash) {
  const actual = Buffer.from(hashPassword(password, salt), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim()); }
function isValidPhone(v) { return /^\+?\d{7,15}$/.test(String(v || '').trim()); }

app.post('/api/auth/register', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const phone = String(req.body.phone || '').trim();
  const name = String(req.body.name || '').trim().slice(0, 40);
  const role = req.body.role;

  if (!name) return res.status(400).json({ ok: false, error: 'الاسم مطلوب' });
  if (!isValidEmail(email)) return res.status(400).json({ ok: false, error: 'بريد إلكتروني غير صالح' });
  if (password.length < 6) return res.status(400).json({ ok: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
  if (!isValidPhone(phone)) return res.status(400).json({ ok: false, error: 'رقم جوال غير صالح' });
  if (!['customer', 'kitchen'].includes(role)) return res.status(400).json({ ok: false, error: 'نوع حساب غير صالح' });
  if (users.has(email)) return res.status(400).json({ ok: false, error: 'هذا البريد مستخدم مسبقاً' });

  const salt = crypto.randomBytes(16).toString('hex');
  const code = generateCode();
  pendingRegistrations.set(email, {
    name,
    email,
    phone,
    role,
    salt,
    passwordHash: hashPassword(password, salt),
    code,
    codeExpires: Date.now() + CODE_TTL_MS,
    lastSentAt: Date.now(),
  });

  let smsFailed = false;
  try {
    await sendVerificationSms(phone, code);
  } catch (err) {
    console.error('[verify] فشل إرسال الرسالة النصية، سيتم عرض الرمز مباشرة كبديل:', err.message);
    smsFailed = true;
  }

  res.json({
    ok: true,
    pendingVerification: true,
    email,
    phone,
    // بديل مؤقت عندما يتعذر إرسال SMS فعلياً (مثلاً ما فيه حساب Twilio) حتى لا يتوقف الاختبار
    ...(smsFailed ? { smsFailed: true, devCode: code } : {}),
  });
});

app.post('/api/auth/verify', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim();
  const pending = pendingRegistrations.get(email);

  if (!pending) return res.status(400).json({ ok: false, error: 'لا يوجد تسجيل بانتظار التحقق لهذا الحساب' });
  if (Date.now() > pending.codeExpires) {
    pendingRegistrations.delete(email);
    return res.status(400).json({ ok: false, error: 'انتهت صلاحية الرمز، اطلب رمزاً جديداً' });
  }
  if (code !== pending.code) return res.status(400).json({ ok: false, error: 'رمز التحقق غير صحيح' });

  userCounter += 1;
  const user = {
    id: 'u' + userCounter,
    name: pending.name,
    email: pending.email,
    phone: pending.phone,
    role: pending.role,
    salt: pending.salt,
    passwordHash: pending.passwordHash,
    createdAt: Date.now(),
  };
  users.set(email, user);
  persistUsers();
  pendingRegistrations.delete(email);

  req.session.user = publicUser(user);
  res.json({ ok: true, user: publicUser(user) });
});

app.post('/api/auth/resend', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const pending = pendingRegistrations.get(email);
  if (!pending) return res.status(400).json({ ok: false, error: 'لا يوجد تسجيل بانتظار التحقق لهذا الحساب' });

  const sinceLast = Date.now() - pending.lastSentAt;
  if (sinceLast < RESEND_COOLDOWN_MS) {
    return res.status(429).json({ ok: false, error: 'انتظر قليلاً قبل طلب رمز جديد', retryAfterMs: RESEND_COOLDOWN_MS - sinceLast });
  }

  pending.code = generateCode();
  pending.codeExpires = Date.now() + CODE_TTL_MS;
  pending.lastSentAt = Date.now();

  let smsFailed = false;
  try {
    await sendVerificationSms(pending.phone, pending.code);
  } catch (err) {
    console.error('[verify] فشل إرسال الرسالة النصية، سيتم عرض الرمز مباشرة كبديل:', err.message);
    smsFailed = true;
  }

  res.json({ ok: true, ...(smsFailed ? { smsFailed: true, devCode: pending.code } : {}) });
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = users.get(email);
  if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
    return res.status(401).json({ ok: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  }
  req.session.user = publicUser(user);
  res.json({ ok: true, user: publicUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ ok: false });
  res.json({ ok: true, user: req.session.user });
});

// ---------------------------------------------------------------------------
// حماية الصفحات: لازم تسجيل دخول، وكل دور يروح لصفحته فقط
// ---------------------------------------------------------------------------

function requireAuth(role) {
  return (req, res, next) => {
    const u = req.session.user;
    if (!u) return res.redirect('/index.html');
    if (role && u.role !== role) return res.redirect(u.role === 'kitchen' ? '/kitchen.html' : '/menu.html');
    next();
  };
}

app.get(['/', '/index.html'], (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.user.role === 'kitchen' ? '/kitchen.html' : '/menu.html');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/menu.html', requireAuth('customer'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'menu.html'));
});

app.get('/kitchen.html', requireAuth('kitchen'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kitchen.html'));
});

app.get('/settings.html', requireAuth(), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// REST API
// ---------------------------------------------------------------------------

app.get('/api/menu', (req, res) => {
  res.json(menu);
});

// ---------------------------------------------------------------------------
// Socket.io - التزامن اللحظي بين العميل والمطبخ (مرتبط بجلسة تسجيل الدخول)
// ---------------------------------------------------------------------------

io.use((socket, next) => sessionMiddleware(socket.request, {}, next));
io.use((socket, next) => {
  if (socket.request.session && socket.request.session.user) return next();
  next(new Error('unauthorized'));
});

function broadcastOrder(order) {
  io.to('kitchen').emit('order:updated', order);
  io.to('user:' + order.customerId).emit('order:updated', order);
}

io.on('connection', (socket) => {
  const me = socket.request.session.user;
  socket.join(me.role);
  socket.join('user:' + me.id);

  socket.on('order:create', (payload, ack) => {
    try {
      if (me.role !== 'customer') throw new Error('غير مخوّل');
      const items = Array.isArray(payload?.items) ? payload.items : [];
      if (items.length === 0) throw new Error('السلة فارغة');
      const tableNumber = (payload?.tableNumber || '').toString().trim().slice(0, 10);
      if (!tableNumber) throw new Error('رقم الطاولة مطلوب');

      const enrichedItems = items.map((it) => {
        const menuItem = menu.find((m) => m.id === it.id);
        if (!menuItem) throw new Error('صنف غير موجود');
        const qty = Math.max(1, Math.min(20, Number(it.qty) || 1));
        return { id: menuItem.id, name: menuItem.name, price: menuItem.price, emoji: menuItem.emoji, qty };
      });

      const total = enrichedItems.reduce((sum, it) => sum + it.price * it.qty, 0);
      orderCounter += 1;
      const order = {
        id: 'ORD-' + orderCounter,
        customerId: me.id,
        customerName: me.name,
        customerPhone: me.phone,
        tableNumber,
        notes: (payload?.notes || '').toString().slice(0, 200),
        items: enrichedItems,
        total,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      orders.set(order.id, order);
      broadcastOrder(serializeOrder(order));
      if (typeof ack === 'function') ack({ ok: true, order: serializeOrder(order) });
    } catch (err) {
      if (typeof ack === 'function') ack({ ok: false, error: err.message });
    }
  });

  socket.on('order:status', (payload, ack) => {
    try {
      if (me.role !== 'kitchen') throw new Error('غير مخوّل');
      const order = orders.get(payload?.id);
      if (!order) throw new Error('الطلب غير موجود');
      const status = payload.status;
      if (!STATUS_FLOW.includes(status) && status !== 'rejected') throw new Error('حالة غير صحيحة');

      order.status = status;
      order.updatedAt = Date.now();
      broadcastOrder(serializeOrder(order));
      if (typeof ack === 'function') ack({ ok: true });
    } catch (err) {
      if (typeof ack === 'function') ack({ ok: false, error: err.message });
    }
  });

  socket.on('orders:sync', (_payload, ack) => {
    if (typeof ack !== 'function') return;
    let list = [...orders.values()];
    if (me.role === 'customer') list = list.filter((o) => o.customerId === me.id);
    ack(list.map(serializeOrder).sort((a, b) => b.createdAt - a.createdAt));
  });
});

server.listen(PORT, () => {
  console.log(`🍽  Restaurant demo server running: http://localhost:${PORT}`);
});
