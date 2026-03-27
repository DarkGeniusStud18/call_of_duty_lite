import { useEffect, useRef, useState } from 'react';
import { GameEngine } from './gameEngine';
import { render } from './renderer';
import { motion, AnimatePresence } from 'motion/react';
import { Crosshair, Shield, Zap, Target, Trophy, RotateCcw, Play } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameEngine>(new GameEngine());
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [hud, setHud] = useState({
    health: 100,
    ammo: 30,
    maxAmmo: 30,
    score: 0,
    wave: 1,
    isReloading: false
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gameRef.current.init(canvas.width, canvas.height);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    let lastTime = performance.now();
    let animationFrameId: number;

    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      if (gameState === 'playing') {
        gameRef.current.update(dt);
        
        // Sync HUD state
        setHud({
          health: Math.max(0, gameRef.current.player.health),
          ammo: gameRef.current.player.ammo,
          maxAmmo: gameRef.current.player.maxAmmo,
          score: gameRef.current.player.score,
          wave: gameRef.current.wave,
          isReloading: gameRef.current.isReloading
        });

        if (gameRef.current.player.health <= 0) {
          setGameState('gameover');
        }
      }

      render(ctx, gameRef.current);
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    const handleKeyDown = (e: KeyboardEvent) => gameRef.current.keys.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => gameRef.current.keys.delete(e.key.toLowerCase());
    const handleMouseMove = (e: MouseEvent) => {
      gameRef.current.mousePos = { x: e.clientX, y: e.clientY };
    };
    const handleMouseDown = () => { gameRef.current.isMouseDown = true; };
    const handleMouseUp = () => { gameRef.current.isMouseDown = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameState]);

  const startGame = () => {
    gameRef.current = new GameEngine();
    gameRef.current.init(window.innerWidth, window.innerHeight);
    setGameState('playing');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-none"
      />

      {/* Custom Cursor */}
      {gameState === 'playing' && (
        <div 
          className="fixed pointer-events-none z-50 mix-blend-difference"
          style={{ 
            left: gameRef.current.mousePos.x, 
            top: gameRef.current.mousePos.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Crosshair className="w-8 h-8 text-white animate-pulse" />
        </div>
      )}

      {/* HUD */}
      <AnimatePresence>
        {gameState === 'playing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-zinc-400 uppercase tracking-widest text-xs font-bold">
                  <Trophy className="w-4 h-4" />
                  Score
                </div>
                <div className="text-4xl font-display text-white tracking-tighter">
                  {hud.score.toLocaleString()}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Wave</div>
                <div className="text-4xl font-display text-white">{hud.wave}</div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end">
              {/* Health */}
              <div className="flex flex-col gap-3 w-64">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-400 uppercase tracking-widest text-xs font-bold">
                    <Shield className="w-4 h-4" />
                    Condition
                  </div>
                  <div className="text-xl font-mono font-bold">{hud.health}%</div>
                </div>
                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <motion.div 
                    className="h-full bg-blue-500"
                    animate={{ width: `${hud.health}%` }}
                    transition={{ type: 'spring', stiffness: 100 }}
                  />
                </div>
              </div>

              {/* Ammo */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 text-amber-400 uppercase tracking-widest text-xs font-bold">
                  <Zap className="w-4 h-4" />
                  {hud.isReloading ? 'Reloading...' : 'Ammo'}
                </div>
                <div className="flex items-baseline gap-2">
                  <div className={`text-6xl font-display ${hud.ammo < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {hud.ammo}
                  </div>
                  <div className="text-2xl font-display text-zinc-600">/ {hud.maxAmmo}</div>
                </div>
              </div>
            </div>

            {/* Hit Indicator Overlay */}
            {hud.health < 30 && (
              <motion.div 
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute inset-0 pointer-events-none border-[20px] border-red-900/20 shadow-[inset_0_0_100px_rgba(127,29,29,0.5)]"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menus */}
      <AnimatePresence>
        {gameState === 'menu' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="text-center max-w-2xl px-4">
              <motion.h1 
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="text-7xl md:text-9xl font-display text-white mb-4 tracking-tighter leading-none"
              >
                COD<span className="text-blue-500">LITE</span>
              </motion.h1>
              <p className="text-zinc-400 mb-12 uppercase tracking-[0.3em] text-sm font-bold">
                Tactical 2D Combat Simulator
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="p-4 border border-zinc-800 bg-zinc-900/50 rounded-lg">
                  <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">Aim & Shoot</div>
                  <div className="text-sm text-zinc-300">Mouse</div>
                </div>
                <div className="p-4 border border-zinc-800 bg-zinc-900/50 rounded-lg">
                  <Zap className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">Move</div>
                  <div className="text-sm text-zinc-300">WASD</div>
                </div>
                <div className="p-4 border border-zinc-800 bg-zinc-900/50 rounded-lg">
                  <RotateCcw className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">Reload</div>
                  <div className="text-sm text-zinc-300">Auto / R</div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="group relative px-12 py-4 bg-blue-600 text-white font-display text-2xl uppercase tracking-widest overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-3">
                  <Play className="w-6 h-6 fill-current" />
                  Deploy
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {gameState === 'gameover' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex items-center justify-center z-50"
          >
            <div className="text-center">
              <h2 className="text-8xl font-display text-white mb-2 tracking-tighter">KIA</h2>
              <p className="text-red-400 mb-8 uppercase tracking-widest font-bold">Mission Failed - Soldier Down</p>
              
              <div className="bg-black/40 p-8 rounded-xl border border-red-900/50 mb-8">
                <div className="text-zinc-500 uppercase tracking-widest text-xs font-bold mb-1">Final Score</div>
                <div className="text-6xl font-display text-white mb-4">{hud.score.toLocaleString()}</div>
                <div className="text-zinc-500 uppercase tracking-widest text-xs font-bold mb-1">Waves Survived</div>
                <div className="text-3xl font-display text-white">{hud.wave}</div>
              </div>

              <button
                onClick={startGame}
                className="px-12 py-4 bg-white text-black font-display text-2xl uppercase tracking-widest hover:bg-zinc-200 transition-colors"
              >
                Redeploy
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
