import { useEffect, useRef } from 'react';

interface BoomScreenProps {
  weight: number;
  onRestart: () => void;
  onBackToStart: () => void;
  onShare: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

export function BoomScreen({ weight, onRestart, onBackToStart, onShare }: BoomScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles
    const particles: Particle[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const particleCount = 40;
    
    const colors = ['#FF6B6B', '#FF8E8E', '#4ECDC4', '#D64545'];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 5 + Math.random() * 10;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 5 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1
      });
    }

    // Haptic feedback on boom
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    let frame = 0;
    const animate = () => {
      ctx.fillStyle = 'rgba(26, 26, 29, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // gravity
        p.alpha -= 0.01;
        
        if (p.alpha > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });
      
      frame++;
      if (frame < 200) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, []);

  const handleRestart = () => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    onRestart();
  };

  const handleShare = () => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    onShare();
  };

  const displayWeight = weight >= 1000 
    ? `${(weight / 1000).toFixed(1)} kg` 
    : `${weight} g`;

  return (
    <div className="screen boom-screen">
      <canvas ref={canvasRef} className="particles-canvas" />
      
      <div className="boom-content scale-in">
        <h1 className="boom-title">
          💥 BOOM!
        </h1>
        
        <p className="boom-message">
          You made a {displayWeight} blob!
        </p>
        
        <div className="boom-actions">
          <button className="tg-button primary" onClick={handleRestart}>
            TRY BIGGER
          </button>
          <button className="tg-button secondary" onClick={handleShare}>
            SHARE
          </button>
        </div>
      </div>
    </div>
  );
}