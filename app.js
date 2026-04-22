// ============================================================
// MIRASTORE v5 — Upgraded App Data & Utilities
// Investo Marketplace Platform
// ============================================================

const MS = {
  init() {
    // ---- First-run: seed empty data stores (NO dummy data) ----
    if (!localStorage.getItem('ms_vendors')) {
      localStorage.setItem('ms_vendors', JSON.stringify([]));
    }
    if (!localStorage.getItem('ms_products')) {
      localStorage.setItem('ms_products', JSON.stringify([]));
    }
    if (!localStorage.getItem('ms_orders')) {
      localStorage.setItem('ms_orders', JSON.stringify([]));
    }
    if (!localStorage.getItem('ms_users')) {
      // Only admin account seeded — password is a placeholder (admin MUST change on first login)
      localStorage.setItem('ms_users', JSON.stringify([
        {
          id: 'admin1',
          name: 'Admin',
          email: 'admin@mirastore.ng',
          role: 'admin',
          password: 'CHANGE_ME_ON_FIRST_LOGIN',
          mustChangePassword: true
        }
      ]));
    }
    if (!localStorage.getItem('ms_cart')) localStorage.setItem('ms_cart', JSON.stringify([]));
    if (!localStorage.getItem('ms_complaints')) localStorage.setItem('ms_complaints', JSON.stringify([]));
    if (!localStorage.getItem('ms_messages')) localStorage.setItem('ms_messages', JSON.stringify([]));
    if (!localStorage.getItem('ms_chats')) localStorage.setItem('ms_chats', JSON.stringify([]));
    if (!localStorage.getItem('ms_bargains')) localStorage.setItem('ms_bargains', JSON.stringify([]));
    if (!localStorage.getItem('ms_inventory')) localStorage.setItem('ms_inventory', JSON.stringify([]));
    if (!localStorage.getItem('ms_vendor_payments')) localStorage.setItem('ms_vendor_payments', JSON.stringify([]));
  },

  // ---- Getters / Setters ----
  getVendors()        { return JSON.parse(localStorage.getItem('ms_vendors') || '[]'); },
  getProducts()       { return JSON.parse(localStorage.getItem('ms_products') || '[]'); },
  getOrders()         { return JSON.parse(localStorage.getItem('ms_orders') || '[]'); },
  getUsers()          { return JSON.parse(localStorage.getItem('ms_users') || '[]'); },
  getCart()           { return JSON.parse(localStorage.getItem('ms_cart') || '[]'); },
  getComplaints()     { return JSON.parse(localStorage.getItem('ms_complaints') || '[]'); },
  getMessages()       { return JSON.parse(localStorage.getItem('ms_messages') || '[]'); },
  getChats()          { return JSON.parse(localStorage.getItem('ms_chats') || '[]'); },
  getBargains()       { return JSON.parse(localStorage.getItem('ms_bargains') || '[]'); },
  getInventory()      { return JSON.parse(localStorage.getItem('ms_inventory') || '[]'); },
  getVendorPayments() { return JSON.parse(localStorage.getItem('ms_vendor_payments') || '[]'); },
  getCurrentUser()    { const u = localStorage.getItem('ms_current_user'); return u ? JSON.parse(u) : null; },

  saveVendors(d)        { localStorage.setItem('ms_vendors', JSON.stringify(d)); },
  saveProducts(d)       { localStorage.setItem('ms_products', JSON.stringify(d)); },
  saveOrders(d)         { localStorage.setItem('ms_orders', JSON.stringify(d)); },
  saveUsers(d)          { localStorage.setItem('ms_users', JSON.stringify(d)); },
  saveCart(d)           { localStorage.setItem('ms_cart', JSON.stringify(d)); },
  saveComplaints(d)     { localStorage.setItem('ms_complaints', JSON.stringify(d)); },
  saveMessages(d)       { localStorage.setItem('ms_messages', JSON.stringify(d)); },
  saveChats(d)          { localStorage.setItem('ms_chats', JSON.stringify(d)); },
  saveBargains(d)       { localStorage.setItem('ms_bargains', JSON.stringify(d)); },
  saveInventory(d)      { localStorage.setItem('ms_inventory', JSON.stringify(d)); },
  saveVendorPayments(d) { localStorage.setItem('ms_vendor_payments', JSON.stringify(d)); },
  setCurrentUser(u)     { localStorage.setItem('ms_current_user', JSON.stringify(u)); },
  logout()              { localStorage.removeItem('ms_current_user'); window.location.href = 'login.html'; },

  getProductById(id)  { return this.getProducts().find(p => p.id === id); },
  getVendorById(id)   { return this.getVendors().find(v => v.id === id); },
  getUserById(id)     { return this.getUsers().find(u => u.id === id); },

  // ---- Password Management ----
  changePassword(userId, newPassword) {
    const users = this.getUsers();
    const u = users.find(x => x.id === userId);
    if (!u) return false;
    u.password = newPassword;
    u.mustChangePassword = false;
    this.saveUsers(users);
    // Also update current session
    const cu = this.getCurrentUser();
    if (cu && cu.id === userId) {
      cu.password = newPassword;
      cu.mustChangePassword = false;
      this.setCurrentUser(cu);
    }
    return true;
  },

  adminForcePasswordChange(userId, newPassword) {
    return this.changePassword(userId, newPassword);
  },

  // ---- Cart ----
  addToCart(productId, qty = 1) {
    const cart = this.getCart();
    const ex = cart.find(i => i.productId === productId);
    if (ex) ex.qty += qty; else cart.push({ productId, qty });
    this.saveCart(cart); this.updateCartBadge();
    this.showToast('Added to cart! 🛒', 'success');
  },
  removeFromCart(productId) { this.saveCart(this.getCart().filter(i => i.productId !== productId)); this.updateCartBadge(); },
  updateQty(productId, qty) {
    if (qty <= 0) { this.removeFromCart(productId); return; }
    const cart = this.getCart();
    const item = cart.find(i => i.productId === productId);
    if (item) item.qty = qty;
    this.saveCart(cart);
  },
  getCartTotal() { return this.getCart().reduce((s, i) => { const p = this.getProductById(i.productId); return s + (p ? p.price * i.qty : 0); }, 0); },
  updateCartBadge() {
    const count = this.getCart().reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('.cart-count').forEach(el => { el.textContent = count; el.style.display = count > 0 ? 'flex' : 'none'; });
  },

  // ---- Orders ----
  createOrder(data) {
    const orders = this.getOrders();
    const order = { id: 'ORD-' + String(orders.length + 1).padStart(3, '0'), ...data, date: new Date().toISOString().split('T')[0], status: 'pending', paymentStatus: 'receipt_uploaded' };
    orders.push(order);
    this.saveOrders(orders);
    data.items.forEach(item => {
      const products = this.getProducts();
      const prod = products.find(pr => pr.id === item.productId);
      if (prod) { prod.stock = Math.max(0, prod.stock - item.qty); prod.sales = (prod.sales || 0) + item.qty; this.saveProducts(products); }
    });
    this.saveCart([]); this.updateCartBadge();
    return order;
  },

  // ---- Complaints ----
  addComplaint(data) {
    const list = this.getComplaints();
    const c = { id: 'CMP-' + String(list.length + 1).padStart(3, '0'), ...data, status: 'open', date: new Date().toISOString().split('T')[0], replies: [] };
    list.push(c); this.saveComplaints(list); return c;
  },
  replyComplaint(id, from, text) {
    const list = this.getComplaints();
    const c = list.find(x => x.id === id);
    if (!c) return;
    if (!c.replies) c.replies = [];
    const now = new Date();
    c.replies.push({ from, text, time: now.toLocaleDateString('en-NG', {day:'numeric',month:'short'}) + ', ' + now.toLocaleTimeString('en-NG',{hour:'2-digit',minute:'2-digit'}) });
    this.saveComplaints(list);
  },
  resolveComplaint(id) {
    const list = this.getComplaints();
    const c = list.find(x => x.id === id);
    if (c) { c.status = 'resolved'; this.saveComplaints(list); }
  },

  // ---- Delivery Photos ----
  getDeliveryPhotos() { return JSON.parse(localStorage.getItem('ms_delivery_photos') || '[]'); },
  saveDeliveryPhotos(d) { localStorage.setItem('ms_delivery_photos', JSON.stringify(d)); },
  addDeliveryPhoto(orderId, buyerName, photoDataUrl) {
    const photos = this.getDeliveryPhotos();
    photos.push({ id: 'dp' + Date.now(), orderId, buyerName, photoDataUrl, timestamp: new Date().toISOString() });
    this.saveDeliveryPhotos(photos);
    const orders = this.getOrders();
    const o = orders.find(x => x.id === orderId);
    if (o) { o.status = 'delivered'; o.deliveryPhotoUploaded = true; this.saveOrders(orders); }
  },
  getDeliveryPhotoByOrder(orderId) {
    return this.getDeliveryPhotos().find(p => p.orderId === orderId) || null;
  },

  canVendorDeleteProduct(productId) {
    const p = this.getProductById(productId);
    if (!p) return false;
    if ((p.sales || 0) > 0) return false;
    return !this.getOrders().find(o => o.items.some(i => i.productId === productId));
  },

  // ---- Direct Messaging (Vendor ↔ Buyer) ----
  sendMessage(senderId, senderName, senderRole, receiverId, text) {
    const msgs = this.getMessages();
    msgs.push({ id: 'msg' + Date.now(), senderId, senderName, senderRole, receiverId, text, timestamp: new Date().toISOString(), read: false });
    this.saveMessages(msgs);
  },

  // ---- Chat Threads (full buyer-vendor conversation) ----
  getOrCreateChatThread(buyerId, vendorId, productId) {
    const chats = this.getChats();
    let thread = chats.find(c => c.buyerId === buyerId && c.vendorId === vendorId && c.productId === productId);
    if (!thread) {
      thread = {
        id: 'chat' + Date.now(),
        buyerId,
        vendorId,
        productId,
        messages: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
      chats.push(thread);
      this.saveChats(chats);
    }
    return thread;
  },

  sendChatMessage(threadId, senderId, senderName, text) {
    const chats = this.getChats();
    const thread = chats.find(c => c.id === threadId);
    if (!thread) return null;
    const msg = { id: 'cm' + Date.now(), senderId, senderName, text, timestamp: new Date().toISOString(), read: false };
    thread.messages.push(msg);
    thread.lastActivity = new Date().toISOString();
    this.saveChats(chats);
    return msg;
  },

  getChatThreadsForUser(userId, role) {
    const chats = this.getChats();
    if (role === 'buyer') return chats.filter(c => c.buyerId === userId);
    if (role === 'vendor') {
      const vendor = this.getVendors().find(v => v.email === this.getUserById(userId)?.email);
      if (!vendor) return [];
      return chats.filter(c => c.vendorId === vendor.id);
    }
    return chats;
  },

  markChatRead(threadId, userId) {
    const chats = this.getChats();
    const thread = chats.find(c => c.id === threadId);
    if (!thread) return;
    thread.messages.forEach(m => { if (m.senderId !== userId) m.read = true; });
    this.saveChats(chats);
  },

  // ---- Bargain / Price Negotiation ----
  createBargainRequest(buyerId, buyerName, vendorId, productId, productName, originalPrice, offeredPrice, message) {
    const bargains = this.getBargains();
    const existing = bargains.find(b => b.buyerId === buyerId && b.productId === productId && b.status === 'pending');
    if (existing) { this.showToast('You already have a pending offer on this item.', 'error'); return null; }
    const b = {
      id: 'BRG-' + String(bargains.length + 1).padStart(3, '0'),
      buyerId, buyerName, vendorId, productId, productName,
      originalPrice, offeredPrice, message,
      status: 'pending', // pending | accepted | rejected | countered
      vendorCounter: null,
      vendorNote: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    bargains.push(b);
    this.saveBargains(bargains);
    this.showToast('Bargain offer sent! ✅', 'success');
    return b;
  },

  respondToBargain(bargainId, action, counterPrice, vendorNote) {
    // action: 'accepted' | 'rejected' | 'countered'
    const bargains = this.getBargains();
    const b = bargains.find(x => x.id === bargainId);
    if (!b) return false;
    b.status = action;
    b.vendorCounter = action === 'countered' ? counterPrice : null;
    b.vendorNote = vendorNote || '';
    b.updatedAt = new Date().toISOString();
    this.saveBargains(bargains);
    return true;
  },

  getBargainsForVendor(vendorId) {
    return this.getBargains().filter(b => b.vendorId === vendorId);
  },

  getBargainsForBuyer(buyerId) {
    return this.getBargains().filter(b => b.buyerId === buyerId);
  },

  // ---- Vendor Plans ----
  getPlanDaysLeft(vendorId) {
    const v = this.getVendorById(vendorId);
    if (!v || !v.planExpiry) return null;
    return Math.ceil((new Date(v.planExpiry) - new Date()) / 86400000);
  },
  getVendorPlan(vendorId) {
    const v = this.getVendorById(vendorId);
    if (!v) return null;
    return { plan: v.plan || 'none', endDate: v.planExpiry, fee: v.planFee, paid: v.planPaid };
  },
  updateVendorPlan(vendorId, plan, months, fee) {
    const vendors = this.getVendors();
    const v = vendors.find(x => x.id === vendorId);
    if (!v) return;
    const expiry = new Date(); expiry.setMonth(expiry.getMonth() + months);
    v.plan = plan; v.planExpiry = expiry.toISOString().split('T')[0]; v.planFee = fee; v.planPaid = false;
    this.saveVendors(vendors);
    const payments = this.getVendorPayments();
    payments.push({ id: 'vp' + Date.now(), vendorId, amount: fee, plan, status: 'pending', date: new Date().toISOString().split('T')[0], note: plan + ' plan set by admin' });
    this.saveVendorPayments(payments);
  },
  markVendorPlanPaid(vendorId) {
    const vendors = this.getVendors();
    const v = vendors.find(x => x.id === vendorId);
    if (v) { v.planPaid = true; this.saveVendors(vendors); }
    const payments = this.getVendorPayments();
    const lastPayment = payments.filter(p => p.vendorId === vendorId).pop();
    if (lastPayment) { lastPayment.status = 'paid'; this.saveVendorPayments(payments); }
  },

  // ---- CSV Export ----
  exportCSV(rows, filename) {
    if (!rows.length) { this.showToast('No data to export', 'error'); return; }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = filename || 'export.csv';
    a.click();
    this.showToast('CSV exported!', 'success');
  },

  // ---- Utilities ----
  formatPrice(a) { return '\u20A6' + Number(a).toLocaleString('en-NG'); },
  formatDate(d) { return d ? new Date(d).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' }) : '—'; },
  renderStars(r) {
    const f = Math.floor(r), h = r % 1 >= 0.5;
    let s = '';
    for (let i = 0; i < f; i++) s += '<i class="fas fa-star"></i>';
    if (h) s += '<i class="fas fa-star-half-alt"></i>';
    for (let i = f + (h ? 1 : 0); i < 5; i++) s += '<i class="far fa-star"></i>';
    return s;
  },
  showToast(msg, type = 'info') {
    let c = document.getElementById('ms-toast-box');
    if (!c) { c = document.createElement('div'); c.id = 'ms-toast-box'; c.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;'; document.body.appendChild(c); }
    const t = document.createElement('div');
    const col = type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#1e293b';
    t.style.cssText = `background:${col};color:#fff;padding:13px 20px;border-radius:10px;font-size:14px;font-family:'DM Sans',sans-serif;box-shadow:0 8px 28px rgba(0,0,0,0.22);transform:translateX(110%);opacity:0;transition:all 0.4s cubic-bezier(.175,.885,.32,1.1);max-width:300px;pointer-events:all;`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.style.transform = 'translateX(0)'; t.style.opacity = '1'; }, 10);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(110%)'; setTimeout(() => t.remove(), 400); }, 3500);
  },
  requireAuth(role) {
    const u = this.getCurrentUser();
    if (!u) { window.location.href = 'login.html'; return null; }
    if (role && u.role !== role) { window.location.href = 'index.html'; return null; }
    // Force password change if flagged
    if (u.mustChangePassword && !window.location.href.includes('change_password')) {
      this.showToast('You must change your password before continuing.', 'error');
      setTimeout(() => { window.location.href = 'change_password.html'; }, 1200);
      return null;
    }
    return u;
  }
};

// ---- Header init ----
function initMobileMenu() {
  const bar = document.getElementById('bar'), nav = document.getElementById('navbar'), cl = document.getElementById('close');
  if (bar) bar.addEventListener('click', () => nav.classList.toggle('open'));
  if (cl) cl.addEventListener('click', () => nav.classList.remove('open'));
}

function initHeader() {
  const user = MS.getCurrentUser();
  const slot = document.getElementById('user-nav-slot');
  if (slot) {
    if (user) {
      const dash = user.role === 'admin' ? 'admin_dashboard.html' : user.role === 'vendor' ? 'vendor_dashboard.html' : 'buyer_dashboard.html';
      slot.innerHTML = `<li><a href="${dash}" class="nav-user-btn"><i class="fas fa-user-circle"></i> ${user.name.split(' ')[0]}</a></li><li><a href="#" onclick="MS.logout();return false;" class="nav-logout-btn"><i class="fas fa-sign-out-alt"></i></a></li>`;
    } else {
      slot.innerHTML = `<li><a href="login.html" class="nav-user-btn"><i class="fas fa-user"></i> Sign In</a></li>`;
    }
  }
  MS.updateCartBadge();
}

// ---- Chat Widget (Support) ----
function initChatWidget() {
  if (document.getElementById('chat-widget')) return;
  const widget = document.createElement('div');
  widget.id = 'chat-widget';
  widget.innerHTML = `
    <div id="chat-bubble" onclick="toggleChat()"><i class="fas fa-comment-dots"></i><span id="chat-badge" class="chat-badge" style="display:none;"></span></div>
    <div id="chat-window">
      <div id="chat-head">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="chat-av"><i class="fas fa-headset"></i></div>
          <div><div style="font-weight:700;font-size:14px;color:#fff;">Mirastore Support</div><div style="font-size:11px;color:rgba(255,255,255,0.7);display:flex;align-items:center;gap:5px;"><span style="width:7px;height:7px;border-radius:50%;background:#4ade80;display:inline-block;"></span>Online</div></div>
        </div>
        <button onclick="toggleChat()" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div id="chat-msgs">
        <div class="cmsg bot"><div class="cbubble">👋 Welcome to <strong>Mirastore</strong>. Sign in to chat with vendors or our support team.</div><div class="ctime">Now</div></div>
      </div>
      <div id="chat-gate" style="padding:14px;background:#f8f6f3;border-top:1px solid #e8e8e8;">
        <p style="font-size:13px;color:#465b52;margin-bottom:10px;">Please sign in to send messages.</p>
        <a href="login.html" style="display:block;text-align:center;padding:9px;background:#088178;color:#fff;border-radius:7px;font-size:13px;font-weight:600;">Sign In / Register</a>
      </div>
      <div id="chat-inp" style="display:none;">
        <input id="chat-text" type="text" placeholder="Type a message..." onkeydown="if(event.key==='Enter')sendChat()">
        <button onclick="sendChat()"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>`;
  document.body.appendChild(widget);
}

function toggleChat() {
  const w = document.getElementById('chat-window');
  const b = document.getElementById('chat-badge');
  const open = w.classList.toggle('open');
  if (b) b.style.display = 'none';
  if (open) {
    const u = MS.getCurrentUser();
    document.getElementById('chat-gate').style.display = u ? 'none' : 'block';
    document.getElementById('chat-inp').style.display = u ? 'flex' : 'none';
    if (u) loadChatMsgs();
  }
}

function loadChatMsgs() {
  const u = MS.getCurrentUser(); if (!u) return;
  const msgs = MS.getMessages().filter(m => m.senderId === u.id || m.receiverId === u.id);
  const c = document.getElementById('chat-msgs');
  c.innerHTML = '<div class="cmsg bot"><div class="cbubble">👋 Hi <strong>' + u.name.split(' ')[0] + '</strong>! How can we help you?</div><div class="ctime">Welcome</div></div>';
  msgs.forEach(m => {
    const isMe = m.senderId === u.id;
    const div = document.createElement('div');
    div.className = 'cmsg ' + (isMe ? 'user' : 'bot');
    div.innerHTML = `<div class="cbubble">${m.text}</div><div class="ctime">${new Date(m.timestamp).toLocaleTimeString('en-NG',{hour:'2-digit',minute:'2-digit'})}</div>`;
    c.appendChild(div);
  });
  c.scrollTop = c.scrollHeight;
}

function sendChat() {
  const u = MS.getCurrentUser();
  if (!u) { MS.showToast('Please sign in to chat', 'error'); return; }
  const inp = document.getElementById('chat-text');
  const text = inp.value.trim(); if (!text) return;
  MS.sendMessage(u.id, u.name, u.role, 'admin1', text);
  inp.value = '';
  loadChatMsgs();
  setTimeout(() => {
    MS.sendMessage('admin1', 'Support Team', 'admin', u.id, 'Thank you for your message! Our team will respond shortly.');
    loadChatMsgs();
  }, 1800);
}

MS.init();
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initHeader();
  initChatWidget();
});
