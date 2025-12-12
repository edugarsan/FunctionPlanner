// js/add-event.js

const DATA_URL = "data/events.json";
let events = [];

// Load existing events
async function loadEvents() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error("Cannot load JSON");
    events = await res.json();
  } catch (e) {
    console.error("Error loading events.json:", e);
    events = [];
  }
}
loadEvents();

const form = document.getElementById("event-form");
const downloadContainer = document.getElementById("download-container");
const previewContainer = document.getElementById("event-preview");

/**
 * Crea un objeto evento a partir del formulario
 */
function buildEventFromForm() {
  const eventName = document.getElementById("eventName").value.trim();
  const date = document.getElementById("eventDate").value;
  const dayOfWeek = document.getElementById("dayOfWeek").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;
  const room = document.getElementById("room").value.trim();
  const setupType = document.getElementById("setupType").value.trim();
  const setupNumber = document.getElementById("setupNumber").value;
  const organizerName = document.getElementById("organizerName").value.trim();
  const organizerArrival = document.getElementById("organizerArrival").value;
  const guestCount = document.getElementById("guestCount").value;
  const notes = document.getElementById("notes").value.trim();
  const extraTasksRaw = document.getElementById("extraTasks").value;
  const fnbRaw = document.getElementById("fnb").value;

  return {
    EventId: null,
    EventName: eventName || "New Event",
    Date: date || null,
    DayOfWeek: dayOfWeek || "TBC",
    StartTime: startTime || "TBC",
    EndTime: endTime || "TBC",
    Room: room || "Room TBC",
    SetupType: setupType || "Setup Type",
    SetupNumber: setupNumber ? Number(setupNumber) : null,
    OrganizerName: organizerName || "Organizer TBC",
    OrganizerArrival: organizerArrival && date
      ? new Date(`${date}T${organizerArrival}`).toISOString()
      : null,
    GuestCount: guestCount ? Number(guestCount) : null,
    Notes: notes || "",
    ExtraTasks: extraTasksRaw
      ? extraTasksRaw.split(",").map(t => t.trim()).filter(Boolean)
      : [],
    FoodAndBeverage: fnbRaw
      ? fnbRaw.split(",").map(item => {
          const parts = item.trim().split(" ");
          const time = parts[0] || "";
          const action = parts.slice(1).join(" ");
          return { Time: time, Action: action || "" };
        }).filter(i => i.Time && i.Action)
      : []
  };
}

/**
 * Render de UNA tarjeta de evento (misma estructura que en app.js)
 */
function renderEventCard(event) {
  const {
    EventName,
    Date: EventDate,
    DayOfWeek,
    StartTime,
    EndTime,
    Room,
    SetupType,
    SetupNumber,
    OrganizerName,
    OrganizerArrival,
    GuestCount,
    Notes,
    ExtraTasks,
    FoodAndBeverage
  } = event;

  const formattedArrival = OrganizerArrival
    ? new Date(OrganizerArrival).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
      })
    : "TBC";

  const formattedDate = EventDate
    ? new Date(EventDate).toLocaleDateString("en-IE", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : "Date TBC";

  const tasksHtml =
    Array.isArray(ExtraTasks) && ExtraTasks.length
      ? `
    <div class="event-tasks">
      <div class="event-tasks__title">Extra tasks</div>
      <div class="event-tasks__list">
        ${ExtraTasks.map(
          (task) => `<span class="event-task-pill">${task}</span>`
        ).join("")}
      </div>
    </div>`
      : "";

  const fnbHtml =
    Array.isArray(FoodAndBeverage) && FoodAndBeverage.length
      ? `
    <div class="event-fnb">
      <div class="event-fnb__title">Food &amp; Beverage</div>
      <div class="event-fnb__list">
        ${FoodAndBeverage.map(
          (item) => `
          <div class="event-fnb-item">
            <span class="event-fnb-item__time">${item.Time}</span>
            <span class="event-fnb-item__action">${item.Action}</span>
          </div>
        `
        ).join("")}
      </div>
    </div>`
      : "";

  return `
    <article class="event-card">
      <div class="event-card__content">
        <div class="event-card__top">
          <div class="event-day-badge">
            <span>${DayOfWeek || "TBC"}</span>
            <span>•</span>
            <span>${formattedDate}</span>
          </div>
          <div class="event-room-pill">
            <span class="event-room-pill__dot"></span>
            <span>${Room}</span>
          </div>
        </div>

        <h2 class="event-title">
          <span>●</span> ${EventName}
        </h2>

        <div class="event-setup-chip">
          <span>${SetupType}</span>
          <small>(${SetupNumber || "?"})</small>
        </div>

        <div class="event-meta">
          <div class="event-meta__item">
            <span>
              <span class="event-meta__label">Time</span><br />
              ${StartTime || "TBC"} – ${EndTime || "TBC"}
            </span>
          </div>
          <div class="event-meta__item">
            <span>
              <span class="event-meta__label">Guests</span><br />
              ${GuestCount ?? "TBC"}
            </span>
          </div>
          <div class="event-meta__item">
            <span>
              <span class="event-meta__label">Organizer</span><br />
              ${OrganizerName}
            </span>
          </div>
          <div class="event-meta__item">
            <span>
              <span class="event-meta__label">Arrival</span><br />
              ${formattedArrival}
            </span>
          </div>
        </div>

        ${
          Notes
            ? `<p class="event-notes"><strong>Notes:</strong> ${Notes}</p>`
            : ""
        }
        ${tasksHtml}
        ${fnbHtml}
      </div>
    </article>
  `;
}

/**
 * Actualiza la vista previa
 */
function updatePreview() {
  const event = buildEventFromForm();
  const cardHtml = renderEventCard(event);
  previewContainer.innerHTML = cardHtml;
}

// Escuchar cambios del formulario para actualizar preview
const formFields = document.querySelectorAll(
  "#event-form input, #event-form select, #event-form textarea"
);
formFields.forEach((field) => {
  field.addEventListener("input", updatePreview);
  field.addEventListener("change", updatePreview);
});

// Inicializar preview con datos vacíos
updatePreview();

/**
 * Envío del formulario → genera JSON actualizado descargable
 */
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const newEvent = buildEventFromForm();
  // Asignar ID nuevo
  newEvent.EventId = events.length ? events[events.length - 1].EventId + 1 : 1;

  events.push(newEvent);

  const updatedJson = JSON.stringify(events, null, 2);
  const blob = new Blob([updatedJson], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  downloadContainer.innerHTML = `
    <a href="${url}" download="events-updated.json" class="button-download">
      Download Updated JSON
    </a>
  `;
});

