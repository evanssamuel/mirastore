// ============================================================
// MIRASTORE v6 — App Data & Utilities
// ============================================================
const MS = {
  init() {
    if (!localStorage.getItem('ms_vendors')) localStorage.setItem('ms_vendors', JSON.stringify([]));
    if (!localStorage.getItem('ms_products')) localStorage.setItem('ms_products', JSON.stringify([]));
    if (!localStorage.getItem('ms_orders')) localStorage.setItem('ms_orders', JSON.stringify([]));
    if (!localStorage.getItem('ms_users')) localStorage.setItem('ms_users', JSON.stringify([{id:'admin1',name:'Admin',email:'admin@mirastore.ng',role:'admin',password:'CHANGE_ME_ON_FIRST_LOGIN',mustChangePassword:true}]));
    if (!localStorage.getItem('ms_cart')) localStorage.setItem('ms_cart', JSON.stringify([]));
    if (!localStorage.getItem('ms_complaints')) localStorage.setItem('ms_complaints', JSON.stringify([]));
    if (!localStorage.getItem('ms_messages')) localStorage.setItem('ms_messages', JSON.stringify([]));
    if (!localStorage.getItem('ms_chats')) localStorage.setItem('ms_chats', JSON.stringify([]));
    if (!localStorage.getItem('ms_bargains')) localStorage.setItem('ms_bargains', JSON.stringify([]));
    if (!localStorage.getItem('ms_inventory')) localStorage.setItem('ms_inventory', JSON.stringify([]));
    if (!localStorage.getItem('ms_vendor_payments')) localStorage.setItem('ms_vendor_payments', JSON.stringify([]));
    if (!localStorage.getItem('ms_commissions')) localStorage.setItem('ms_commissions', JSON.stringify([]));
    if (!localStorage.getItem('ms_delivery_photos')) localStorage.setItem('ms_delivery_photos', JSON.stringify([]));
  },

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
  getCommissions()    { return JSON.parse(localStorage.getItem('ms_commissions') || '[]'); },
  getDeliveryPhotos() { return JSON.parse(localStorage.getItem('ms_delivery_photos') || '[]'); },
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
  saveCommissions(d)    { localStorage.setItem('ms_commissions', JSON.stringify(d)); },
  saveDeliveryPhotos(d) { localStorage.setItem('ms_delivery_photos', JSON.stringify(d)); },
  setCurrentUser(u)     { localStorage.setItem('ms_current_user', JSON.stringify(u)); },
  logout()              { localStorage.removeItem('ms_current_user'); window.location.href = 'login.html'; },

  getProductById(id)  { return this.getProducts().find(p => p.id === id); },
  getVendorById(id)   { return this.getVendors().find(v => v.id === id); },
  getUserById(id)     { return this.getUsers().find(u => u.id === id); },

  changePassword(userId, newPassword) {
    const users = this.getUsers(); const u = users.find(x => x.id === userId); if (!u) return false;
    u.password = newPassword; u.mustChangePassword = false; this.saveUsers(users);
    const cu = this.getCurrentUser();
    if (cu && cu.id === userId) { cu.password = newPassword; cu.mustChangePassword = false; this.setCurrentUser(cu); }
    return true;
  },
  adminForcePasswordChange(userId, newPassword) { return this.changePassword(userId, newPassword); },

  addToCart(productId, qty = 1) {
    const cart = this.getCart(); const ex = cart.find(i => i.productId === productId);
    if (ex) ex.qty += qty; else cart.push({ productId, qty });
    this.saveCart(cart); this.updateCartBadge(); this.showToast('Added to cart! 🛒', 'success');
  },
  removeFromCart(productId) { this.saveCart(this.getCart().filter(i => i.productId !== productId)); this.updateCartBadge(); },
  updateQty(productId, qty) {
    if (qty <= 0) { this.removeFromCart(productId); return; }
    const cart = this.getCart(); const item = cart.find(i => i.productId === productId);
    if (item) item.qty = qty; this.saveCart(cart);
  },
  getCartTotal() { return this.getCart().reduce((s, i) => { const p = this.getProductById(i.productId); return s + (p ? p.price * i.qty : 0); }, 0); },
  updateCartBadge() {
    const count = this.getCart().reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('.cart-count').forEach(el => { el.textContent = count; el.style.display = count > 0 ? 'flex' : 'none'; });
  },

  createOrder(data) {
    const orders = this.getOrders();
    const order = { id: 'ORD-' + String(orders.length + 1).padStart(3, '0'), ...data, date: new Date().toISOString().split('T')[0], status: 'pending', paymentStatus: 'receipt_uploaded', vendorPaymentConfirmed: false };
    orders.push(order); this.saveOrders(orders);
    data.items.forEach(item => {
      const products = this.getProducts(); const prod = products.find(pr => pr.id === item.productId);
      if (prod) { prod.stock = Math.max(0, prod.stock - item.qty); prod.sales = (prod.sales || 0) + item.qty; this.saveProducts(products); }
    });
    this._calculateCommissionsForOrder(order);
    this.saveCart([]); this.updateCartBadge();
    return order;
  },

  // COMMISSION: rate% * qty * pricePerItem
  _calculateCommissionsForOrder(order) {
    const commissions = this.getCommissions();
    order.items.forEach(item => {
      const product = this.getProductById(item.productId); if (!product) return;
      const vendor = this.getVendorById(product.vendorId); if (!vendor) return;
      const rate = vendor.commissionRate || 0;
      if (rate <= 0) return;
      const commissionAmount = Math.round((rate / 100) * item.qty * item.price);
      commissions.push({
        id: 'COM-' + Date.now() + '-' + Math.random().toString(36).substr(2,4),
        orderId: order.id, vendorId: vendor.id, vendorName: vendor.name,
        productId: product.id, productName: product.name,
        qty: item.qty, pricePerItem: item.price, commissionRate: rate,
        commissionAmount, status: 'pending', date: order.date
      });
    });
    this.saveCommissions(commissions);
  },

  getVendorCommissionSummary(vendorId) {
    const all = this.getCommissions().filter(c => c.vendorId === vendorId);
    return {
      pending: all.filter(c => c.status === 'pending').reduce((s,c) => s + c.commissionAmount, 0),
      paid: all.filter(c => c.status === 'paid').reduce((s,c) => s + c.commissionAmount, 0),
      entries: all
    };
  },

  markCommissionPaid(vendorId) {
    const commissions = this.getCommissions();
    commissions.filter(c => c.vendorId === vendorId && c.status === 'pending').forEach(c => c.status = 'paid');
    this.saveCommissions(commissions);
  },

  setVendorCommissionRate(vendorId, rate) {
    const vendors = this.getVendors(); const v = vendors.find(x => x.id === vendorId);
    if (v) { v.commissionRate = parseFloat(rate); this.saveVendors(vendors); }
  },

  getTotalCommissionSummary() {
    const all = this.getCommissions();
    return {
      totalEarned: all.reduce((s,c) => s + c.commissionAmount, 0),
      totalPending: all.filter(c => c.status === 'pending').reduce((s,c) => s + c.commissionAmount, 0),
      totalPaid: all.filter(c => c.status === 'paid').reduce((s,c) => s + c.commissionAmount, 0)
    };
  },

  // Vendor confirms buyer paid into their account
  vendorConfirmPaymentReceived(orderId) {
    const orders = this.getOrders(); const o = orders.find(x => x.id === orderId); if (!o) return false;
    o.vendorPaymentConfirmed = true; o.vendorPaymentConfirmedAt = new Date().toISOString(); o.status = 'processing';
    o.paymentStatus = 'paid';
    this.saveOrders(orders); return true;
  },

  addComplaint(data) {
    const list = this.getComplaints();
    const c = { id: 'CMP-' + String(list.length + 1).padStart(3, '0'), ...data, status: 'open', date: new Date().toISOString().split('T')[0], replies: [] };
    list.push(c); this.saveComplaints(list); return c;
  },
  replyComplaint(id, from, text) {
    const list = this.getComplaints(); const c = list.find(x => x.id === id); if (!c) return;
    if (!c.replies) c.replies = [];
    const now = new Date();
    c.replies.push({ from, text, time: now.toLocaleDateString('en-NG',{day:'numeric',month:'short'}) + ', ' + now.toLocaleTimeString('en-NG',{hour:'2-digit',minute:'2-digit'}) });
    this.saveComplaints(list);
  },
  resolveComplaint(id) {
    const list = this.getComplaints(); const c = list.find(x => x.id === id);
    if (c) { c.status = 'resolved'; this.saveComplaints(list); }
  },

  addDeliveryPhoto(orderId, buyerName, photoDataUrl) {
    const photos = this.getDeliveryPhotos();
    photos.push({ id: 'dp' + Date.now(), orderId, buyerName, photoDataUrl, timestamp: new Date().toISOString() });
    this.saveDeliveryPhotos(photos);
    const orders = this.getOrders(); const o = orders.find(x => x.id === orderId);
    if (o) { o.status = 'delivered'; o.deliveryPhotoUploaded = true; this.saveOrders(orders); }
  },
  getDeliveryPhotoByOrder(orderId) { return this.getDeliveryPhotos().find(p => p.orderId === orderId) || null; },

  canVendorDeleteProduct(productId) {
    const p = this.getProductById(productId); if (!p) return false;
    if ((p.sales || 0) > 0) return false;
    return !this.getOrders().find(o => o.items.some(i => i.productId === productId));
  },

  sendMessage(senderId, senderName, senderRole, receiverId, text) {
    const msgs = this.getMessages();
    msgs.push({ id: 'msg' + Date.now(), senderId, senderName, senderRole, receiverId, text, timestamp: new Date().toISOString(), read: false });
    this.saveMessages(msgs);
  },

  createBargainRequest(buyerId, buyerName, vendorId, productId, productName, originalPrice, offeredPrice, message) {
    const bargains = this.getBargains();
    const existing = bargains.find(b => b.buyerId === buyerId && b.productId === productId && b.status === 'pending');
    if (existing) { this.showToast('You already have a pending offer on this item.', 'error'); return null; }
    const b = { id: 'BRG-' + String(bargains.length + 1).padStart(3, '0'), buyerId, buyerName, vendorId, productId, productName, originalPrice, offeredPrice, message, status: 'pending', vendorCounter: null, vendorNote: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    bargains.push(b); this.saveBargains(bargains); this.showToast('Bargain offer sent! ✅', 'success'); return b;
  },

  respondToBargain(bargainId, action, counterPrice, vendorNote) {
    const bargains = this.getBargains(); const b = bargains.find(x => x.id === bargainId); if (!b) return false;
    b.status = action; b.vendorCounter = action === 'countered' ? counterPrice : null; b.vendorNote = vendorNote || ''; b.updatedAt = new Date().toISOString();
    this.saveBargains(bargains); return true;
  },
  getBargainsForVendor(vendorId) { return this.getBargains().filter(b => b.vendorId === vendorId); },
  getBargainsForBuyer(buyerId) { return this.getBargains().filter(b => b.buyerId === buyerId); },

  getPlanDaysLeft(vendorId) {
    const v = this.getVendorById(vendorId); if (!v || !v.planExpiry) return null;
    return Math.ceil((new Date(v.planExpiry) - new Date()) / 86400000);
  },
  updateVendorPlan(vendorId, plan, months, fee) {
    const vendors = this.getVendors(); const v = vendors.find(x => x.id === vendorId); if (!v) return;
    const expiry = new Date(); expiry.setMonth(expiry.getMonth() + months);
    v.plan = plan; v.planExpiry = expiry.toISOString().split('T')[0]; v.planFee = fee; v.planPaid = false; this.saveVendors(vendors);
    const payments = this.getVendorPayments();
    payments.push({ id: 'vp' + Date.now(), vendorId, amount: fee, plan, status: 'pending', date: new Date().toISOString().split('T')[0] });
    this.saveVendorPayments(payments);
  },
  markVendorPlanPaid(vendorId) {
    const vendors = this.getVendors(); const v = vendors.find(x => x.id === vendorId); if (v) { v.planPaid = true; this.saveVendors(vendors); }
    const payments = this.getVendorPayments(); const lp = payments.filter(p => p.vendorId === vendorId).pop(); if (lp) { lp.status = 'paid'; this.saveVendorPayments(payments); }
  },

  exportCSV(rows, filename) {
    if (!rows.length) { this.showToast('No data to export', 'error'); return; }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = filename || 'export.csv'; a.click();
    this.showToast('CSV exported!', 'success');
  },

  formatPrice(a) { return '\u20A6' + Number(a).toLocaleString('en-NG'); },
  formatDate(d) { return d ? new Date(d).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' }) : '—'; },
  renderStars(r) {
    const f = Math.floor(r), h = r % 1 >= 0.5; let s = '';
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
    t.textContent = msg; c.appendChild(t);
    setTimeout(() => { t.style.transform = 'translateX(0)'; t.style.opacity = '1'; }, 10);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(110%)'; setTimeout(() => t.remove(), 400); }, 3500);
  },
  requireAuth(role) {
    const u = this.getCurrentUser(); if (!u) { window.location.href = 'login.html'; return null; }
    if (role && u.role !== role) { window.location.href = 'index.html'; return null; }
    if (u.mustChangePassword && !window.location.href.includes('change_password')) {
      this.showToast('You must change your password before continuing.', 'error');
      setTimeout(() => { window.location.href = 'change_password.html'; }, 1200); return null;
    }
    return u;
  }
};

function initMobileMenu() {
  const bar = document.getElementById('bar'), nav = document.getElementById('navbar'), cl = document.getElementById('close');
  if (bar) bar.addEventListener('click', () => nav.classList.toggle('open'));
  if (cl) cl.addEventListener('click', () => nav.classList.remove('open'));
}
function initHeader() {
  const user = MS.getCurrentUser(); const slot = document.getElementById('user-nav-slot');
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

MS.init();
document.addEventListener('DOMContentLoaded', () => { initMobileMenu(); initHeader(); });
