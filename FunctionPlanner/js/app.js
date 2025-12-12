// js/app.js

// Ruta al JSON (desde index.html)
const DATA_URL = "data/events.json";

/**
 * Elementos del DOM
 */
const eventsGrid = document.getElementById("events-grid");
const summaryText = document.getElementById("summary-text");
const searchInput = document.getElementById("search-input");
const roomFilter = document.getElementById("room-filter");
const dayFilter = document.getElementById("day-filter");

let allEvents = [];
let filteredEvents = [];

/**
 * Cargar eventos desde el JSON
 */
async function loadEvents() {
    try {
        summaryText.textContent = "Loading events…";

        const res = await fetch(DATA_URL);
        if (!res.ok) throw new Error("No se pudo cargar el JSON");

        const data = await res.json();
        allEvents = data;
        filteredEvents = [...allEvents];

        populateFilters(allEvents);
        renderEvents(filteredEvents);
        updateSummary();
    } catch (err) {
        console.error(err);
        summaryText.textContent = "Error loading events.";
        eventsGrid.innerHTML =
            '<div class="empty-state">Ha ocurrido un error al cargar los datos.</div>';
    }
}

/**
 * Detectar si un evento ya ha acabado
 */
 function isEventPast(event) {
    if (!event.Date || !event.EndTime) return false;

    const [year, month, day] = event.Date.split("-").map(Number);
    const [hour, minute] = event.EndTime.split(":").map(Number);

    // Fecha en hora local REAL (no UTC)
    const endDateTime = new Date(year, month - 1, day, hour, minute);

    return endDateTime < new Date();
}


/**
 * Rellenar selects de filtro (rooms, days)
 */
function populateFilters(events) {
    const rooms = [...new Set(events.map((e) => e.Room))].sort();
    const days = [...new Set(events.map((e) => e.DayOfWeek))].sort();

    // Rooms
    rooms.forEach((room) => {
        const opt = document.createElement("option");
        opt.value = room;
        opt.textContent = room;
        roomFilter.appendChild(opt);
    });

    // Days
    days.forEach((day) => {
        const opt = document.createElement("option");
        opt.value = day;
        opt.textContent = day;
        dayFilter.appendChild(opt);
    });
}

/**
 * Aplicar filtros y búsqueda
 */
function applyFilters() {
    const search = searchInput.value.trim().toLowerCase();
    const roomValue = roomFilter.value;
    const dayValue = dayFilter.value;

    filteredEvents = allEvents.filter((event) => {
        const matchesSearch =
            !search ||
            event.EventName.toLowerCase().includes(search) ||
            event.OrganizerName.toLowerCase().includes(search);
        const matchesRoom = !roomValue || event.Room === roomValue;
        const matchesDay = !dayValue || event.DayOfWeek === dayValue;

        return matchesSearch && matchesRoom && matchesDay;
    });

    renderEvents(filteredEvents);
    updateSummary();
}

/**
 * Actualizar texto de resumen
 */
function updateSummary() {
    const total = allEvents.length;
    const visible = filteredEvents.length;

    if (!total) {
        summaryText.textContent = "No events loaded.";
        return;
    }

    if (visible === total) {
        summaryText.innerHTML = `Showing <strong>${visible}</strong> of <strong>${total}</strong> events.`;
    } else {
        summaryText.innerHTML = `Showing <strong>${visible}</strong> of <strong>${total}</strong> events (filtered).`;
    }
}

/**
 * Renderizar tarjetas de eventos
 */
function renderEvents(events) {
    if (!events.length) {
        eventsGrid.innerHTML =
            '<div class="empty-state">No hay eventos que coincidan con los filtros actuales.</div>';
        return;
    }

    const html = events
        .map((event) => {
            // Renombramos Date -> EventDate para NO pisar el objeto global Date
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
                FoodAndBeverage,
            } = event;

            const formattedArrival = OrganizerArrival
                ? new Date(OrganizerArrival).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                })
                : "N/A";

            const formattedDate = EventDate
                ? new Date(EventDate).toLocaleDateString("en-IE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                })
                : "Date TBC";

            const isPast = isEventPast(event);
            const pastClass = isPast ? "past-event" : "";

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
            <article onclick="location.href='./event.html?id=${event.EventId}'" class="event-card ${pastClass}">
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
             ${EventName}
          </h2>

          <div class="event-setup-chip">
            <span>${SetupType}</span>
          </div>

          <div class="event-meta">
            <div class="event-meta__item">
              <svg class="icn" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke-width="1.6"/>
                <line x1="12" y1="12" x2="12" y2="7" stroke-width="1.6"/>
                <line x1="12" y1="12" x2="15" y2="12" stroke-width="1.6"/>
              </svg>
              <span>
                <span class="event-meta__label">Time</span><br />
                ${StartTime || "TBC"} – ${EndTime || "TBC"}
              </span>
            </div>

            <div class="event-meta__item">
              <svg class="icn" viewBox="0 0 24 24">
                <circle cx="9" cy="9" r="4" stroke-width="1.6"/>
                <path d="M3 20c0-4 3-6 6-6s6 2 6 6" stroke-width="1.6" fill="none"/>
              </svg>
              <span>
                <span class="event-meta__label">Guests</span><br />
                ${GuestCount ?? "TBC"}
              </span>
            </div>

            <div class="event-meta__item">
              <svg class="icn" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" stroke-width="1.6"/>
                <path d="M4 20c0-5 4-7 8-7s8 2 8 7" stroke-width="1.6" fill="none"/>
              </svg>
              <span>
                <span class="event-meta__label">Organizer</span><br />
                ${OrganizerName}
              </span>
            </div>

            <div class="event-meta__item">
              <svg class="icn" viewBox="0 0 24 24">
                <path d="M12 3a6 6 0 0 0-6 6c0 4.5 6 12 6 12s6-7.5 6-12a6 6 0 0 0-6-6z" stroke-width="1.6" fill="none"/>
                <circle cx="12" cy="9" r="2.4" stroke-width="1.6"/>
              </svg>
              <span>
                <span class="event-meta__label">Arrival</span><br />
                ${formattedArrival}
              </span>
            </div>
          </div>

          ${Notes ? `<p class="event-notes"><strong>Notes:</strong> ${Notes}</p>` : ""}

          ${tasksHtml}

          ${fnbHtml}
        </div>
      </article>
    `;
        })
        .join("");

    eventsGrid.innerHTML = html;
}

/**
 * Listeners
 */
searchInput.addEventListener("input", applyFilters);
roomFilter.addEventListener("change", applyFilters);
dayFilter.addEventListener("change", applyFilters);

/**
 * Init
 */
loadEvents();
