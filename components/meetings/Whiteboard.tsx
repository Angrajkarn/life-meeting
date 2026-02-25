import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Pen, Trash2, Undo } from 'lucide-react';

interface WhiteboardProps {
    socket: any;
    meetingId: string;
    effectiveUserId: string;
    isPresenter: boolean;
}

export function Whiteboard({ socket, meetingId, effectiveUserId, isPresenter }: WhiteboardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#EF4444');
    const [lineWidth, setLineWidth] = useState(3);
    const [mode, setMode] = useState<'draw' | 'erase'>('draw');

    const lastPos = useRef<{ x: number; y: number } | null>(null);

    // Dynamic resize handler to keep canvas scaled to container
    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (canvas && container) {
                // Save context before resize (resizing clears canvas)
                const ctx = canvas.getContext('2d');
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx && ctx) tempCtx.drawImage(canvas, 0, 0);

                // Resize
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;

                // Restore
                if (ctx && tempCtx) ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
            }
        };

        window.addEventListener('resize', resizeCanvas);
        // Initial setup
        setTimeout(resizeCanvas, 100);

        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    // Listen for incoming remote drawing events
    useEffect(() => {
        if (!socket) return;
        
        const handleRemoteDraw = (payload: any) => {
            // Prevent echo if we fired it
            if (payload.userId === effectiveUserId) return;
            
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            if (payload.action === 'clear') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            // Convert normalized coordinates (0 to 1) back to absolute pixels based on current canvas size
            const startX = payload.x0 * canvas.width;
            const startY = payload.y0 * canvas.height;
            const endX = payload.x1 * canvas.width;
            const endY = payload.y1 * canvas.height;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = payload.color;
            ctx.lineWidth = payload.lineWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.closePath();
        };

        socket.on('whiteboard:action', handleRemoteDraw);
        return () => {
            socket.off('whiteboard:action', handleRemoteDraw);
        };
    }, [socket, effectiveUserId]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const pos = getPos(e);
        lastPos.current = pos;
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !lastPos.current) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const currentPos = getPos(e);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw Locally
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.strokeStyle = mode === 'erase' ? '#FFFFFF' : color;
        ctx.lineWidth = mode === 'erase' ? 20 : lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.closePath();

        // Broadcast (Normalize coordinates to range 0.0 - 1.0 for cross-device consistency)
        if (socket) {
            socket.emit('whiteboard:action', {
                userId: effectiveUserId,
                action: 'draw',
                x0: lastPos.current.x / canvas.width,
                y0: lastPos.current.y / canvas.height,
                x1: currentPos.x / canvas.width,
                y1: currentPos.y / canvas.height,
                color: mode === 'erase' ? '#FFFFFF' : color,
                lineWidth: mode === 'erase' ? 20 : lineWidth,
            });
        }

        lastPos.current = currentPos;
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        lastPos.current = null;
    };

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (socket) {
            socket.emit('whiteboard:action', {
                userId: effectiveUserId,
                action: 'clear'
            });
        }
    };

    return (
        <div className="w-full h-full flex flex-col relative bg-slate-50 dark:bg-slate-900 overflow-hidden" ref={containerRef}>
            {/* Toolbar Overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-full py-2 px-4 flex items-center gap-3 z-10 transition-all">
                <button 
                    onClick={() => setMode('draw')}
                    className={`p-2 rounded-full transition-colors ${mode === 'draw' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}
                    title="Pen"
                >
                    <Pen className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-slate-200" />
                
                {/* Colors */}
                {['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#111827'].map((c) => (
                    <button
                        key={c}
                        onClick={() => { setColor(c); setMode('draw'); }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c && mode === 'draw' ? 'scale-125 border-indigo-400' : 'border-transparent hover:scale-110'}`}
                        style={{ backgroundColor: c === '#111827' ? 'currentColor' : c, color: c === '#111827' ? (document.documentElement.classList.contains('dark') ? '#FFFFFF' : '#111827') : undefined }}
                        title="Color"
                    />
                ))}

                <div className="w-px h-6 bg-slate-200" />
                <button 
                    onClick={() => setMode('erase')}
                    className={`p-2 rounded-full transition-colors ${mode === 'erase' ? 'bg-slate-200 text-slate-800' : 'hover:bg-slate-100 text-slate-500'}`}
                    title="Eraser"
                >
                    <Eraser className="w-5 h-5" />
                </button>
                
                {isPresenter && (
                    <>
                        <div className="w-px h-6 bg-slate-200" />
                        <button 
                            onClick={clearCanvas}
                            className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                            title="Clear All"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>

            {/* Drawing Surface */}
            <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
        </div>
    );
}
