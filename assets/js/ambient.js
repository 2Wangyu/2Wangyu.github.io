export function mountAmbient(canvas) {
  const context = canvas.getContext("2d");
  if (!context) return () => {};

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: 0.64, y: 0.38, active: false };
  const particles = [];
  let width = 0;
  let height = 0;
  let frame = 0;
  let raf = 0;

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth;
    height = innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    particles.length = 0;
    const count = reduced ? 18 : Math.min(84, Math.floor((width * height) / 14500));
    for (let index = 0; index < count; index += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.4 + 0.35,
        speed: Math.random() * 0.22 + 0.06,
        drift: Math.random() * Math.PI * 2,
      });
    }
  }

  function movePointer(event) {
    pointer.x = event.clientX / width;
    pointer.y = event.clientY / height;
    pointer.active = true;
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    const sourceX = width * pointer.x;
    const sourceY = height * pointer.y;
    const radius = Math.max(width, height) * 0.68;
    const hue = 180 + Math.sin(frame / 110) * 22;
    const gradient = context.createRadialGradient(sourceX, sourceY, 0, sourceX, sourceY, radius);
    gradient.addColorStop(0, `hsla(${hue}, 88%, 62%, .19)`);
    gradient.addColorStop(0.36, "hsla(222, 82%, 57%, .08)");
    gradient.addColorStop(0.72, "hsla(266, 68%, 54%, .04)");
    gradient.addColorStop(1, "transparent");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    for (const particle of particles) {
      const distance = Math.hypot(particle.x - sourceX, particle.y - sourceY);
      const proximity = Math.max(0, 1 - distance / 320);
      particle.y -= particle.speed * (1 + proximity * 1.8);
      particle.x += Math.sin(frame / 75 + particle.drift) * 0.08;
      if (particle.y < -8) {
        particle.y = height + 8;
        particle.x = Math.random() * width;
      }
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size + proximity, 0, Math.PI * 2);
      context.fillStyle = `rgba(200, 255, 244, ${0.18 + proximity * 0.5})`;
      context.fill();
    }

    context.strokeStyle = "rgba(139, 245, 208, .07)";
    context.lineWidth = 1;
    context.beginPath();
    context.arc(sourceX, sourceY, 62 + Math.sin(frame / 26) * 8, 0, Math.PI * 2);
    context.stroke();

    frame += 1;
    if (!reduced) raf = requestAnimationFrame(draw);
  }

  addEventListener("resize", resize);
  addEventListener("pointermove", movePointer, { passive: true });
  resize();
  draw();

  return () => {
    cancelAnimationFrame(raf);
    removeEventListener("resize", resize);
    removeEventListener("pointermove", movePointer);
  };
}
