// js/fnb.js

const DATA_URL = "data/events.json";

const fnbSummary = document.getElementById("fnb-summary");
const fnbDaySelect = document.getElementById("fnb-day-select");
const fnbTimeline = document.getElementById("fnb-timeline");

let allEvents = [];

/**
 * Cargar eventos y preparar timeline
 */
async function loadFnbTimeline() {
  try {
    fnbSummary.textContent = "Loading Food & Beverage timeline…";

    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error("No se pudo cargar el JSON");

    const data = await res.json();
    allEvents = data;

    // Seleccionar por defecto el primer día que exista en el JSON
    const existingDays = [...new Set(allEvents.map((e) => e.DayOfWeek))];
    if (existingDays.length) {
      fnbDaySelect.value = existingDays[0];
    }

    renderTimelineForDay(fnbDaySelect.value);
    fnbSummary.textContent = `Showing Food & Beverage timeline for ${fnbDaySelect.value}.`;
  } catch (err) {
    console.error(err);
    fnbSummary.textContent = "Error loading Food & Beverage timeline.";
    fnbTimeline.innerHTML =
      '<div class="empty-state">Ha ocurrido un error al cargar los datos.</div>';
  }
}

/**
 * Construir lista global F&B para un día
 */
function renderTimelineForDay(day) {
  if (!allEvents.length) return;

  // Crear lista plana con todos los puntos F&B de ese día
  const items = [];

  allEvents.forEach((event) => {
    if (event.DayOfWeek !== day || !Array.isArray(event.FoodAndBeverage)) return;

    event.FoodAndBeverage.forEach((slot) => {
      items.push({
        Time: slot.Time,
        Action: slot.Action,
        EventName: event.EventName,
        Room: event.Room,
      });
    });
  });

  if (!items.length) {
    fnbTimeline.innerHTML =
      '<div class="empty-state">No hay acciones de Food &amp; Beverage para este día.</div>';
    fnbSummary.textContent = `No Food & Beverage items for ${day}.`;
    return;
  }

  // Ordenar por hora
  items.sort((a, b) => (a.Time > b.Time ? 1 : a.Time < b.Time ? -1 : 0));

  const html = items
    .map(
      (item) => `
      <div class="fnb-timeline-item">
        <div class="fnb-timeline-time">${item.Time}</div>
        <div class="fnb-timeline-dot"></div>
        <div class="fnb-timeline-card">
          <div class="fnb-timeline-action">${item.Action}</div>
          <div class="fnb-timeline-meta">
            ${item.EventName} — <span>${item.Room}</span>
          </div>
        </div>
      </div>
    `
    )
    .join("");

  fnbTimeline.innerHTML = html;
  fnbSummary.textContent = `Showing <strong>${items.length}</strong> Food &amp; Beverage actions for <strong>${day}</strong>.`;
}

/**
 * Listeners
 */
fnbDaySelect.addEventListener("change", () => {
  renderTimelineForDay(fnbDaySelect.value);
});

/**
 * Init
 */
loadFnbTimeline();
