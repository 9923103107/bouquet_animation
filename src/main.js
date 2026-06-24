import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Configuration Constants
const TOTAL_FRAMES = 300;
const FRAME_DIRECTORY = '/frames';
const FRAME_PREFIX = 'ezgif-frame-';
const FRAME_EXTENSION = '.jpg';

// State Variables
const preloadedImages = [];
let loadedCount = 0;
let canvas, ctx;
let currentFrameIndex = 0;
let isPageLoaded = false;

// ==========================================================================
// 1. IMAGE PRELOADER ENGINE
// ==========================================================================
function preloadImages() {
  const progressFill = document.getElementById('preloader-progress-fill');
  const percentageText = document.getElementById('preloader-percentage');
  const statusText = document.querySelector('.preloader-status');

  return new Promise((resolve) => {
    // Generate paths and load images
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const paddedNum = String(i).padStart(3, '0');
      const imgPath = `${FRAME_DIRECTORY}/${FRAME_PREFIX}${paddedNum}${FRAME_EXTENSION}`;
      
      const img = new Image();
      img.src = imgPath;
      
      img.onload = () => {
        handleImageLoad(resolve, progressFill, percentageText, statusText);
      };
      
      img.onerror = () => {
        console.warn(`Failed to load frame: ${imgPath}. Using fallback.`);
        handleImageLoad(resolve, progressFill, percentageText, statusText);
      };

      preloadedImages.push(img);
    }
  });
}

function handleImageLoad(resolve, progressFill, percentageText, statusText) {
  loadedCount++;
  const percentage = Math.round((loadedCount / TOTAL_FRAMES) * 100);
  
  // Update Loader UI
  progressFill.style.width = `${percentage}%`;
  percentageText.textContent = `${percentage}%`;

  if (percentage < 30) {
    statusText.textContent = 'Gathering botanical data...';
  } else if (percentage < 60) {
    statusText.textContent = 'Preloading high-fidelity frames...';
  } else if (percentage < 90) {
    statusText.textContent = 'Calibrating canvas rendering engine...';
  } else {
    statusText.textContent = 'Unfolding experiences...';
  }

  // All images loaded
  if (loadedCount === TOTAL_FRAMES) {
    setTimeout(() => {
      hidePreloader();
      resolve();
    }, 600);
  }
}

function hidePreloader() {
  const preloader = document.getElementById('preloader');
  preloader.style.opacity = '0';
  preloader.style.visibility = 'hidden';
  isPageLoaded = true;
}

// ==========================================================================
// 2. CANVAS DRAWING ENGINE (COVER-STYLE DYNAMIC SCALING)
// ==========================================================================
function initCanvas() {
  canvas = document.getElementById('bloom-canvas');
  ctx = canvas.getContext('2d');
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  if (!canvas) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;

  // Scale canvas buffer for high-DPI (Retina) displays
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  
  // Scale back CSS dimensions to fill screen
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  ctx.scale(dpr, dpr);

  // Redraw current frame after resize
  drawFrame(currentFrameIndex);
}

function drawFrame(index) {
  if (preloadedImages.length === 0) return;
  
  const img = preloadedImages[index];
  if (!img || !img.complete) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Image aspect ratio crop calculation (Cover aspect ratio style)
  const imgWidth = img.naturalWidth || img.width || 1920;
  const imgHeight = img.naturalHeight || img.height || 1080;
  const imgRatio = imgWidth / imgHeight;
  const canvasRatio = width / height;

  let drawWidth, drawHeight, drawX, drawY;

  if (canvasRatio > imgRatio) {
    // Canvas is wider than image (crop top/bottom)
    drawWidth = width;
    drawHeight = width / imgRatio;
    drawX = 0;
    drawY = (height - drawHeight) / 2;
  } else {
    // Canvas is taller than image (crop sides)
    drawWidth = height * imgRatio;
    drawHeight = height;
    drawX = (width - drawWidth) / 2;
    drawY = 0;
  }

  // Clear previous frame
  ctx.clearRect(0, 0, width, height);
  
  // Draw scaled centered image
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

// ==========================================================================
// 3. LENIS SMOOTH SCROLL & GSAP TICKER INTEGRATION
// ==========================================================================
function initScroll() {
  // Initialize Lenis Smooth Scroll
  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-like custom ease
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.1,
    touchMultiplier: 1.6,
  });

  // Sync ScrollTrigger with Lenis scroll events
  lenis.on('scroll', () => {
    ScrollTrigger.update();
  });

  // Integrate Lenis frame ticks into GSAP Ticker
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  
  // Disable lag smoothing in GSAP to keep it locked to scroll physics
  gsap.ticker.lagSmoothing(0);

  // Bind Flower blooming frame sequence to Scroll Position
  const bloomSequence = { frame: 0 };
  
  gsap.to(bloomSequence, {
    frame: TOTAL_FRAMES - 1,
    ease: 'none',
    scrollTrigger: {
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8, // Subtle scrub delay creates massive fluid inertia
      onUpdate: () => {
        const index = Math.floor(bloomSequence.frame);
        if (index !== currentFrameIndex) {
          currentFrameIndex = index;
          drawFrame(currentFrameIndex);
        }
      }
    }
  });
}

// ==========================================================================
// 4. INITIALIZATION ON LOAD
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
  // 1. Setup Canvas sizing and contexts
  initCanvas();

  // 2. Load all 300 botanical images
  preloadImages().then(() => {
    // 3. Initiate Smooth Scrolling with Lenis and GSAP
    initScroll();
  });
});
