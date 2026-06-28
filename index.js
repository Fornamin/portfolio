document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Initialize Lenis Smooth Scroll (All Pages) ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true
    });

    // --- 2. Smooth Scroll on Hash Link Click ---
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const hash = link.getAttribute('href');
            const target = document.querySelector(hash);
            if (target) {
                lenis.scrollTo(target);
                // Dynamically update URL hash without scrolling jump
                history.pushState(null, null, hash);
            }
        });
    });

    // --- 3. Dynamic Active Nav Highlighting on Scroll (Intersection Observer) ---
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px', // triggers when section is in active viewing area
        threshold: 0
    };

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href === `#${id}`) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach(section => observer.observe(section));

    // --- 4. Expandable Project Detail Rows (works.html / combined projects) ---
    const projectRows = document.querySelectorAll('.project-row');
    if (projectRows.length > 0) {
        projectRows.forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('a') || e.target.closest('button')) {
                    return;
                }

                const isActive = row.classList.contains('active');

                projectRows.forEach(otherRow => {
                    otherRow.classList.remove('active');
                });

                if (!isActive) {
                    row.classList.add('active');
                }
            });
        });
    }

    // Global mouse coordinates
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // --- 5. Radial Interactive Grid Background Canvas ---
    let gridLineColor = 'rgba(255, 255, 255, 0.25)';
    const updateGridColor = () => {
        gridLineColor = getComputedStyle(document.body).getPropertyValue('--canvas-line-color').trim() || 'rgba(255, 255, 255, 0.25)';
    };

    const canvas = document.getElementById('radial-grid-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        
        const spacing = 50; // Spacing between dashes
        const dashLength = 10; // Length of each dash
        let points = [];

        // Initialize grid points coordinates for spring warp physics
        const initPoints = () => {
            points = [];
            const cols = Math.ceil(width / spacing) + 1;
            const rows = Math.ceil(height / spacing) + 1;
            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    const ox = c * spacing;
                    const oy = r * spacing;
                    points.push({
                        x: ox,
                        y: oy,
                        ox: ox,
                        oy: oy,
                        vx: 0,
                        vy: 0
                    });
                }
            }
        };

        const resizeCanvas = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.scale(dpr, dpr);
            initPoints();
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Render Canvas Grid
        const drawGrid = () => {
            ctx.clearRect(0, 0, width, height);
            
            ctx.strokeStyle = gridLineColor;
            ctx.lineWidth = 1;
            
            const maxDist = 180; // Distance of mouse influence

            points.forEach(p => {
                const dx = mouseX - p.x;
                const dy = mouseY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                let targetX = p.ox;
                let targetY = p.oy;
                
                if (dist < maxDist && dist > 0) {
                    const force = (maxDist - dist) / maxDist;
                    targetX = p.ox - (dx / dist) * force * 24;
                    targetY = p.oy - (dy / dist) * force * 24;
                }
                
                const spring = 0.08;
                const friction = 0.82;
                
                const ax = (targetX - p.x) * spring;
                const ay = (targetY - p.y) * spring;
                
                p.vx = (p.vx + ax) * friction;
                p.vy = (p.vy + ay) * friction;
                
                p.x += p.vx;
                p.y += p.vy;
                
                const angle = Math.atan2(mouseY - p.y, mouseX - p.x);
                const currentDashLength = dashLength + (dist < maxDist ? (1 - dist / maxDist) * 6 : 0);
                
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(angle);
                
                ctx.beginPath();
                ctx.moveTo(-currentDashLength / 2, 0);
                ctx.lineTo(currentDashLength / 2, 0);
                ctx.stroke();
                
                ctx.restore();
            });
        };

        // Render Loop for index.html (syncs scroll and canvas draws)
        function animateCanvasOnly(time) {
            lenis.raf(time);
            drawGrid();
            requestAnimationFrame(animateCanvasOnly);
        }
        requestAnimationFrame(animateCanvasOnly);
    } else {
        // Standard Scroll Loop for other pages
        function animateScrollOnly(time) {
            lenis.raf(time);
            requestAnimationFrame(animateScrollOnly);
        }
        requestAnimationFrame(animateScrollOnly);
    }

    // --- 6. Global Dark/Light Theme Switcher ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Sync theme setting
    const applyTheme = (theme) => {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        } else {
            document.body.classList.remove('light-mode');
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
        // Recalculate and cache line color style
        updateGridColor();
    };

    // Load initial preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const isCurrentLight = document.body.classList.contains('light-mode');
        const nextTheme = isCurrentLight ? 'dark' : 'light';
        applyTheme(nextTheme);
        localStorage.setItem('theme', nextTheme);
    });

    // Check for initial hash scroll request on load
    if (window.location.hash) {
        setTimeout(() => {
            const target = document.querySelector(window.location.hash);
            if (target) {
                lenis.scrollTo(target);
            }
        }, 100);
    }
});
