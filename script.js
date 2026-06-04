/** 粒子连线背景（鼠标轻微互动） */
(function initParticleBackground() {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const particleCount = reduceMotion ? 28 : 72;
  const linkDistance = 140;
  const mouseRadius = 120;

  let w = 0;
  let h = 0;
  let particles = [];
  let mouse = { x: -9999, y: -9999, active: false };
  let rafId = 0;

  const resize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  };

  const randomBetween = (min, max) => min + Math.random() * (max - min);

  const createParticles = () => {
    particles = Array.from({ length: particleCount }, () => ({
      x: randomBetween(0, w),
      y: randomBetween(0, h),
      vx: randomBetween(-0.35, 0.35),
      vy: randomBetween(-0.35, 0.35),
      r: randomBetween(1, 2.2),
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      if (!reduceMotion) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < mouseRadius && dist > 0) {
            const force = (mouseRadius - dist) / mouseRadius * 0.02;
            p.vx -= (dx / dist) * force;
            p.vy -= (dy / dist) * force;
          }
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(56, 189, 248, 0.75)";
      ctx.fill();
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist > linkDistance) continue;

        const alpha = (1 - dist / linkDistance) * 0.35;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    if (mouse.active && !reduceMotion) {
      for (const p of particles) {
        const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y);
        if (dist > mouseRadius) continue;
        const alpha = (1 - dist / mouseRadius) * 0.5;
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }

    rafId = requestAnimationFrame(draw);
  };

  window.addEventListener("resize", () => {
    resize();
    createParticles();
  });

  window.addEventListener(
    "mousemove",
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    },
    { passive: true }
  );

  window.addEventListener(
    "mouseleave",
    () => {
      mouse.active = false;
    },
    { passive: true }
  );

  resize();
  createParticles();
  draw();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      cancelAnimationFrame(rafId);
      draw();
    }
  });
})();

/** 技能栈：雷达图 + 横向柱状图 */
(function initSkillsCharts() {
  if (typeof Chart === "undefined") return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const textSoft = "#94a3b8";
  const gridColor = "rgba(51, 65, 85, 0.45)";

  Chart.defaults.color = textSoft;
  Chart.defaults.font.family = '"Inter", "Microsoft YaHei", sans-serif';
  Chart.defaults.animation.duration = reduceMotion ? 0 : 900;

  const baseScale = {
    beginAtZero: true,
    max: 100,
    grid: { color: gridColor },
    ticks: { stepSize: 20, color: textSoft },
  };

  const barOptions = (height) => ({
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderColor: "rgba(56, 189, 248, 0.3)",
        borderWidth: 1,
        callbacks: {
          label: (ctx) => `熟练度：${ctx.raw}`,
        },
      },
    },
    scales: {
      x: { ...baseScale },
      y: {
        grid: { display: false },
        ticks: { color: "#e2e8f0", font: { size: 11 } },
      },
    },
  });

  const makeBarChart = (id, labels, data, colors) => {
    const el = document.getElementById(id);
    if (!el) return;
    const parent = el.closest(".chart-wrap");
    if (parent) parent.style.height = `${Math.max(180, labels.length * 36 + 48)}px`;

    new Chart(el, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: barOptions(parent?.offsetHeight),
    });
  };

  const radarEl = document.getElementById("skillsRadar");
  if (radarEl) {
    new Chart(radarEl, {
      type: "radar",
      data: {
        labels: ["数据分析", "产品工具", "AI 工具"],
        datasets: [
          {
            label: "综合熟练度",
            data: [80, 80, 75],
            backgroundColor: "rgba(56, 189, 248, 0.2)",
            borderColor: "#38bdf8",
            pointBackgroundColor: "#38bdf8",
            pointBorderColor: "#e2e8f0",
            pointHoverBackgroundColor: "#22d3ee",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            borderColor: "rgba(56, 189, 248, 0.3)",
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ` ${ctx.label}：${ctx.raw}`,
            },
          },
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: { stepSize: 25, backdropColor: "transparent", color: textSoft },
            grid: { color: gridColor },
            angleLines: { color: gridColor },
            pointLabels: { color: "#e2e8f0", font: { size: 12 } },
          },
        },
      },
    });
  }

  const cyan = "rgba(56, 189, 248, 0.75)";
  const cyanLight = "rgba(34, 211, 238, 0.65)";

  makeBarChart(
    "chartDataAnalysis",
    ["Excel", "GIS", "Tableau", "SQL", "SPSS", "MGWR"],
    [90, 88, 85, 82, 80, 75],
    [cyan, cyanLight, cyan, cyanLight, cyan, cyanLight]
  );

  const purple = "rgba(129, 140, 248, 0.75)";
  const purpleLight = "rgba(99, 102, 241, 0.65)";

  makeBarChart(
    "chartProductTools",
    ["Axure", "Office", "Xmind", "Figma", "ProcessOn", "墨刀", "PS"],
    [92, 90, 88, 85, 85, 80, 78],
    [purple, purpleLight, purple, purpleLight, purple, purpleLight, purple]
  );

  const ai = "rgba(34, 211, 238, 0.75)";
  const aiLight = "rgba(56, 189, 248, 0.6)";

  makeBarChart(
    "chartAiTools",
    ["Dify", "Cursor", "Coze", "V0.dev", "N8N"],
    [90, 88, 85, 82, 78],
    [ai, aiLight, ai, aiLight, ai]
  );
})();

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}

