// Audio-reactive particles
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
const playButton = document.getElementById('playButton');
const bgMusic = document.getElementById('bgMusic');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Particles array
let particles = [];
const particleCount = 150;

// Audio context setup
let audioContext, analyser, dataArray, bufferLength;

// Initialize particles
function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speedX: Math.random() * 2 - 1,
            speedY: Math.random() * 2 - 1,
            color: `rgba(150, 150, 150, ${Math.random() * 0.5 + 0.1})`
        });
    }
}

// Handle audio playback
playButton.addEventListener('click', () => {
    if (bgMusic.paused) {
        bgMusic.play();
        playButton.textContent = '❚❚ PAUSE';
        setupAudioContext();
    } else {
        bgMusic.pause();
        playButton.textContent = '▶ PLAY MUSIC';
    }
});

// Audio analysis setup
function setupAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(bgMusic);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
}

// Animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get audio data if playing
    if (!bgMusic.paused && analyser) {
        analyser.getByteFrequencyData(dataArray);
        const bass = dataArray[0] / 255;
        
        // Adjust particle speed based on bass
        particles.forEach(p => {
            p.x += p.speedX * (1 + bass * 2);
            p.y += p.speedY * (1 + bass * 2);
            
            // Reset particles that go off-screen
            if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
                p.x = Math.random() * canvas.width;
                p.y = Math.random() * canvas.height;
            }
        });
    } else {
        // Default movement
        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            
            // Reset particles that go off-screen
            if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
                p.x = Math.random() * canvas.width;
                p.y = Math.random() * canvas.height;
            }
        });
    }

    // Draw particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });

    requestAnimationFrame(animate);
}

// Resize handler
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Start everything
initParticles();
animate();