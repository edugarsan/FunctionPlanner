let DATA = null;

const lists = {
  sandwiches: document.getElementById("sandwichesList"),
  soups: document.getElementById("soupsList"),
  desserts: document.getElementById("dessertsList"),
};

const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");
const printBtn = document.getElementById("printBtn");

const menuTitle = document.getElementById("menuTitle");
const menuMeta = document.getElementById("menuMeta");
const menuOutput = document.getElementById("menuOutput");

const menuTitleInput = document.getElementById("menuTitleInput");
const menuMetaInput  = document.getElementById("menuMetaInput");

function formatAllergens(allergens = []) {
  if (!allergens.length) return "Allergens: none";
  return `Allergens: ${allergens.join(", ")}`;
}

function cardTemplate(categoryKey, item) {
  const vegTag =
    categoryKey === "soups"
      ? (item.vegetarian ? " • Vegetarian" : " • Not vegetarian")
      : "";

  return `
    <label class="card">
      <input type="checkbox" data-category="${categoryKey}" data-id="${item.id}" />
      <div>
        <p class="card__title">${item.title}</p>
        <p class="card__meta">${formatAllergens(item.allergens)}${vegTag}</p>
      </div>
    </label>
  `;
}

function renderSelectors(data) {
  for (const key of ["sandwiches", "soups", "desserts"]) {
    lists[key].innerHTML = data[key].map(item => cardTemplate(key, item)).join("");
  }
}

function getSelectedIds() {
  const checked = document.querySelectorAll('input[type="checkbox"][data-category]:checked');
  const result = { sandwiches: [], soups: [], desserts: [] };

  checked.forEach(cb => {
    const cat = cb.dataset.category;
    result[cat].push(cb.dataset.id);
  });

  return result;
}

function byIds(items, ids) {
  const map = new Map(items.map(i => [i.id, i]));
  return ids.map(id => map.get(id)).filter(Boolean);
}

function buildMenuHTML(selected) {
  const selectedSandwiches = byIds(DATA.sandwiches, selected.sandwiches);
  const selectedSoups      = byIds(DATA.soups, selected.soups);
  const selectedDesserts   = byIds(DATA.desserts, selected.desserts);

  const empty =
    !selectedSandwiches.length && !selectedSoups.length && !selectedDesserts.length;

  if (empty) return `<p class="placeholder">No items selected.</p>`;

  const note = (item, categoryKey) => {
    const allergens = (item.allergens && item.allergens.length)
      ? `Allergens: ${item.allergens.join(", ")}`
      : `Allergens: none`;

    if (categoryKey === "soups") {
      const veg = item.vegetarian ? "Vegetarian" : "Not vegetarian";
      return `${allergens} • ${veg}`;
    }
    return allergens;
  };

  const itemsHTML = (items, categoryKey) => {
    return items.map(i => `
      <li class="menu-item">
        <div class="menu-item__title">${i.title}</div>
        <div class="menu-item__note">${note(i, categoryKey)}</div>
      </li>
    `).join("");
  };

  const section = (title, items, categoryKey) => {
    if (!items.length) return "";
    return `
      <section class="menu-section">
        <h2>${title}</h2>
        <ul class="menu-list">
          ${itemsHTML(items, categoryKey)}
        </ul>
      </section>
    `;
  };

  // ✅ ORDER: Soup → Sandwiches → Dessert
  return `
    ${section("Soup", selectedSoups, "soups")}
    ${section("Sandwiches", selectedSandwiches, "sandwiches")}
    ${section("Dessert", selectedDesserts, "desserts")}
  `;
}

function clearSelection() {
  document.querySelectorAll('input[type="checkbox"][data-category]').forEach(cb => (cb.checked = false));
  menuOutput.innerHTML = `<p class="placeholder">Select items and click “Generate menu”.</p>`;
}

async function init() {
  try {
    const res = await fetch("./data/menu-data.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    DATA = await res.json();

    renderSelectors(DATA);

    // Defaults
    menuTitleInput.value = "Lunch Menu – Saturday";
    menuMetaInput.value  = "Conference & Events";

    menuTitle.textContent = menuTitleInput.value;
    menuMeta.textContent  = menuMetaInput.value;

    // Live sync
    menuTitleInput.addEventListener("input", () => {
      menuTitle.textContent = menuTitleInput.value.trim() || "Menu";
    });

    menuMetaInput.addEventListener("input", () => {
      menuMeta.textContent = menuMetaInput.value.trim() || "";
    });

  } catch (err) {
    menuOutput.innerHTML = `<p class="placeholder">Could not load menu-data.json. (${err.message})</p>`;
  }
}

generateBtn.addEventListener("click", () => {
  const selected = getSelectedIds();
  menuOutput.innerHTML = buildMenuHTML(selected);
});

clearBtn.addEventListener("click", clearSelection);
printBtn.addEventListener("click", () => window.print());

init();
