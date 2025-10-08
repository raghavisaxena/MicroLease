const API = 'http://localhost:5000/api';

async function loadHome() {
  try {
    const res = await fetch(API + '/items');
    const items = await res.json();
    const div = document.getElementById('items');
    if (!div) return;
    div.innerHTML = items.map(i=>`
      <div class="card">
        <h3>${i.title}</h3>
        <p>${i.description || ''}</p>
        <p>Category: ${i.category || 'N/A'}</p>
        <p>₹${i.pricePerDay}/day</p>
      </div>`).join('');
  } catch (err) {
    console.error(err);
  }
}

if (document.getElementById('items')) loadHome();

// Dashboard
if (document.getElementById('userInfo')) {
  (async ()=>{
    const token = localStorage.getItem('token');
    if (!token) return window.location='login.html';
    const payload = JSON.parse(atob(token.split('.')[1]));
    document.getElementById('userInfo').innerText = `Logged in as ${payload.email} (${payload.role})`;
    if (payload.role === 'lessor') document.getElementById('lessorArea').style.display = 'block';
    if (payload.role === 'lessee') document.getElementById('lesseeArea').style.display = 'block';

    // lessee: list items + request button
    if (payload.role === 'lessee') {
      const res = await fetch(API + '/items');
      const items = await res.json();
      document.getElementById('itemsList').innerHTML = items.map(i=>`
        <div class="card">
          <h4>${i.title}</h4>
          <p>${i.description || ''}</p>
          <p>₹${i.pricePerDay}/day</p>
          <button onclick="requestLease(${i.id})">Request Lease</button>
        </div>`).join('');
    }

    // add item form
    const addItemForm = document.getElementById('addItemForm');
    if (addItemForm) addItemForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd.entries());
      const res = await fetch(API + '/items', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.id) { alert('Item added'); window.location = 'dashboard.html'; }
      else alert(data.message || 'Error');
    });

    // show owner pending leases (for lessor)
    if (payload.role === 'lessor') {
      const res = await fetch(API + '/leases', { headers: { 'Authorization': 'Bearer ' + token } });
      const leases = await res.json();
      document.getElementById('requests').innerHTML = leases.map(l=>`
        <div style="border-bottom:1px solid #eee; padding:10px;">
          <b>Item:</b> ${l.item ? l.item.title : 'N/A'} <br/>
          <b>Lessee:</b> ${l.lessee ? l.lessee.name : 'N/A'} <br/>
          <b>From:</b> ${l.startDate} <b>To:</b> ${l.endDate} <br/>
          <b>Status:</b> ${l.status} <br/>
          ${l.status === 'pending' ? `<button onclick="decide(${l.id}, 'approve')">Approve</button> <button onclick="decide(${l.id}, 'reject')">Reject</button>` : ''}
        </div>`).join('');
    }

  })();
}

async function requestLease(itemId) {
  const token = localStorage.getItem('token');
  const startDate = prompt('Start date (YYYY-MM-DD)');
  const endDate = prompt('End date (YYYY-MM-DD)');
  if (!startDate || !endDate) return;
  const res = await fetch(API + '/leases', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ ItemId: itemId, startDate, endDate })});
  const data = await res.json();
  if (data.id) alert('Lease requested'); else alert(data.message || 'Error');
}

async function decide(leaseId, action) {
  const token = localStorage.getItem('token');
  const res = await fetch(API + '/leases/' + leaseId + '/decision', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ action })});
  const data = await res.json();
  if (data.lease || data.payment) { alert('Decision saved'); window.location='dashboard.html'; } else alert(data.message || 'Error');
}

// logout
const logoutBtn = document.getElementById('logout');
if (logoutBtn) logoutBtn.addEventListener('click', ()=>{ localStorage.removeItem('token'); window.location='login.html'; });
