// js/room-style.js
document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const track = carousel.querySelector("[data-track]");
    const prev = carousel.querySelector("[data-prev]");
    const next = carousel.querySelector("[data-next]");
    const dotsWrap = carousel.parentElement.querySelector("[data-dots]");
  
    if (!track) return;
  
    const slides = Array.from(track.querySelectorAll("img"));
    let index = 0;
  
    // Dots
    if (dotsWrap) {
      dotsWrap.innerHTML = "";
      slides.forEach((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "rs-dot";
        b.setAttribute("aria-label", `Go to slide ${i + 1}`);
        b.addEventListener("click", () => goTo(i));
        dotsWrap.appendChild(b);
      });
    }
  
    function updateDots() {
      if (!dotsWrap) return;
      const dots = Array.from(dotsWrap.querySelectorAll(".rs-dot"));
      dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    }
  
    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      updateDots();
    }
  
    prev?.addEventListener("click", () => goTo(index - 1));
    next?.addEventListener("click", () => goTo(index + 1));
  
    // Init
    track.style.transform = "translateX(0%)";
    updateDots();
  });
  