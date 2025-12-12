import { useEffect, useRef } from 'react';

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animate idle blob wobble
    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height * 0.35;
      const baseRadius = Math.min(canvas.width, canvas.height) * 0.15;
      
      // Create wobbling blob
      ctx.beginPath();
      const points = 8;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const wobble1 = Math.sin(frame * 0.05 + i) * 5;
        const wobble2 = Math.cos(frame * 0.03 + i * 1.5) * 3;
        const radius = baseRadius + wobble1 + wobble2;
        
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      
      // Gradient fill
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);
      gradient.addColorStop(0, '#FF6B6B');
      gradient.addColorStop(0.7, '#FF8E8E');
      gradient.addColorStop(1, '#FF6B6B');
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Subtle glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(255, 107, 107, 0.5)';
      ctx.fill();
      ctx.shadowBlur = 0;
      
      frame++;
      requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const handleTap = () => {
    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    onStart();
  };

  return (
    <div className="screen start-screen">
      <canvas ref={canvasRef} className="background-canvas" />
      
      <div className="start-content">
        <button
          className="tap-button pulse"
          onClick={handleTap}
        >
          <div className="tap-icon">⚡</div>
        </button>
      </div>
    </div>
  );
}