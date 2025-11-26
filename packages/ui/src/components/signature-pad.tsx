import * as React from 'react';
import { cn } from '../lib/utils';
import { Button } from './button';

// Export type for imperative handle (declare before use)
export interface SignaturePadRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string | null;
}

export interface SignaturePadProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  onChange?: (signature: string | null) => void;
  onClear?: () => void;
  penColor?: string;
  penWidth?: number;
  width?: number;
  height?: number;
  disabled?: boolean;
}

export const SignaturePad = React.forwardRef<SignaturePadRef, SignaturePadProps>(
  (
    {
      className,
      onChange,
      onClear,
      penColor = '#1e3a5f', // Navy
      penWidth = 2,
      width = 600,
      height = 200,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = React.useState(false);
    const [isEmpty, setIsEmpty] = React.useState(true);
    const [context, setContext] = React.useState<CanvasRenderingContext2D | null>(
      null
    );

    // Initialize canvas context
    React.useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size for high DPI displays
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;

      setContext(ctx);
    }, [penColor, penWidth]);

    // Get coordinates relative to canvas
    const getCoordinates = (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();

      if ('touches' in e) {
        // Touch event
        const touch = e.touches[0];
        return {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      } else {
        // Mouse event
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    };

    // Start drawing
    const startDrawing = (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (disabled || !context) return;

      const coords = getCoordinates(e);
      if (!coords) return;

      setIsDrawing(true);
      context.beginPath();
      context.moveTo(coords.x, coords.y);

      // Prevent scrolling on touch devices
      if ('touches' in e) {
        e.preventDefault();
      }
    };

    // Draw line
    const draw = (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (!isDrawing || disabled || !context) return;

      const coords = getCoordinates(e);
      if (!coords) return;

      context.lineTo(coords.x, coords.y);
      context.stroke();

      if (isEmpty) {
        setIsEmpty(false);
      }

      // Prevent scrolling on touch devices
      if ('touches' in e) {
        e.preventDefault();
      }
    };

    // Stop drawing
    const stopDrawing = () => {
      if (!isDrawing) return;
      setIsDrawing(false);

      // Export signature as base64 PNG
      if (!isEmpty && canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        onChange?.(dataUrl);
      }
    };

    // Clear canvas
    const handleClear = () => {
      const canvas = canvasRef.current;
      if (!canvas || !context) return;

      context.clearRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);
      onChange?.(null);
      onClear?.();
    };

    // Export as base64 PNG
    const exportSignature = (): string | null => {
      if (isEmpty || !canvasRef.current) return null;
      return canvasRef.current.toDataURL('image/png');
    };

    // Expose methods via ref
    React.useImperativeHandle(ref, () => ({
      clear: handleClear,
      isEmpty: () => isEmpty,
      toDataURL: exportSignature,
    }));

    return (
      <div className={cn('space-y-3', className)} {...props}>
        {/* Canvas container */}
        <div
          className={cn(
            'relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ width, height }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
            style={{ width, height }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {/* Placeholder text */}
          {isEmpty && !disabled && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-400 text-sm">Sign here</p>
            </div>
          )}

          {/* Disabled overlay */}
          {disabled && (
            <div className="absolute inset-0 bg-gray-100/50 pointer-events-none" />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={isEmpty || disabled}
          >
            Clear
          </Button>

          <p className="text-xs text-gray-500">
            {isEmpty
              ? 'Draw your signature above'
              : 'Signature captured'}
          </p>
        </div>
      </div>
    );
  }
);

SignaturePad.displayName = 'SignaturePad';
