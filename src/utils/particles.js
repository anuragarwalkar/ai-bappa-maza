/**
 * Creates initial glowing spiritual spark particles
 * @param {number} width 
 * @param {number} height 
 * @returns {Array<object>}
 */
export function createSparkParticles(width, height) {
  const particles = [];
  const particleCount = Math.floor(width / 30);
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.5 + 0.8,
      speedY: -(Math.random() * 0.5 + 0.2),
      speedX: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.6 + 0.2,
      hue: Math.random() > 0.4 ? 45 : 25 // Gold and saffron
    });
  }
  return particles;
}

/**
 * Generates an array of flower petal objects for shower effect
 * @param {number} width 
 * @param {number} count 
 * @returns {Array<object>}
 */
export function createFlowerPetals(width, count = 35) {
  const petals = [];
  for (let i = 0; i < count; i++) {
    petals.push({
      x: Math.random() * width,
      y: -20 - Math.random() * 120,
      size: Math.random() * 12 + 9,
      speedY: Math.random() * 2.2 + 1.2,
      speedX: (Math.random() - 0.5) * 1.5,
      angle: Math.random() * Math.PI * 2,
      spinSpeed: (Math.random() - 0.5) * 0.05,
      type: Math.random() > 0.45 ? 'marigold' : 'hibiscus',
      alpha: 0.95
    });
  }
  return petals;
}

/**
 * Draws and updates spark particles and flower petals on the canvas context
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} width 
 * @param {number} height 
 * @param {Array<object>} particles 
 * @param {Array<object>} flowerPetals 
 */
export function renderParticlesFrame(ctx, width, height, particles, flowerPetals) {
  ctx.clearRect(0, 0, width, height);

  // 1. Draw glowing spiritual spark particles
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${p.alpha})`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, 0.8)`;
    ctx.fill();

    p.y += p.speedY;
    p.x += p.speedX;

    if (p.y < -10) {
      p.y = height + 10;
      p.x = Math.random() * width;
    }
  });

  // 2. Draw falling flower petals (फुलांचा वर्षाव)
  for (let i = flowerPetals.length - 1; i >= 0; i--) {
    const petal = flowerPetals[i];
    ctx.save();
    ctx.translate(petal.x, petal.y);
    ctx.rotate(petal.angle);
    ctx.globalAlpha = petal.alpha;

    ctx.beginPath();
    ctx.ellipse(0, 0, petal.size * 0.5, petal.size, 0, 0, Math.PI * 2);

    if (petal.type === 'marigold') {
      // Vibrant saffron & gold marigold petal
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, petal.size);
      grad.addColorStop(0, '#FFE066');
      grad.addColorStop(0.6, '#FF9900');
      grad.addColorStop(1, '#D84315');
      ctx.fillStyle = grad;
    } else {
      // Deep crimson & ruby hibiscus petal
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, petal.size);
      grad.addColorStop(0, '#FF4D6D');
      grad.addColorStop(0.7, '#C9184A');
      grad.addColorStop(1, '#590D22');
      ctx.fillStyle = grad;
    }

    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(255, 153, 0, 0.5)';
    ctx.fill();
    ctx.restore();

    petal.y += petal.speedY;
    petal.x += Math.sin(petal.y * 0.02) * 1.2;
    petal.angle += petal.spinSpeed;

    if (petal.y > height + 30) {
      flowerPetals.splice(i, 1);
    }
  }
}
