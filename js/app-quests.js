const listEl = document.getElementById("list");
const countPill = document.getElementById("countPill");

const detailTitle = document.getElementById("detailTitle");
const detailBadge = document.getElementById("detailBadge");
const detailShort = document.getElementById("detailShort");
const objectiveText = document.getElementById("objectiveText");
const detailLong = document.getElementById("detailLong");

const btnComplete = document.getElementById("btnComplete");

let reminders = [];
let activeId = null;

/* =========================
   HELPERS
========================= */

function groupByZone(items){
  const map = new Map();
  for (const it of items){
    const key = it.zone || "All";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(it);
  }
  return map;
}

/* =========================
   META (NORMAL / DAILY / ELITE / COMPLETE)
========================= */

function getMeta(rem){
  if (rem.status === "complete") {
    return { text: "(Complete)", cls: "meta--complete" };
  }

  switch (rem.type) {
    case "elite":
      return { text: "(Elite)", cls: "meta--elite" };
    case "daily":
      return { text: "(Daily)", cls: "meta--daily" };
    case "important":
      return { text: "(Important)", cls: "meta--important" };
    default:
      return { text: "", cls: "" }; // normal quest
  }
}

/* =========================
   RENDER LIST
========================= */

function renderList(){
  listEl.innerHTML = "";

  const total = reminders.length;
  const max = 20;
  countPill.textContent = `Quests: ${Math.min(total, max)}/${max}`;

  const groups = groupByZone(reminders);

  for (const [zone, items] of groups){
    const title = document.createElement("div");
    title.className = "groupTitle";
    title.textContent = zone;
    listEl.appendChild(title);

    for (const rem of items){
      const row = document.createElement("div");
      row.className = "item" + (rem.id === activeId ? " item--active" : "");
      row.dataset.id = rem.id;

      const bullet = document.createElement("div");
      bullet.className = "bullet";

      const name = document.createElement("h3");
      name.className =
        "itemTitle " +
        (rem.status === "complete" ? "itemTitle--complete" : "itemTitle--active");
      name.textContent = rem.title;

      const metaEl = document.createElement("div");
      const meta = getMeta(rem);
      metaEl.className = `itemMeta ${meta.cls}`;
      metaEl.textContent = meta.text;

      row.appendChild(bullet);
      row.appendChild(name);
      row.appendChild(metaEl);

      row.addEventListener("click", () => {
        activeId = rem.id;
        renderList();
        renderDetail(rem.id);
      });

      listEl.appendChild(row);
    }
  }
}

/* =========================
   RENDER DETAIL
========================= */

function renderDetail(id){
  const rem = reminders.find(r => r.id === id);
  if (!rem) return;

  detailTitle.textContent = rem.title;

  if (rem.tag){
    detailBadge.hidden = false;
    detailBadge.textContent = rem.tag;
  } else {
    detailBadge.hidden = true;
  }

  detailShort.textContent = rem.short || "—";
  objectiveText.textContent = rem.short || "—";
  detailLong.textContent = rem.long || "—";

  // Desactivar botón si ya está completada
  btnComplete.disabled = rem.status === "complete";
}

/* =========================
   LOCAL STORAGE
========================= */

function saveToLocal(){
  localStorage.setItem("quests", JSON.stringify(reminders));
}

/* =========================
   INIT
========================= */

async function init(){
    localStorage.removeItem("quests");

  try{
    const saved = localStorage.getItem("quests");

    if (saved){
      reminders = JSON.parse(saved);
    } else {
      const res = await fetch("data/reminders.json", { cache: "no-store" });
      reminders = await res.json();
      saveToLocal();
    }

    reminders.sort(
      (a,b) => (a.status === "complete") - (b.status === "complete")
    );

    activeId = reminders[0]?.id ?? null;

    renderList();
    if (activeId) renderDetail(activeId);

  } catch (e){
    listEl.innerHTML = `<div style="padding:14px;color:#ffb4b4;">
      Error cargando reminders.json. Usa un servidor local.
    </div>`;
    console.error(e);
  }
}

init();

/* =========================
   COMPLETE QUEST
========================= */

btnComplete.addEventListener("click", () => {
  if (!activeId) return;

  const rem = reminders.find(r => r.id === activeId);
  if (!rem) return;

  rem.status = "complete";
  saveToLocal();
  renderList();
  renderDetail(activeId);
});

/* =========================
   OTROS BOTONES
========================= */

document.getElementById("btnAbandon").addEventListener("click", () => {
  if (!activeId) return;

  reminders = reminders.filter(r => r.id !== activeId);
  saveToLocal();

  activeId = reminders[0]?.id ?? null;
  renderList();

  if (activeId) renderDetail(activeId);
});

document.getElementById("btnExit").addEventListener("click", () => {
  alert("Exit (demo)");
});

document.getElementById("btnShare").addEventListener("click", () => {
  if (!activeId) return;

  const rem = reminders.find(r => r.id === activeId);
  if (!rem) return;

  const text = `📌 ${rem.title}\n✅ ${rem.short}\n\n📝 ${rem.long}`;
  navigator.clipboard?.writeText(text);
});

document.getElementById("btnClose").addEventListener("click", () => {
  alert("Cerrar (demo)");
});
