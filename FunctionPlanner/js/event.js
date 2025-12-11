// Lee el ID de la URL
const params = new URLSearchParams(window.location.search);
const eventId = Number(params.get("id"));
const container = document.getElementById("event-container");

async function loadEvent() {
  const res = await fetch("data/events.json");
  const events = await res.json();

  const event = events.find((e) => e.EventId === eventId);
  if (!event) {
    container.innerHTML = "<p>Event not found.</p>";
    return;
  }

  renderEvent(event);
}

function generateBanner(room, setup) {
  if (!room || !setup) return "images/banners/default.jpg";

  const cleanRoom = room.toLowerCase().replace(/\s+/g, "-");
  const cleanSetup = setup.toLowerCase().replace(/\s+/g, "-");

  return `images/banners/${cleanRoom}-${cleanSetup}.jpg`;
}

function renderEvent(event) {
  const banner = generateBanner(event.Room, event.SetupType);

  container.innerHTML = `
    <h1 class="page-title">${event.EventName}</h1>

    <div class="event-banner-wrapper">
      <img src="${banner}" class="event-banner" alt="banner">
    </div>

    <article class="event-card event-card--full">
      <div class="event-card__content">

        <div class="event-card__top">
          <div class="event-day-badge">
            <span>${event.DayOfWeek}</span>
            <span>•</span>
            <span>${new Date(event.Date).toLocaleDateString("en-IE", {
              day: "2-digit", month: "short", year: "numeric"
            })}</span>
          </div>

          <div class="event-room-pill">
            <span class="event-room-pill__dot"></span>
            <span>${event.Room}</span>
          </div>
        </div>

        <div class="event-setup-chip" style="margin-top:12px;">
          <span>${event.SetupType}</span>
          <small>(${event.SetupNumber ?? "?"})</small>
        </div>

        <div style="margin-top:18px;"></div>

        <div class="event-meta">
          <div class="event-meta__item">
            <span>
              <span class="event-meta__label">Time</span><br>
              ${event.StartTime} – ${event.EndTime}
            </span>
          </div>

          <div class="event-meta__item">
            <span>
              <span class="event-meta__label">Guests</span><br>
              ${event.GuestCount}
            </span>
          </div>

          <div class="event-meta__item">
            <span>
              <span class="event-meta__label">Organizer</span><br>
              ${event.OrganizerName}
            </span>
          </div>
        </div>

        ${
          event.Notes
            ? `<p class="event-notes"><strong>Notes:</strong> ${event.Notes}</p>`
            : ""
        }

        ${
          event.ExtraTasks?.length
            ? `
          <h3 class="section-title">Extra Tasks</h3>
          <div class="event-tasks__list">
            ${event.ExtraTasks.map(t => `<span class="event-task-pill">${t}</span>`).join("")}
          </div>`
            : ""
        }

        ${
          event.FoodAndBeverage?.length
            ? `
          <h3 class="section-title">Food & Beverage</h3>
          <div class="event-fnb__list">
            ${event.FoodAndBeverage.map(f => `
              <div class="event-fnb-item">
                <span class="event-fnb-item__time">${f.Time}</span>
                <span class="event-fnb-item__action">${f.Action}</span>
              </div>
            `).join("")}
          </div>`
            : ""
        }

      </div>
    </article>
  `;
}

loadEvent();
