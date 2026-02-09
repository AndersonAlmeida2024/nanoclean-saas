import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Check } from 'lucide-react';

interface SignatureCanvasProps {
    onSave: (base64: string) => void;
    onClear?: () => void;
}

export function SignatureCanvas({ onSave, onClear }: SignatureCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Configuração inicial do traço - Fundo Branco, Caneta Preta para destaque
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Ajustar resolução para retina/displays de alta densidade
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx?.beginPath(); // Resetar o caminho para a próxima linha

        // Salvar automaticamente após cada traço ou aguardar botão?
        // Vamos deixar o botão de confirmação para ser mais explícito
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onClear?.();
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Verificar se o canvas está vazio antes de salvar (opcional)
        const base64 = canvas.toDataURL('image/png');
        onSave(base64);
    };

    return (
        <div className="space-y-3">
            <div className="relative group">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseMove={draw}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                    className="w-full h-48 bg-white border border-white/10 rounded-2xl cursor-crosshair touch-none transition-colors group-hover:border-cyan-500/30 shadow-inner"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                    <button
                        onClick={clear}
                        className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                        title="Limpar assinatura"
                    >
                        <Eraser size={18} />
                    </button>
                    <button
                        onClick={handleSave}
                        className="p-2 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 rounded-lg transition-all"
                        title="Confirmar assinatura"
                    >
                        <Check size={18} />
                    </button>
                </div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                        Assine aqui
                    </p>
                </div>
            </div>
        </div>
    );
}
