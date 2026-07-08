(function () {
  const page = document.body.dataset.page || "home";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.getElementById("network-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const themes = {
    home: { seed: 1.1, nodes: 34, orbit: 0.52, accent: "#55b7ff" },
    about: { seed: 2.4, nodes: 46, orbit: 0.44, accent: "#55b7ff" },
    team: { seed: 3.7, nodes: 40, orbit: 0.58, accent: "#9b61ff" },
    partners: { seed: 5.2, nodes: 52, orbit: 0.5, accent: "#ff3f66" },
    join: { seed: 6.8, nodes: 32, orbit: 0.42, accent: "#55b7ff" },
    sponsors: { seed: 8.3, nodes: 44, orbit: 0.48, accent: "#9b61ff" },
    donate: { seed: 9.6, nodes: 58, orbit: 0.62, accent: "#55b7ff" }
  };
  const theme = themes[page] || themes.home;

  function pseudo(index) {
    return Math.sin((index + 1) * 127.1 + theme.seed * 311.7) * 43758.5453 % 1;
  }

  function positivePseudo(index) {
    return Math.abs(pseudo(index));
  }

  function scrollRatio(scroll) {
    return clamp(scroll / Math.max(document.documentElement.scrollHeight - height, 1), 0, 1);
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function gradient(x1, y1, x2, y2) {
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, "rgba(255, 63, 102, 0.72)");
    g.addColorStop(0.52, "rgba(155, 97, 255, 0.64)");
    g.addColorStop(1, "rgba(85, 183, 255, 0.72)");
    return g;
  }

  function drawGrid(scroll, ratio) {
    const spacing = page === "donate" ? 34 : 30;
    const offset = (scroll * 0.035) % spacing;
    const curve = Math.sin(ratio * Math.PI) * 13;
    ctx.fillStyle = "rgba(246, 247, 251, 0.2)";
    for (let x = -spacing; x < width + spacing; x += spacing) {
      for (let y = -spacing; y < height + spacing; y += spacing) {
        const bend = Math.sin((x + scroll * 0.35) * 0.006 + y * 0.002) * curve;
        const pulse = Math.sin((x + y + frame * 0.7) * 0.012) * 0.06;
        ctx.globalAlpha = 0.22 + pulse;
        ctx.beginPath();
        ctx.arc(x + offset, y + bend, 0.72, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawRings(scroll, ratio) {
    const cx = page === "join" ? pointer.x : page === "partners" ? width * 0.66 : width * 0.52;
    const cy = page === "join" ? pointer.y : page === "sponsors" ? height * 0.42 : height * 0.52;
    const base = Math.min(width, height) * theme.orbit;
    const count = page === "team" ? 8 : page === "home" ? 6 : 5;
    ctx.lineWidth = 1;
    for (let i = 0; i < count; i++) {
      const r = base * (0.42 + i * 0.13) + Math.sin(frame * 0.011 + i + ratio * 4) * 10;
      ctx.strokeStyle = i % 3 === 0 ? "rgba(85, 183, 255, 0.3)" : i % 3 === 1 ? "rgba(155, 97, 255, 0.25)" : "rgba(255, 63, 102, 0.24)";
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(frame * 0.0018 + i * 0.58 + scroll * 0.00013);
      ctx.scale(1, 0.26 + i * 0.055 + ratio * 0.14);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function pageTarget(ratio) {
    if (page === "join") return { x: pointer.x, y: pointer.y };
    if (page === "partners") return { x: width * (0.28 + ratio * 0.36), y: height * 0.48 };
    if (page === "sponsors") return { x: width * 0.5, y: height * (0.28 + ratio * 0.36) };
    if (page === "team") return { x: width * 0.5, y: height * 0.43 };
    return { x: width * 0.5, y: height * 0.5 };
  }

  function buildNodes(scroll, ratio) {
    const nodeCount = theme.nodes;
    const spread = page === "donate" ? clamp(0.14 + ratio * 1.4, 0.14, 1.18) : 1;
    const nodes = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const target = pageTarget(ratio);

    for (let i = 0; i < nodeCount; i++) {
      const angle = i * 2.399 + frame * 0.0011 + scroll * 0.00007;
      const radial = (Math.min(width, height) * (0.09 + positivePseudo(i) * 0.34) + i * 8) * spread;
      const baseX = centerX + Math.cos(angle + positivePseudo(i + 10) * 2) * radial * (1.1 + ratio * 0.25);
      const baseY = centerY + Math.sin(angle + positivePseudo(i + 21) * 2) * radial * (0.58 + positivePseudo(i + 30) * 0.42);
      const gridX = positivePseudo(i + 41) * width;
      const gridY = positivePseudo(i + 52) * height;
      const structure = page === "home" || page === "donate" ? 0.82 : 0.46 + Math.sin(ratio * Math.PI) * 0.22;
      const magnet = page === "about" || page === "partners" || page === "join" ? Math.sin(ratio * Math.PI) * 0.34 : 0.1;
      const x = (baseX * structure + gridX * (1 - structure)) * (1 - magnet) + target.x * magnet + Math.sin(frame * 0.018 + i) * 6;
      const y = (baseY * structure + gridY * (1 - structure)) * (1 - magnet) + target.y * magnet + Math.cos(frame * 0.014 + i) * 6;
      nodes.push({ x, y, pulse: positivePseudo(i + 70), color: i % 3 });
    }
    return nodes;
  }

  function drawNetwork(scroll, ratio) {
    const nodes = buildNodes(scroll, ratio);

    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const b = nodes[(i * (page === "partners" ? 7 : 5) + 3) % nodes.length];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < Math.max(width, height) * 0.58) {
        ctx.globalAlpha = page === "donate" ? 0.24 + ratio * 0.28 : 0.13 + Math.sin(ratio * Math.PI) * 0.18;
        ctx.strokeStyle = gradient(a.x, a.y, b.x, b.y);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        const cx = (a.x + b.x) / 2 + Math.sin(frame * 0.01 + i) * 18;
        const cy = (a.y + b.y) / 2 + Math.cos(frame * 0.01 + i) * 18;
        ctx.quadraticCurveTo(cx, cy, b.x, b.y);
        ctx.stroke();
      }
    }

    nodes.forEach((node, i) => {
      const pulse = 1 + Math.sin(frame * 0.028 + i + ratio * 6) * 0.42;
      ctx.globalAlpha = page === "donate" ? 0.62 : 0.43;
      ctx.fillStyle = node.color === 0 ? "#55b7ff" : node.color === 1 ? "#9b61ff" : "#ff3f66";
      ctx.beginPath();
      ctx.arc(node.x, node.y, (1.4 + node.pulse * 1.8) * pulse, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawPageMotif(scroll, ratio) {
    const target = pageTarget(ratio);
    ctx.save();
    ctx.lineWidth = 1;

    if (page === "about") {
      for (let i = 0; i < 6; i++) {
        const x = width * (0.12 + i * 0.15);
        ctx.globalAlpha = 0.1 + ratio * 0.18;
        ctx.strokeStyle = gradient(x, 0, target.x, target.y);
        ctx.beginPath();
        ctx.moveTo(x, height * (0.08 + positivePseudo(i) * 0.2));
        ctx.bezierCurveTo(x + 90, height * 0.35, target.x - 120, target.y - 80, target.x, target.y);
        ctx.stroke();
      }
    }

    if (page === "team") {
      for (let i = 0; i < 4; i++) {
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = i % 2 ? "rgba(255,63,102,0.32)" : "rgba(85,183,255,0.34)";
        ctx.save();
        ctx.translate(width * 0.5, height * 0.5);
        ctx.rotate(frame * 0.002 + i * Math.PI / 4 + ratio * 1.5);
        ctx.scale(1, 0.2 + i * 0.08);
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(width, height) * (0.34 + i * 0.13), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    if (page === "partners") {
      for (let i = 0; i < 14; i++) {
        const y = height * (0.12 + i * 0.06);
        ctx.globalAlpha = 0.12 + ratio * 0.16;
        ctx.strokeStyle = gradient(0, y, width, y);
        ctx.beginPath();
        ctx.moveTo(width * (0.04 + positivePseudo(i) * 0.2), y);
        ctx.lineTo(target.x + Math.sin(i + ratio * 4) * 120, target.y + Math.cos(i) * 180);
        ctx.stroke();
      }
    }

    if (page === "sponsors") {
      for (let i = 0; i < 3; i++) {
        const y = height * (0.22 + i * 0.24) + Math.sin(frame * 0.008 + i) * 10;
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = i === 0 ? "rgba(85,183,255,0.36)" : i === 1 ? "rgba(155,97,255,0.33)" : "rgba(255,63,102,0.33)";
        ctx.beginPath();
        ctx.moveTo(width * 0.06, y);
        ctx.bezierCurveTo(width * 0.32, y - 110, width * 0.68, y + 110, width * 0.94, y);
        ctx.stroke();
      }
    }

    if (page === "join") {
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 / 5) * i + ratio * 1.2;
        const x = width * 0.5 + Math.cos(a) * Math.min(width, height) * 0.36;
        const y = height * 0.52 + Math.sin(a) * Math.min(width, height) * 0.28;
        ctx.globalAlpha = 0.26;
        ctx.strokeStyle = gradient(pointer.x, pointer.y, x, y);
        ctx.beginPath();
        ctx.moveTo(pointer.x, pointer.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }

    if (page === "donate") {
      const rings = 5;
      for (let i = 0; i < rings; i++) {
        ctx.globalAlpha = 0.22 - i * 0.025;
        ctx.strokeStyle = i % 2 ? "rgba(255,63,102,0.34)" : "rgba(85,183,255,0.36)";
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, Math.min(width, height) * (0.08 + ratio * 0.72 + i * 0.09), 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function renderCanvas() {
    if (!ctx || !canvas) return;
    frame += reduceMotion ? 0 : 1;
    const scroll = window.scrollY || 0;
    const ratio = scrollRatio(scroll);
    ctx.clearRect(0, 0, width, height);
    drawGrid(scroll, ratio);
    drawPageMotif(scroll, ratio);
    drawRings(scroll, ratio);
    drawNetwork(scroll, ratio);
    if (!reduceMotion) requestAnimationFrame(renderCanvas);
  }

  function updateScenes() {
    document.querySelectorAll(".scroll-scene").forEach((scene) => {
      const rect = scene.getBoundingClientRect();
      const range = Math.max(rect.height - window.innerHeight, rect.height * 0.58, 1);
      const progress = clamp(-rect.top / range, 0, 1);
      scene.style.setProperty("--progress", progress.toFixed(4));
    });
  }

  function setActiveNav() {
    const path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".primary-nav a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function initTransitions() {
    const overlay = document.querySelector(".page-transition");
    if (sessionStorage.getItem("vocalis-transition") === "1") {
      sessionStorage.removeItem("vocalis-transition");
      document.body.classList.add("is-page-arriving");
      overlay?.classList.add("is-arriving");
      window.setTimeout(() => {
        document.body.classList.remove("is-page-arriving");
        overlay?.classList.remove("is-arriving");
      }, reduceMotion ? 0 : 980);
    }

    document.querySelectorAll("a[data-transition]").forEach((link) => {
      link.addEventListener("click", (event) => {
        const url = new URL(link.href, window.location.href);
        if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
        event.preventDefault();
        sessionStorage.setItem("vocalis-transition", "1");
        document.body.classList.add("is-page-exiting");
        overlay?.classList.add("is-active");
        window.setTimeout(() => {
          window.location.href = url.href;
        }, reduceMotion ? 0 : 980);
      });
    });
  }

  function initPathways() {
    const field = document.querySelector("[data-pathway-field]");
    if (!field) return;

    const svg = field.querySelector(".pathway-lines");
    const nodes = Array.from(field.querySelectorAll(".pathway-node"));
    const select = document.querySelector("[data-pathway-select]");
    const openButton = document.querySelector("[data-application-open]");
    const dialog = document.querySelector("[data-application-dialog]");
    const form = document.querySelector("[data-application-form]");
    const closeButton = document.querySelector("[data-dialog-close]");
    let selected = nodes[0];

    function ensureGradient() {
      svg.innerHTML = '<defs><linearGradient id="pathwayGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#ff3f66"/><stop offset="52%" stop-color="#9b61ff"/><stop offset="100%" stop-color="#55b7ff"/></linearGradient></defs>';
    }

    function positionFor(node) {
      const fieldRect = field.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      return {
        x: nodeRect.left - fieldRect.left + nodeRect.width * 0.05,
        y: nodeRect.top - fieldRect.top + 18
      };
    }

    function drawLines(x, y) {
      ensureGradient();
      const distances = nodes
        .map((node) => ({ node, point: positionFor(node) }))
        .map((item) => ({ ...item, distance: Math.hypot(item.point.x - x, item.point.y - y) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);
      distances.forEach(({ point }) => {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x);
        line.setAttribute("y1", y);
        line.setAttribute("x2", point.x);
        line.setAttribute("y2", point.y);
        svg.appendChild(line);
      });
    }

    field.addEventListener("pointermove", (event) => {
      const rect = field.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      field.style.setProperty("--cursor-x", `${x}px`);
      field.style.setProperty("--cursor-y", `${y}px`);
      drawLines(x, y);
    });

    field.addEventListener("pointerleave", () => {
      ensureGradient();
    });

    nodes.forEach((node) => {
      node.addEventListener("click", () => {
        selected = node;
        nodes.forEach((item) => item.classList.toggle("is-selected", item === node));
        field.classList.add("has-selection");
        if (select) select.value = node.dataset.pathway || "";
        openButton?.focus({ preventScroll: true });
      });
    });

    openButton?.addEventListener("click", () => {
      if (select && selected) select.value = selected.dataset.pathway || select.value;
      if (dialog?.showModal) dialog.showModal();
      else dialog?.setAttribute("open", "");
    });

    closeButton?.addEventListener("click", () => {
      if (dialog?.close) dialog.close();
      else dialog?.removeAttribute("open");
    });

    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const subject = encodeURIComponent("Vocalis application: " + (data.get("pathway") || "General"));
      const body = encodeURIComponent(
        "Name: " + (data.get("name") || "") +
        "\nEmail: " + (data.get("email") || "") +
        "\nPathway: " + (data.get("pathway") || "") +
        "\n\nWhy I am interested:\n" + (data.get("message") || "")
      );
      window.location.href = `mailto:JINGYINGXUU@GMAIL.COM?subject=${subject}&body=${body}`;
      dialog?.close();
    });

    ensureGradient();
  }

  function initDonation() {
    const form = document.querySelector("[data-donation-form]");
    if (!form) return;

    let frequency = "One time";
    let amount = "100";

    form.querySelectorAll("[data-frequency]").forEach((button) => {
      button.addEventListener("click", () => {
        frequency = button.dataset.frequency || frequency;
        form.querySelectorAll("[data-frequency]").forEach((item) => item.classList.toggle("is-active", item === button));
      });
    });

    form.querySelectorAll("[data-amount]").forEach((button) => {
      button.addEventListener("click", () => {
        amount = button.dataset.amount || amount;
        form.querySelector("[data-custom-amount]").value = "";
        form.querySelectorAll("[data-amount]").forEach((item) => item.classList.toggle("is-active", item === button));
      });
    });

    form.querySelector("[data-custom-amount]")?.addEventListener("input", (event) => {
      amount = event.currentTarget.value || amount;
      form.querySelectorAll("[data-amount]").forEach((item) => item.classList.remove("is-active"));
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const custom = form.querySelector("[data-custom-amount]")?.value;
      const chosenAmount = custom || amount;
      const subject = encodeURIComponent("Vocalis donation inquiry");
      const body = encodeURIComponent(`I would like to support Vocalis.\n\nFrequency: ${frequency}\nAmount: $${chosenAmount}\n\nPlease send current donation, payment, and legal status details.`);
      window.location.href = `mailto:JINGYINGXUU@GMAIL.COM?subject=${subject}&body=${body}`;
    });
  }

  window.addEventListener("resize", () => {
    resizeCanvas();
    updateScenes();
  });
  window.addEventListener("scroll", updateScenes, { passive: true });
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }, { passive: true });

  resizeCanvas();
  updateScenes();
  setActiveNav();
  initTransitions();
  initPathways();
  initDonation();
  renderCanvas();
})();
