// js/schedule.js

const DATA_URL = "data/events.json";

const scheduleSummary = document.getElementById("schedule-summary");
const scheduleHead = document.getElementById("schedule-head");
const scheduleBody = document.getElementById("schedule-body");

// Días en el orden que quieres mostrar
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

let allEvents = [];

/**
 * Cargar eventos desde el JSON
 */
async function loadSchedule() {
  try {
    scheduleSummary.textContent = "Loading schedule…";

    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error("No se pudo cargar el JSON");

    const data = await res.json();
    allEvents = data;

    const rooms = getUniqueRooms(allEvents);
    buildTableHeader();
    buildTableBody(rooms, allEvents);
    updateScheduleSummary(rooms, allEvents);
  } catch (err) {
    console.error(err);
    scheduleSummary.textContent = "Error loading schedule.";
    scheduleBody.innerHTML =
      '<tr><td colspan="8" class="empty-state">Ha ocurrido un error al cargar los datos.</td></tr>';
  }
}

/**
 * Obtener lista de salas únicas, ordenadas
 */
function getUniqueRooms(events) {
  const rooms = [...new Set(events.map((e) => e.Room))];
  rooms.sort((a, b) => a.localeCompare(b));
  return rooms;
}

/**
 * Construir cabecera de la tabla (fila de días)
 */
function buildTableHeader() {
  const tr = document.createElement("tr");

  // Primera celda para la columna de salas
  const thRoom = document.createElement("th");
  thRoom.className = "schedule-header-room";
  thRoom.textContent = "Room";
  tr.appendChild(thRoom);

  // Celdas de días
  DAYS.forEach((day) => {
    const th = document.createElement("th");
    th.className = "schedule-header-day";
    th.textContent = day;
    tr.appendChild(th);
  });

  scheduleHead.innerHTML = "";
  scheduleHead.appendChild(tr);
}

/**
 * Construir el cuerpo de la tabla (filas por sala)
 */
function buildTableBody(rooms, events) {
  scheduleBody.innerHTML = "";

  rooms.forEach((room) => {
    const tr = document.createElement("tr");

    // Celda de sala (columna izquierda)
    const roomCell = document.createElement("th");
    roomCell.scope = "row";
    roomCell.className = "schedule-room-cell";
    roomCell.textContent = room;
    tr.appendChild(roomCell);

    // Celdas por cada día
    DAYS.forEach((day) => {
      const td = document.createElement("td");
      td.className = "schedule-day-cell";

      const eventsForCell = events.filter(
        (ev) => ev.Room === room && ev.DayOfWeek === day
      );

      if (eventsForCell.length) {
        const cellContent = document.createElement("div");
        cellContent.className = "schedule-cell-events";

        eventsForCell.forEach((event) => {
          const {
            EventName,
            StartTime,
            EndTime,
            SetupType,
            SetupNumber,
            GuestCount
          } = event;

          const eventDiv = document.createElement("div");
          eventDiv.className = "schedule-event";

          // Título arriba
          const title = document.createElement("div");
          title.className = "schedule-event-title";
          title.textContent = EventName;

          // Setup en el centro, grande
          const setup = document.createElement("div");
          setup.className = "schedule-event-setup";
          setup.textContent = `${SetupType} (${GuestCount} pax)`;

          // Footer con horas (izquierda inicio, derecha fin)
          const footer = document.createElement("div");
          footer.className = "schedule-event-footer";

          const startSpan = document.createElement("span");
          startSpan.className = "schedule-event-time schedule-event-time--start";
          startSpan.textContent = StartTime || "TBC";

          const endSpan = document.createElement("span");
          endSpan.className = "schedule-event-time schedule-event-time--end";
          endSpan.textContent = EndTime || "TBC";

          footer.appendChild(startSpan);
          footer.appendChild(endSpan);

          eventDiv.appendChild(title);
          eventDiv.appendChild(setup);
          eventDiv.appendChild(footer);

          cellContent.appendChild(eventDiv);
        });

        td.appendChild(cellContent);
      } else {
        td.classList.add("schedule-day-cell--empty");
      }

      tr.appendChild(td);
    });

    scheduleBody.appendChild(tr);
  });
}

/**
 * Actualizar el texto de resumen
 */
function updateScheduleSummary(rooms, events) {
  const totalEvents = events.length;
  const totalRooms = rooms.length;

  scheduleSummary.innerHTML = `
    Showing <strong>${totalEvents}</strong> events across
    <strong>${totalRooms}</strong> rooms this week.
  `;
}

/**
 * Init
 */
loadSchedule();
