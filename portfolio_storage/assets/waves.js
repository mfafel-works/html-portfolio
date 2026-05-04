/**
 * Wave Animation - Sinusoidal Wave Generation
 */

(function () {
  "use strict";

  function generateWavePath(amplitude, frequency, phase) {
    var points = [];
    var resolution = 144;
    
    for (var i = 0; i <= resolution; i++) {
      var x = (i / resolution) * 1440;
      var base = 60;
      var normalizedX = (x / 1440) * frequency * Math.PI * 2;
      var y = base - amplitude * Math.sin(normalizedX + phase);
      y = Math.max(20, Math.min(100, y));
      points.push({ x: x, y: y });
    }
    
    return buildSplinePath(points);
  }

  function buildSplinePath(points) {
    if (!points || points.length < 2) return "";
    var path = "M" + points[0].x + "," + points[0].y;
    
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[Math.max(0, i - 1)];
      var p1 = points[i];
      var p2 = points[i + 1];
      var p3 = points[Math.min(points.length - 1, i + 2)];
      
      var cp1x = p1.x + (p2.x - p0.x) / 6;
      var cp1y = p1.y + (p2.y - p0.y) / 6;
      var cp2x = p2.x - (p3.x - p1.x) / 6;
      var cp2y = p2.y - (p3.y - p1.y) / 6;
      
      path += "C" + cp1x + "," + cp1y + "," + cp2x + "," + cp2y + "," + p2.x + "," + p2.y;
    }
    
    path += "L1440,120L0,120Z";
    return path;
  }

  var waveFrames = [
    { amplitude: 25, frequency: 1.5, phase: 0 },
    { amplitude: 35, frequency: 1.5, phase: Math.PI / 3 },
    { amplitude: 25, frequency: 1.5, phase: (2 * Math.PI) / 3 },
    { amplitude: 30, frequency: 1.5, phase: Math.PI },
    { amplitude: 28, frequency: 1.5, phase: (4 * Math.PI) / 3 }
  ].map(function (config) {
    return generateWavePath(config.amplitude, config.frequency, config.phase);
  });

  // Different colors for each frame: moss green, rust, dusty sky, antique gold (frame 0 is skipped for original - Irish autumn forest vibes)
  var waveColors = ["#3D5A3D", "#3D5A3D", "#A85A32", "#6A8A9A", "#d0aa6c"];
  var gradientColors = ["#3D5A3D", "#3D5A3D", "#A85A32", "#6A8A9A", "#b8945a"];

  var animatedWaves = new WeakSet();

  function createWaveSVG(pathData, isGradient, waveType, colorIndex) {
    var color = waveColors[colorIndex] || waveColors[0];
    var gradColor = gradientColors[colorIndex] || gradientColors[0];
    var svgContent;
    
    if (waveType === "wave-last") {
      var lastColor = waveColors[colorIndex] || waveColors[0];
      svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120"><path fill="' + lastColor + '" d="' + pathData + '"/></svg>';
    } else if (waveType === "wave-last-two") {
      var lastColor = waveColors[colorIndex] || waveColors[0];
      svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120"><path fill="' + lastColor + '" d="' + pathData + '"/></svg>';
    } else {
      svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120"><path fill="' + color + '" d="' + pathData + '"/></svg>';
    }
    
    return "data:image/svg+xml," + encodeURIComponent(svgContent);
  }

  function createWaveOverlays(wave) {
    var isLast = wave.classList.contains("wave-last") || wave.classList.contains("wave-last-two");
    var isDown = wave.classList.contains("wave-down") || wave.classList.contains("wave-down-two") || wave.classList.contains("wave-last-two");
    var waveType = isLast ? (wave.classList.contains("wave-last-two") ? "wave-last-two" : "wave-last") : "wave-up";

    // Create inside wave element, use ::after pseudoelement style positioning
    var overlayContainer = document.createElement("div");
    overlayContainer.className = "wave-anim";
    // Same positioning as wave's ::before
    overlayContainer.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:-1;";

    waveFrames.forEach(function (pathData, index) {
      var svgContainer = document.createElement("div");
      svgContainer.className = "wave-frame";
      // Match wave ::before positioning exactly
      svgContainer.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background-size:cover;background-repeat:no-repeat;opacity:0;transition:opacity 1.2s ease-in-out;";

      var svgBg = createWaveSVG(pathData, isLast, waveType, index);
      svgContainer.style.backgroundImage = 'url("' + svgBg + '")';
      
      if (isDown) {
        svgContainer.style.transform = "rotate(180deg)";
        svgContainer.style.transformOrigin = "center";
      }
      
      overlayContainer.appendChild(svgContainer);
    });

    // Insert as first child (behind the wave content)
    wave.insertBefore(overlayContainer, wave.firstChild);
    
    return overlayContainer;
  }

  function animateWave(wave) {
    if (animatedWaves.has(wave)) return;
    animatedWaves.add(wave);

    var overlays = createWaveOverlays(wave);
    var frames = overlays.querySelectorAll(".wave-frame");
    
    if (!frames || frames.length === 0) return;

    var originalDuration = 1500;
    var frameDuration = 5000;
    
    function animateLoop() {
      // Reset all frames to hidden first
      frames.forEach(function (f) {
        f.style.opacity = "0";
      });
      
      // Keep original wave visible (CSS background shows through)
      wave.style.opacity = "1";
      
      // Show animated frames 1 and 2 only (skip frame 0 to let original show)
      frames.forEach(function (f, index) {
        if (index === 0) return;  // Skip frame 0 - let original show
        setTimeout(function () {
          f.style.opacity = "1";
        }, originalDuration + (index - 1) * frameDuration);
      });
    }
    
    animateLoop();
    
    function repeatAnimation() {
      animateLoop();
      setTimeout(repeatAnimation, originalDuration + frameDuration * (waveFrames.length - 1));
    }
    
    setTimeout(repeatAnimation, originalDuration + frameDuration * (waveFrames.length - 1));
  }

  function init() {
    var waveSelectors = [".wave-up", ".wave-down", ".wave-up-two", ".wave-down-two", ".wave-last", ".wave-last-two"];
    var allWaves = [];

    waveSelectors.forEach(function (selector) {
      var elements = document.querySelectorAll(selector);
      if (elements) {
        allWaves = allWaves.concat(Array.prototype.slice.call(elements));
      }
    });

    if (!allWaves || allWaves.length === 0) {
      console.log("No wave elements found");
      return;
    }

    console.log("Found waves:", allWaves.length);

    // Animate all waves immediately (not on scroll)
    allWaves.forEach(function (wave) {
      animateWave(wave);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();