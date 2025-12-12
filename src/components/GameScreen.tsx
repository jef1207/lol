import { useEffect, useRef, useState } from 'react';

interface GameScreenProps {
  onBoom: (weight: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

interface Blob {
  x: number;
  y: number;
  radius: number;
  velocityY: number;
  mass: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  id: number;
}

export function GameScreen({ onBoom, isMuted, onToggleMute }: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [weight, setWeight] = useState(50);
  const [tapCount, setTapCount] = useState(0);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const blobRef = useRef<Blob>({
    x: 0,
    y: 0,
    radius: 30,
    velocityY: 0,
    mass: 50,
  });
  const animationFrameRef = useRef<number>();
  const rippleIdRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Reset blob position
      blobRef.current.x = canvas.width / 2;
      blobRef.current.y = canvas.height - 150;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const gravity = 0.3;
    const damping = 0.7;
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.4;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const blob = blobRef.current;
      
      // Physics
      blob.velocityY += gravity;
      blob.y += blob.velocityY;
      
      // Ground collision
      const ground = canvas.height - blob.radius - 20;
      if (blob.y > ground) {
        blob.y = ground;
        blob.velocityY *= -damping;
      }
      
      // Update and draw ripples
      ripplesRef.current = ripplesRef.current
        .map(r => ({
          ...r,
          radius: r.radius + 4,
          alpha: r.alpha - 0.02
        }))
        .filter(r => r.alpha > 0);
      
      ripplesRef.current.forEach(ripple => {
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(78, 237, 196, ${ripple.alpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      });
      
      // Draw blob with squish effect
      const squishFactor = Math.abs(blob.velocityY) / 20;
      const radiusX = blob.radius * (1 - squishFactor * 0.1);
      const radiusY = blob.radius * (1 + squishFactor * 0.1);
      
      ctx.save();
      ctx.translate(blob.x, blob.y);
      ctx.beginPath();
      ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
      
      // Gradient
      const gradient = ctx.createRadialGradient(0, -blob.radius * 0.3, 0, 0, 0, blob.radius);
      gradient.addColorStop(0, '#FF8E8E');
      gradient.addColorStop(0.7, '#FF6B6B');
      gradient.addColorStop(1, '#D64545');
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Glow
      ctx.shadowBlur = 30;
      ctx.shadowColor = 'rgba(255, 107, 107, 0.6)';
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.restore();
      
      // Check for boom
      if (blob.radius >= maxRadius) {
        cancelAnimationFrame(animationFrameRef.current!);
        onBoom(blob.mass);
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onBoom]);

  const handleTap = () => {
    const blob = blobRef.current;
    
    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    
    // Increase blob size and mass
    const growth = 15 + Math.random() * 10;
    blob.radius += growth;
    blob.mass += growth * 2;
    blob.velocityY -= 5;
    
    setWeight(Math.round(blob.mass));
    setTapCount(prev => prev + 1);
    
    // Add ripple
    const newRipple: Ripple = {
      x: blob.x,
      y: blob.y,
      radius: blob.radius,
      alpha: 0.8,
      id: rippleIdRef.current++
    };
    ripplesRef.current.push(newRipple);
    setRipples([...ripplesRef.current]);
    
    // Sound visualization (if not muted)
    if (!isMuted && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Flash effect
        ctx.fillStyle = 'rgba(78, 237, 196, 0.1)';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const handleMuteToggle = () => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    onToggleMute();
  };

  const handleShare = () => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    const weightText = weight >= 1000 
      ? `${(weight / 1000).toFixed(1)} kg` 
      : `${weight} g`;
    
    if (window.Telegram?.WebApp) {
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`I'm growing a ${weightText} blob! 🎈`)}`;
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    }
  };

  const displayWeight = weight >= 1000 
    ? `${(weight / 1000).toFixed(1)} kg` 
    : `${weight} g`;

  return (
    <div className="screen game-screen">
      <canvas ref={canvasRef} className="game-canvas" onClick={handleTap} />
      
      {/* Top HUD */}
      <div className="top-hud">
        <div className="weight-counter" key={weight}>
          {displayWeight}
        </div>
        <button className="mute-button" onClick={handleMuteToggle}>
          <span className="icon-text">{isMuted ? '🔇' : '🔊'}</span>
        </button>
      </div>
      
      {/* Bottom HUD */}
      {tapCount > 0 && (
        <div className="bottom-hud slide-up">
          <button className="share-button tg-button" onClick={handleShare}>
            SHARE BLOB
          </button>
        </div>
      )}
    </div>
  );
}