if (menuToggle && navLinks) {
  const navBackdrop = document.getElementById("navBackdrop");

  const setNavOpen = (open) => {
    navLinks.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("nav-open", open);
    if (navBackdrop) {
      navBackdrop.classList.toggle("is-visible", open);
      navBackdrop.hidden = !open;
    }
  };

  menuToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setNavOpen(!navLinks.classList.contains("open"));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      setNavOpen(false);
    });
  });

  navBackdrop?.addEventListener("click", () => {
    setNavOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setNavOpen(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 920) {
      setNavOpen(false);
    }
  });
}

/** 下载简历：下拉单选 */
(function initResumeDropdown() {
  const dropdown = document.getElementById("resumeDropdown");
  const toggle = document.getElementById("resumeDropdownToggle");
  const menu = document.getElementById("resumeDropdownMenu");
  if (!dropdown || !toggle || !menu) return;

  const options = menu.querySelectorAll(".resume-dropdown__option");

  const closeMenu = () => {
    dropdown.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    menu.hidden = true;
  };

  const openMenu = () => {
    dropdown.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    menu.hidden = false;
  };

  const downloadFile = (filename) => {
    const link = document.createElement("a");
    link.href = filename;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    if (dropdown.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  options.forEach((option) => {
    option.addEventListener("click", () => {
      options.forEach((item) => item.setAttribute("aria-selected", "false"));
      option.setAttribute("aria-selected", "true");
      downloadFile(option.dataset.file);
      closeMenu();
    });
  });

  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
})();

/** 作品集：多页横向滚动 + 圆点与键盘切换 + 自动轮播 */
const AUTOPLAY_MS = 4000;

document.querySelectorAll("[data-project-scroll]").forEach((root) => {
  const track = root.querySelector(".project-pages");
  const dotsBox = root.querySelector(".project-pages-dots");
  if (!track || !dotsBox) return;

  const pages = [...track.querySelectorAll(".project-page")];
  if (!pages.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const buttons = pages.map((page, i) => {
    const label =
      page.querySelector("figcaption")?.textContent?.trim() || `第 ${i + 1} 页`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-label", label);
    btn.setAttribute("aria-selected", i === 0 ? "true" : "false");
    btn.addEventListener("click", () => {
      const w = track.clientWidth;
      track.scrollTo({ left: i * w, behavior: "smooth" });
    });
    dotsBox.appendChild(btn);
    return btn;
  });

  const setActiveIndex = () => {
    const w = track.clientWidth || 1;
    const i = Math.min(
      buttons.length - 1,
      Math.max(0, Math.round(track.scrollLeft / w))
    );
    buttons.forEach((b, j) => b.setAttribute("aria-selected", j === i ? "true" : "false"));
  };

  let scrollEndTimer;
  track.addEventListener("scroll", () => {
    window.clearTimeout(scrollEndTimer);
    scrollEndTimer = window.setTimeout(setActiveIndex, 48);
    setActiveIndex();
  });
  window.addEventListener("resize", setActiveIndex);
  setActiveIndex();

  track.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const w = track.clientWidth;
    const delta = e.key === "ArrowRight" ? w : -w;
    track.scrollBy({ left: delta, behavior: "smooth" });
  });

  let autoplayTimer = null;

  const tickAutoplay = () => {
    if (pages.length < 2) return;
    const w = track.clientWidth || 1;
    const cur = Math.min(
      pages.length - 1,
      Math.max(0, Math.round(track.scrollLeft / w))
    );
    const next = (cur + 1) % pages.length;
    track.scrollTo({ left: next * w, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const startAutoplay = () => {
    if (reduceMotion || pages.length < 2 || document.hidden) return;
    stopAutoplay();
    autoplayTimer = window.setInterval(tickAutoplay, AUTOPLAY_MS);
  };

  const stopAutoplay = () => {
    if (autoplayTimer !== null) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };

  root.addEventListener("mouseenter", stopAutoplay);
  root.addEventListener("mouseleave", startAutoplay);
  root.addEventListener("focusin", stopAutoplay);
  root.addEventListener("focusout", (e) => {
    if (!e.relatedTarget || !root.contains(e.relatedTarget)) {
      startAutoplay();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  startAutoplay();
});

/** 图片画廊：Apple 风格点击放大预览 */
(function initImageLightbox() {
  const lightbox = document.getElementById("imageLightbox");
  if (!lightbox) return;

  const backdrop = lightbox.querySelector(".image-lightbox__backdrop");
  const stageImg = lightbox.querySelector(".image-lightbox__img");
  const captionEl = lightbox.querySelector(".image-lightbox__caption");
  const closeButtons = lightbox.querySelectorAll("[data-lightbox-close]");
  const prevBtn = lightbox.querySelector(".image-lightbox__nav--prev");
  const nextBtn = lightbox.querySelector(".image-lightbox__nav--next");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const easing = "cubic-bezier(0.32, 0.72, 0, 1)";
  const duration = reduceMotion ? 0 : 520;

  let galleryItems = [];
  let currentIndex = 0;
  let isOpen = false;
  let lastFocus = null;

  document.querySelectorAll("[data-image-gallery]").forEach((gallery) => {
    galleryItems = [...gallery.querySelectorAll("[data-zoom-src]")];
    galleryItems.forEach((item, index) => {
      item.addEventListener("click", () => openAt(index, item.querySelector("img")));
    });
  });

  if (!galleryItems.length) return;

  const getFinalRect = (naturalWidth, naturalHeight) => {
    const maxW = Math.min(window.innerWidth * 0.92, 1200);
    const maxH = window.innerHeight * 0.82;
    const ratio = naturalWidth / naturalHeight;
    let width = maxW;
    let height = width / ratio;

    if (height > maxH) {
      height = maxH;
      width = height * ratio;
    }

    return {
      width,
      height,
      left: (window.innerWidth - width) / 2,
      top: (window.innerHeight - height) / 2,
    };
  };

  const applyMotion = (fromRect, toRect, onDone) => {
    stageImg.classList.add("is-animating");
    stageImg.style.transition = "none";
    stageImg.style.width = `${fromRect.width}px`;
    stageImg.style.height = `${fromRect.height}px`;
    stageImg.style.transform = `translate(${fromRect.left}px, ${fromRect.top}px)`;
    stageImg.style.borderRadius = "12px";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        stageImg.style.transition = reduceMotion
          ? "none"
          : `transform ${duration}ms ${easing}, width ${duration}ms ${easing}, height ${duration}ms ${easing}, border-radius ${duration}ms ${easing}`;
        stageImg.style.width = `${toRect.width}px`;
        stageImg.style.height = `${toRect.height}px`;
        stageImg.style.transform = `translate(${toRect.left}px, ${toRect.top}px)`;
        stageImg.style.borderRadius = "14px";

        if (reduceMotion) {
          onDone?.();
          return;
        }

        const onEnd = (event) => {
          if (event.propertyName !== "transform") return;
          stageImg.removeEventListener("transitionend", onEnd);
          onDone?.();
        };
        stageImg.addEventListener("transitionend", onEnd);
      });
    });
  };

  const loadStageImage = (src) =>
    new Promise((resolve, reject) => {
      if (stageImg.src === src && stageImg.complete && stageImg.naturalWidth) {
        resolve();
        return;
      }
      stageImg.onload = () => resolve();
      stageImg.onerror = () => reject(new Error("image load failed"));
      stageImg.src = src;
    });

  const updateCaption = () => {
    const item = galleryItems[currentIndex];
    captionEl.textContent = item?.dataset.zoomCaption || "";
  };

  const openAt = async (index, thumbEl) => {
    const item = galleryItems[index];
    if (!item || !thumbEl) return;

    currentIndex = index;
    lastFocus = document.activeElement;

    const thumbRect = thumbEl.getBoundingClientRect();
    const src = item.dataset.zoomSrc;
    const alt = thumbEl.getAttribute("alt") || "";

    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    stageImg.alt = alt;
    updateCaption();

    try {
      await loadStageImage(src);
    } catch {
      close();
      return;
    }

    const finalRect = getFinalRect(stageImg.naturalWidth, stageImg.naturalHeight);
    isOpen = true;
    lightbox.classList.add("is-open");

    applyMotion(thumbRect, finalRect, () => {
      stageImg.classList.remove("is-animating");
      stageImg.style.transition = "none";
      stageImg.style.width = "";
      stageImg.style.height = "";
      stageImg.style.transform = "";
      stageImg.style.borderRadius = "";
    });
  };

  const close = () => {
    if (!isOpen) {
      lightbox.hidden = true;
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      return;
    }

    const item = galleryItems[currentIndex];
    const thumbEl = item?.querySelector("img");
    if (!thumbEl) {
      resetLightbox();
      return;
    }

    const thumbRect = thumbEl.getBoundingClientRect();
    const currentRect = stageImg.getBoundingClientRect();

    lightbox.classList.remove("is-open");

    applyMotion(currentRect, thumbRect, resetLightbox);
  };

  const resetLightbox = () => {
    isOpen = false;
    lightbox.classList.remove("is-open");
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    stageImg.classList.remove("is-animating");
    stageImg.style.transition = "none";
    stageImg.style.width = "";
    stageImg.style.height = "";
    stageImg.style.transform = "";
    stageImg.style.borderRadius = "";
    stageImg.style.opacity = "";
    stageImg.removeAttribute("src");
    captionEl.textContent = "";
    lastFocus?.focus?.();
  };

  const showRelative = async (delta) => {
    if (!galleryItems.length) return;
    const nextIndex = (currentIndex + delta + galleryItems.length) % galleryItems.length;
    const nextItem = galleryItems[nextIndex];
    const nextThumb = nextItem.querySelector("img");
    if (!nextItem || !nextThumb) return;

    currentIndex = nextIndex;
    stageImg.style.transition = reduceMotion ? "none" : `opacity 0.22s ease`;
    stageImg.style.opacity = "0";

    window.setTimeout(async () => {
      try {
        await loadStageImage(nextItem.dataset.zoomSrc);
      } catch {
        return;
      }

      stageImg.alt = nextThumb.getAttribute("alt") || "";
      updateCaption();
      stageImg.style.opacity = "1";
    }, reduceMotion ? 0 : 180);
  };

  closeButtons.forEach((btn) => btn.addEventListener("click", close));
  prevBtn?.addEventListener("click", () => showRelative(-1));
  nextBtn?.addEventListener("click", () => showRelative(1));

  document.addEventListener("keydown", (event) => {
    if (!isOpen) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") showRelative(-1);
    if (event.key === "ArrowRight") showRelative(1);
  });
})();
