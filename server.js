const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

/** @type {Map<string, any>} */
const orders = new Map();
let orderCounter = 1000;

const STATUS_FLOW = ['pending', 'accepted', 'preparing', 'ready', 'completed'];
const STATUS_LABELS = {
  pending: 'بانتظار موافقة المطبخ',
  accepted: 'تم القبول',
  preparing: 'قيد التحضير',
  ready: 'جاهز للاستلام',
  completed: 'تم التسليم',
  rejected: 'مرفوض',
};

function serializeOrder(order) {
  return { ...order, statusLabel: STATUS_LABELS[order.status] || order.status };
}

function broadcastOrder(order) {
  io.emit('order:updated', serializeOrder(order));
}

// ---------------------------------------------------------------------------
// REST API
// ---------------------------------------------------------------------------

app.get('/api/menu', (req, res) => {
  res.json(menu);
});

app.get('/api/orders', (req, res) => {
  res.json([...orders.values()].map(serializeOrder).sort((a, b) => b.createdAt - a.createdAt));
});

// ---------------------------------------------------------------------------
// Socket.io - التزامن اللحظي بين العميل والمطبخ
// ---------------------------------------------------------------------------

io.on('connection', (socket) => {
  socket.on('join', (role) => {
    if (role === 'kitchen' || role === 'customer') {
      socket.join(role);
    }
  });

  socket.on('order:create', (payload, ack) => {
    try {
      const items = Array.isArray(payload?.items) ? payload.items : [];
      if (items.length === 0) throw new Error('السلة فارغة');

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
        customerName: (payload?.customerName || 'زبون').toString().slice(0, 40),
        tableNumber: (payload?.tableNumber || '').toString().slice(0, 10),
        notes: (payload?.notes || '').toString().slice(0, 200),
        items: enrichedItems,
        total,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      orders.set(order.id, order);
      broadcastOrder(order);
      if (typeof ack === 'function') ack({ ok: true, order: serializeOrder(order) });
    } catch (err) {
      if (typeof ack === 'function') ack({ ok: false, error: err.message });
    }
  });

  socket.on('order:status', (payload, ack) => {
    try {
      const order = orders.get(payload?.id);
      if (!order) throw new Error('الطلب غير موجود');
      const status = payload.status;
      if (!STATUS_FLOW.includes(status) && status !== 'rejected') throw new Error('حالة غير صحيحة');

      order.status = status;
      order.updatedAt = Date.now();
      broadcastOrder(order);
      if (typeof ack === 'function') ack({ ok: true });
    } catch (err) {
      if (typeof ack === 'function') ack({ ok: false, error: err.message });
    }
  });

  socket.on('orders:sync', (_payload, ack) => {
    if (typeof ack === 'function') {
      ack([...orders.values()].map(serializeOrder).sort((a, b) => b.createdAt - a.createdAt));
    }
  });
});

server.listen(PORT, () => {
  console.log(`🍽  Restaurant demo server running: http://localhost:${PORT}`);
});
