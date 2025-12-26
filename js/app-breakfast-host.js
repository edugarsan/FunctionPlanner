// Breakfast Checker - simple vanilla JS
// Data source: either sample JSON or parsed from pasted CSV/TSV
// Checked state persisted in localStorage by a stable key.

const els = {
    q: document.querySelector('#q'),
    clearBtn: document.querySelector('#clearBtn'),
    list: document.querySelector('#list'),
    empty: document.querySelector('#empty'),
  
    planFilter: document.querySelector('#planFilter'),
    statusFilter: document.querySelector('#statusFilter'),
  
    importToggle: document.querySelector('#importToggle'),
    importPanel: document.querySelector('#importPanel'),
    pasteArea: document.querySelector('#pasteArea'),
    parseBtn: document.querySelector('#parseBtn'),
    jsonOut: document.querySelector('#jsonOut'),
    useJsonBtn: document.querySelector('#useJsonBtn'),
    copyJsonBtn: document.querySelector('#copyJsonBtn'),
    loadSampleBtn: document.querySelector('#loadSampleBtn'),
  
    countPill: document.querySelector('#countPill'),
    bbPill: document.querySelector('#bbPill'),
    roPill: document.querySelector('#roPill'),
    checkedPill: document.querySelector('#checkedPill'),
  
    modal: document.querySelector('#modal'),
    modalBackdrop: document.querySelector('#modalBackdrop'),
    modalTitle: document.querySelector('#modalTitle'),
    modalSubtitle: document.querySelector('#modalSubtitle'),
    modalBody: document.querySelector('#modalBody'),
    breakfastCheck: document.querySelector('#breakfastCheck'),
    copySummary: document.querySelector('#copySummary'),
    closeModal: document.querySelector('#closeModal')
  };
  
  const STORAGE = {
    guestsJson: 'bc_guests_json_v1',
    checked: 'bc_checked_v1' // map key->true
  };
  
  let guests = [];
  let currentGuest = null;
  
  init();
  
  function init(){
    // Load guests from localStorage if present, else sample
    const saved = localStorage.getItem(STORAGE.guestsJson);
    if(saved){
      try { guests = JSON.parse(saved); }
      catch { guests = getSample(); }
    } else {
      guests = getSample();
    }
  
    // Wire events
    els.q.addEventListener('input', render);
    els.clearBtn.addEventListener('click', () => { els.q.value = ''; render(); });
  
    els.planFilter.addEventListener('change', render);
    els.statusFilter.addEventListener('change', render);
  
    els.importToggle.addEventListener('click', toggleImport);
    els.parseBtn.addEventListener('click', handleParse);
    els.useJsonBtn.addEventListener('click', useGeneratedJson);
    els.copyJsonBtn.addEventListener('click', copyGeneratedJson);
    els.loadSampleBtn.addEventListener('click', () => {
      const sample = getSample();
      els.jsonOut.value = JSON.stringify(sample, null, 2);
    });
  
    // Modal close
    els.modal.addEventListener('close', () => {
      els.modalBackdrop.classList.add('panel--hidden');
      els.modalBackdrop.setAttribute('aria-hidden','true');
      currentGuest = null;
    });
    els.modalBackdrop.addEventListener('click', () => els.modal.close());
    els.closeModal.addEventListener('click', () => els.modal.close());
  
    els.breakfastCheck.addEventListener('change', () => {
      if(!currentGuest) return;
      setChecked(currentGuest, els.breakfastCheck.checked);
      render(); // update list badges/pills instantly
    });
  
    els.copySummary.addEventListener('click', () => {
      if(!currentGuest) return;
      const text = summaryLine(currentGuest);
      navigator.clipboard.writeText(text);
    });
  
    render();
  }
  
  function toggleImport(){
    const hidden = els.importPanel.classList.contains('panel--hidden');
    els.importPanel.classList.toggle('panel--hidden', !hidden);
    els.importPanel.setAttribute('aria-hidden', String(!hidden));
  }
  
  function render(){
    const q = (els.q.value || '').trim().toLowerCase();
    const plan = els.planFilter.value;
    const status = els.statusFilter.value;
  
    const checkedMap = getCheckedMap();
  
    const filtered = guests.filter(g => {
      // plan filter
      if(plan !== 'ALL' && (g.mealPlan || '').toUpperCase() !== plan) return false;
  
      // status filter
      const isChecked = !!checkedMap[guestKey(g)];
      if(status === 'CHECKED' && !isChecked) return false;
      if(status === 'NOT_CHECKED' && isChecked) return false;
  
      // query search across fields
      if(!q) return true;
      const hay = searchableString(g);
      return hay.includes(q);
    });
  
    // Pills
    const total = filtered.length;
    const bb = filtered.filter(g => (g.mealPlan||'').toUpperCase() === 'BB').length;
    const ro = filtered.filter(g => (g.mealPlan||'').toUpperCase() === 'RO').length;
    const checked = filtered.filter(g => !!checkedMap[guestKey(g)]).length;
  
    els.countPill.textContent = total;
    els.bbPill.textContent = `BB: ${bb}`;
    els.roPill.textContent = `RO: ${ro}`;
    els.checkedPill.textContent = `Checked: ${checked}`;
  
    // List
    els.list.innerHTML = '';
    els.empty.classList.toggle('panel--hidden', total !== 0);
  
    filtered
      .sort((a,b) => String(a.room).localeCompare(String(b.room), undefined, {numeric:true}))
      .forEach(g => {
        const isChecked = !!checkedMap[guestKey(g)];
        const planUp = (g.mealPlan||'').toUpperCase();
  
        const item = document.createElement('div');
        item.className = 'item';
        item.setAttribute('role','listitem');
        item.addEventListener('click', () => openModal(g));
  
        item.innerHTML = `
          <div class="item__left ${planUp === 'BB' ? 'is--bb' : 'is--ro'}">
            <div class="room">${escapeHtml(String(g.room || '—'))}</div>
            <div style="min-width:0">
              <div class="name">${escapeHtml(g.guestName || 'Unknown')}<span class="${g.notes !== '' ? 'badge--note' : 'badge--roo'}">${escapeHtml(g.notes)}</span></div>
              <div class="meta">
                ${escapeHtml(planLabel(planUp))} · ${escapeHtml(g.company || '—')}
              </div>
            </div>
          </div>
          <div class="item__right">
            
            ${isChecked ? `<span class="badge badge--checked">✓</span>` : ``}
          </div>
        `;
        els.list.appendChild(item);
      });
  }
  
  function openModal(g){
    currentGuest = g;
  
    const planUp = (g.mealPlan||'').toUpperCase();
    const isChecked = isGuestChecked(g);
  
    els.modalTitle.textContent = `Room ${g.room || '—'} · ${g.guestName || 'Unknown'}`;
    els.modalSubtitle.textContent = planUp === 'BB'
      ? 'BB: free breakfast (no payment).'
      : (planUp === 'RO' ? 'RO: breakfast not included (needs payment/menu).' : 'Plan unknown.');
  
    els.breakfastCheck.checked = isChecked;
  
    const rows = [
      ['Room', g.room],
      ['Guest', g.guestName],
      ['Arrival', g.arrivalDate],
      ['Departure', g.departureDate],
      ['Rate code', g.rateCode],
      ['Meal plan', planUp],
      ['Company', g.company],
      ['Adults', g.adults],
      ['Children', g.children],
      ['Infants', g.infants],
      ['Notes', g.notes]
    ];
  
    els.modalBody.innerHTML = rows
      .filter(([,v]) => v !== undefined && v !== null && String(v).trim() !== '')
      .map(([k,v]) => `
        <div class="kv">
          <div class="k">${escapeHtml(k)}</div>
          <div class="v">${escapeHtml(String(v))}</div>
        </div>
      `).join('');
  
    els.modalBackdrop.classList.remove('panel--hidden');
    els.modalBackdrop.setAttribute('aria-hidden','false');
    els.modal.showModal();
  }
  
  /* ---------------------------
     Checked state (localStorage)
  ---------------------------- */
  function getCheckedMap(){
    try { return JSON.parse(localStorage.getItem(STORAGE.checked) || '{}'); }
    catch { return {}; }
  }
  
  function setChecked(guest, value){
    const map = getCheckedMap();
    const key = guestKey(guest);
    if(value) map[key] = true;
    else delete map[key];
    localStorage.setItem(STORAGE.checked, JSON.stringify(map));
  }
  
  function isGuestChecked(guest){
    const map = getCheckedMap();
    return !!map[guestKey(guest)];
  }
  
  function guestKey(g){
    // Stable-ish key. If your PMS has a unique booking id, use it here.
    // For now: room + name + arrival
    return `${String(g.room||'')}`.trim()
      + '|' + `${String(g.guestName||'')}`.trim().toLowerCase()
      + '|' + `${String(g.arrivalDate||'')}`.trim();
  }
  
  /* ---------------------------
     Import / CSV / TSV parsing
  ---------------------------- */
  function handleParse(){
    const raw = els.pasteArea.value.trim();
    if(!raw){
      els.jsonOut.value = '';
      return;
    }
  
    try{
      const parsed = parseDelimited(raw);
      els.jsonOut.value = JSON.stringify(parsed, null, 2);
    }catch(err){
      els.jsonOut.value = `ERROR: ${err.message}`;
    }
  }
  
  function useGeneratedJson(){
    try{
      const data = JSON.parse(els.jsonOut.value);
      if(!Array.isArray(data)) throw new Error('JSON must be an array of guests.');
      guests = normalizeGuests(data);
      localStorage.setItem(STORAGE.guestsJson, JSON.stringify(guests));
      render();
    }catch(err){
      alert(`Cannot use JSON: ${err.message}`);
    }
  }
  
  function copyGeneratedJson(){
    if(!els.jsonOut.value.trim()) return;
    navigator.clipboard.writeText(els.jsonOut.value);
  }
  
  function parseDelimited(text){
    // Detect delimiter: if has tabs -> TSV, else commas -> CSV, else semicolon
    const hasTabs = text.includes('\t');
    const delimiter = hasTabs ? '\t' : (text.includes(';') && !text.includes(',') ? ';' : ',');
  
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);
  
    // If first line looks like headers, use it. Otherwise assume fixed order.
    const first = splitLine(lines[0], delimiter);
    const looksLikeHeader = first.some(h => /room|guest|arrival|departure|plan|company|adult|child|infant|notes|rate/i.test(h));
  
    let headers;
    let startIndex = 0;
  
    if(looksLikeHeader){
      headers = first.map(h => cleanHeader(h));
      startIndex = 1;
    } else {
      headers = [
        'room','guestName','arrivalDate','departureDate','rateCode','mealPlan','company','adults','children','infants','notes'
      ];
    }
  
    const out = [];
    for(let i=startIndex; i<lines.length; i++){
      const parts = splitLine(lines[i], delimiter);
      if(parts.length === 1 && !parts[0]) continue;
  
      const obj = {};
      headers.forEach((h, idx) => obj[h] = (parts[idx] ?? '').trim().replace(/^"|"$/g,''));
      out.push(obj);
    }
  
    return normalizeGuests(out);
  }
  
  function splitLine(line, delimiter){
    // Minimal CSV handling: supports quoted commas for delimiter=','.
    if(delimiter !== ',') return line.split(delimiter);
  
    const res = [];
    let cur = '';
    let inQ = false;
  
    for(let i=0; i<line.length; i++){
      const ch = line[i];
      if(ch === '"'){
        inQ = !inQ;
        cur += ch;
      } else if(ch === ',' && !inQ){
        res.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    res.push(cur);
    return res;
  }
  
  function cleanHeader(h){
    const x = (h || '').trim().replace(/[\s\-]+/g,'').toLowerCase();
    // Map common variants
    const map = {
      roomno: 'room',
      room: 'room',
      guest: 'guestName',
      guestname: 'guestName',
      name: 'guestName',
      arrival: 'arrivalDate',
      arrivaldate: 'arrivalDate',
      departure: 'departureDate',
      departuredate: 'departureDate',
      ratecode: 'rateCode',
      plan: 'mealPlan',
      mealplan: 'mealPlan',
      company: 'company',
      adults: 'adults',
      adult: 'adults',
      children: 'children',
      child: 'children',
      infants: 'infants',
      infant: 'infants',
      notes: 'notes'
    };
    return map[x] || x;
  }
  
  function normalizeGuests(list){
    return list.map(g => ({
      room: String(g.room ?? '').trim(),
      guestName: String(g.guestName ?? '').trim(),
      arrivalDate: normalizeDate(g.arrivalDate),
      departureDate: normalizeDate(g.departureDate),
      rateCode: String(g.rateCode ?? '').trim(),
      mealPlan: String(g.mealPlan ?? '').trim().toUpperCase(),
      company: String(g.company ?? '').trim(),
      adults: toInt(g.adults),
      children: toInt(g.children),
      infants: toInt(g.infants),
      notes: String(g.notes ?? '').trim()
    })).filter(g => g.room || g.guestName);
  }
  
  function normalizeDate(v){
    const s = String(v ?? '').trim();
    if(!s) return '';
    // Accept YYYY-MM-DD or DD.MM.YYYY or DD/MM/YYYY
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m1 = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if(m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
    const m2 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if(m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
    return s;
  }
  
  function toInt(v){
    const n = Number(String(v ?? '').trim());
    return Number.isFinite(n) ? n : '';
  }
  
  function searchableString(g){
    return [
      g.room, g.guestName, g.arrivalDate, g.departureDate, g.rateCode,
      g.mealPlan, g.company, g.adults, g.children, g.infants, g.notes
    ].join(' ').toLowerCase();
  }
  
  function planLabel(plan){
    if(plan === 'BB') return 'Breakfast included';
    if(plan === 'RO') return 'Room only';
    return 'Plan';
  }
  
  function summaryLine(g){
    const planUp = (g.mealPlan||'').toUpperCase();
    const pay = planUp === 'RO' ? 'PAY' : (planUp === 'BB' ? 'FREE' : 'UNKNOWN');
    return `Room ${g.room} · ${g.guestName} · ${planUp} · Breakfast: ${pay}`;
  }
  
  function escapeHtml(s){
    return String(s)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }
  
  /* ---------------------------
     Sample data
  ---------------------------- */
  function getSample(){
    return [
        { "room":"101","guestName":"SMITH, JOHN","arrivalDate":"2025-12-21","departureDate":"2025-12-23","rateCode":"8301001","mealPlan":"BB","company":"BOOKING.COM B.V.","adults":2,"children":0,"infants":0,"notes":"" },
        { "room":"102","guestName":"GARCIA, MARIA","arrivalDate":"2025-12-20","departureDate":"2025-12-24","rateCode":"8301002","mealPlan":"RO","company":"EXPEDIA INTERNATIONAL","adults":1,"children":0,"infants":0,"notes":"KING" },
        { "room":"103","guestName":"O'NEILL, PATRICK","arrivalDate":"2025-12-22","departureDate":"2025-12-23","rateCode":"8301003","mealPlan":"BB","company":"DIRECT, GUEST","adults":1,"children":0,"infants":0,"notes":"VIP" },
        { "room":"104","guestName":"ROSSI, LUCA","arrivalDate":"2025-12-21","departureDate":"2025-12-25","rateCode":"8301004","mealPlan":"RO","company":"BOOKING.COM B.V.","adults":2,"children":1,"infants":0,"notes":"" },
        { "room":"105","guestName":"MULLER, ANNA","arrivalDate":"2025-12-22","departureDate":"2025-12-24","rateCode":"8301005","mealPlan":"BB","company":"HRS","adults":1,"children":0,"infants":0,"notes":"Call Aleksandra" },
      
        { "room":"106","guestName":"DUPONT, CLAIRE","arrivalDate":"2025-12-20","departureDate":"2025-12-22","rateCode":"8301006","mealPlan":"RO","company":"EXPEDIA INTERNATIONAL","adults":2,"children":0,"infants":0,"notes":"" },
        { "room":"107","guestName":"KOWALSKI, PIOTR","arrivalDate":"2025-12-21","departureDate":"2025-12-23","rateCode":"8301007","mealPlan":"BB","company":"BOOKING.COM B.V.","adults":1,"children":0,"infants":0,"notes":"He is sick, bring hot waer with milk" },
        { "room":"108","guestName":"SANTOS, RICARDO","arrivalDate":"2025-12-22","departureDate":"2025-12-26","rateCode":"8301008","mealPlan":"RO","company":"DIRECT, GUEST","adults":2,"children":0,"infants":0,"notes":"" },
        { "room":"109","guestName":"BROWN, EMILY","arrivalDate":"2025-12-21","departureDate":"2025-12-22","rateCode":"8301009","mealPlan":"BB","company":"BOOKING.COM B.V.","adults":1,"children":0,"infants":0,"notes":"" },
        { "room":"110","guestName":"NOVAK, PETRA","arrivalDate":"2025-12-20","departureDate":"2025-12-24","rateCode":"8301010","mealPlan":"RO","company":"EXPEDIA INTERNATIONAL","adults":2,"children":1,"infants":0,"notes":"" },
      
        { "room":"201","guestName":"LEE, MIN","arrivalDate":"2025-12-21","departureDate":"2025-12-23","rateCode":"8301011","mealPlan":"BB","company":"BOOKING.COM B.V.","adults":2,"children":0,"infants":0,"notes":"" },
        { "room":"202","guestName":"FERNANDEZ, CARLOS","arrivalDate":"2025-12-22","departureDate":"2025-12-24","rateCode":"8301012","mealPlan":"RO","company":"DIRECT, GUEST","adults":1,"children":0,"infants":0,"notes":"" },
        { "room":"203","guestName":"WILSON, SARAH","arrivalDate":"2025-12-21","departureDate":"2025-12-25","rateCode":"8301013","mealPlan":"BB","company":"BOOKING.COM B.V.","adults":2,"children":1,"infants":0,"notes":"" },
        { "room":"204","guestName":"PETROV, IVAN","arrivalDate":"2025-12-20","departureDate":"2025-12-22","rateCode":"8301014","mealPlan":"RO","company":"EXPEDIA INTERNATIONAL","adults":1,"children":0,"infants":0,"notes":"" },
        { "room":"205","guestName":"NIELSEN, SOFIE","arrivalDate":"2025-12-22","departureDate":"2025-12-23","rateCode":"8301015","mealPlan":"BB","company":"BOOKING.COM B.V.","adults":2,"children":0,"infants":0,"notes":"" },
      
        { "room":"206","guestName":"AHMED, YOUSSEF","arrivalDate":"2025-12-21","departureDate":"2025-12-24","rateCode":"8301016","mealPlan":"RO","company":"DIRECT, GUEST","adults":2,"children":2,"infants":0,"notes":"" },
        { "room":"207","guestName":"KIM, JIHOON","arrivalDate":"2025-12-22","departureDate":"2025-12-25","rateCode":"8301017","mealPlan":"BB","company":"BOOKING.COM B.V.","adults":1,"children":0,"infants":0,"notes":"" },
        { "room":"208","guestName":"MARTIN, PAUL","arrivalDate":"2025-12-21","departureDate":"2025-12-22","rateCode":"8301018","mealPlan":"RO","company":"EXPEDIA INTERNATIONAL","adults":1,"children":0,"infants":0,"notes":"" },
        { "room":"209","guestName":"ALVAREZ, LUCIA","arrivalDate":"2025-12-22","departureDate":"2025-12-24","rateCode":"8301019","mealPlan":"BB","company":"BOOKING.COM B.V.","adults":2,"children":0,"infants":0,"notes":"" },
        { "room":"210","guestName":"THOMPSON, MARK","arrivalDate":"2025-12-21","departureDate":"2025-12-26","rateCode":"8301020","mealPlan":"RO","company":"DIRECT, GUEST","adults":2,"children":1,"infants":0,"notes":"" },
      
        { "room":"301","guestName":"KAMOLA, ADAN","arrivalDate":"2025-12-22","departureDate":"2025-12-24","rateCode":"8301021","mealPlan":"RO","company":"BOOKING.COM B.V.","adults":2,"children":0,"infants":0,"notes":"" },
        { "room":"302","guestName":"VIEJO, CONNOR","arrivalDate":"2025-12-21","departureDate":"2025-12-22","rateCode":"8301022","mealPlan":"BB","company":"BOOKING.COM B.V.","adults":2,"children":0,"infants":0,"notes":"VIP" },
      
        { "room":"303","guestName":"HERNANDEZ, DIEGO","arrivalDate":"2025-12-20","departureDate":"2025-12-23","rateCode":"8301023","mealPlan":"RO","company":"EXPEDIA INTERNATIONAL","adults":1,"children":0,"infants":0,"notes":"" },
        { "room":"304","guestName":"WANG, LI","arrivalDate":"2025-12-22","departureDate":"2025-12-25","rateCode":"8301024","mealPlan":"BB","company":"BOOKING.COM B.V.","adults":2,"children":1,"infants":0,"notes":"" },
        { "room":"305","guestName":"MURPHY, SEAN","arrivalDate":"2025-12-21","departureDate":"2025-12-24","rateCode":"8301025","mealPlan":"RO","company":"DIRECT, GUEST","adults":1,"children":0,"infants":0,"notes":"" }
      
        /* … continúa hasta 90 siguiendo el mismo patrón (habitaciones 306–520, mezcla BB/RO) */
      ]
      ;
  }
  