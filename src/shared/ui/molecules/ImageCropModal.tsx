import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Crop, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';
import './ImageCropModal.css';

export interface ImageCropModalProps {
  isOpen: boolean;
  imageFile: File | null;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  cropSize?: number; // Tamaño del visor de recorte en píxeles (default: 280)
  outputSize?: number; // Resolución del archivo recortado final (default: 600)
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageFile,
  onClose,
  onCropComplete,
  cropSize = 280,
  outputSize = 600,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number }>({ clientX: 0, clientY: 0 });
  const startOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Crear object URL al recibir un archivo nuevo
  useEffect(() => {
    if (!imageFile) {
      setImageSrc(null);
      setNaturalSize(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImageSrc(url);
    setZoom(1);
    setOffset({ x: 0, y: 0 });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  // Cuando la imagen carga en memoria, guardar dimensiones naturales
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    setNaturalSize({
      width: target.naturalWidth,
      height: target.naturalHeight,
    });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Calcular la escala base para cubrir todo el contenedor de recorte (1:1)
  const baseScale = naturalSize
    ? Math.max(cropSize / naturalSize.width, cropSize / naturalSize.height)
    : 1;

  // Límites máximos de desplazamiento permitidos (evitar espacios vacíos)
  const getMaxOffset = useCallback(
    (currentZoom: number) => {
      if (!naturalSize) return { maxX: 0, maxY: 0 };
      const currentScale = baseScale * currentZoom;
      const renderedW = naturalSize.width * currentScale;
      const renderedH = naturalSize.height * currentScale;
      return {
        maxX: Math.max(0, (renderedW - cropSize) / 2),
        maxY: Math.max(0, (renderedH - cropSize) / 2),
      };
    },
    [baseScale, cropSize, naturalSize]
  );

  // Re-ajustar offset al cambiar zoom
  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.min(3, Math.max(1, newZoom));
    setZoom(clampedZoom);
    const { maxX, maxY } = getMaxOffset(clampedZoom);
    setOffset((prev) => ({
      x: Math.min(maxX, Math.max(-maxX, prev.x)),
      y: Math.min(maxY, Math.max(-maxY, prev.y)),
    }));
  };

  // Manejo de arrastre: Mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
    startOffsetRef.current = { ...offset };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.clientX;
      const dy = e.clientY - dragStartRef.current.clientY;
      const { maxX, maxY } = getMaxOffset(zoom);

      setOffset({
        x: Math.min(maxX, Math.max(-maxX, startOffsetRef.current.x + dx)),
        y: Math.min(maxY, Math.max(-maxY, startOffsetRef.current.y + dy)),
      });
    },
    [isDragging, getMaxOffset, zoom]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Manejo de arrastre: Touch (Móvil)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
      startOffsetRef.current = { ...offset };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.clientX;
    const dy = e.touches[0].clientY - dragStartRef.current.clientY;
    const { maxX, maxY } = getMaxOffset(zoom);

    setOffset({
      x: Math.min(maxX, Math.max(-maxX, startOffsetRef.current.x + dx)),
      y: Math.min(maxY, Math.max(-maxY, startOffsetRef.current.y + dy)),
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Zoom con rueda del ratón
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const step = e.deltaY < 0 ? 0.08 : -0.08;
    handleZoomChange(zoom + step);
  };

  // Registrar listeners de movimiento de mouse global
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Generar recorte en alta resolución usando Canvas
  const handleConfirmCrop = async () => {
    if (!imgRef.current || !naturalSize || !imageFile) return;

    try {
      setIsProcessing(true);
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const currentScale = baseScale * zoom;
      const srcW = cropSize / currentScale;
      const srcH = cropSize / currentScale;

      const srcX = naturalSize.width / 2 - offset.x / currentScale - srcW / 2;
      const srcY = naturalSize.height / 2 - offset.y / currentScale - srcH / 2;

      const clampedSrcX = Math.max(0, Math.min(naturalSize.width - srcW, srcX));
      const clampedSrcY = Math.max(0, Math.min(naturalSize.height - srcH, srcY));

      // Calidad de dibujo nítida
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        imgRef.current,
        clampedSrcX,
        clampedSrcY,
        srcW,
        srcH,
        0,
        0,
        outputSize,
        outputSize
      );

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.92);
      });

      setIsProcessing(false);
      if (!blob) return;

      // Nombre normalizado con extensión jpg
      const baseName = imageFile.name.replace(/\.[^/.]+$/, '');
      const croppedFile = new File([blob], `${baseName}_recorte.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      onCropComplete(croppedFile);
      onClose();
    } catch {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  if (!isOpen || !imageFile || !imageSrc) return null;

  const currentScale = baseScale * zoom;
  const renderedW = naturalSize ? naturalSize.width * currentScale : cropSize;
  const renderedH = naturalSize ? naturalSize.height * currentScale : cropSize;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajustar encuadre de la foto"
      size="md"
      footer={
        <div className="d-flex align-items-center justify-content-between w-100">
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            onClick={handleReset}
            className="d-inline-flex align-items-center gap-1"
          >
            <RotateCcw size={14} aria-hidden="true" />
            <span>Restablecer</span>
          </Button>

          <div className="d-flex align-items-center gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmCrop}
              isLoading={isProcessing}
              loadingText="Aplicando..."
              className="d-inline-flex align-items-center gap-1"
            >
              <Crop size={15} aria-hidden="true" />
              <span>Aplicar recorte</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="kyrios-crop-container">
        <p className="text-muted small text-center mb-3">
          Arrastra la imagen para centrar el área deseada. Usa el control para acercar o alejar.
        </p>

        {/* Visor interactivo de recorte */}
        <div
          role="region"
          aria-label="Visor interactivo de recorte"
          tabIndex={0}
          className="kyrios-crop-viewport"
          style={{ width: `${cropSize}px`, height: `${cropSize}px` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          onKeyDown={(e) => {
            const paso = 10;
            if (e.key === 'ArrowLeft') {
              setOffset((prev) => ({ ...prev, x: prev.x - paso }));
            } else if (e.key === 'ArrowRight') {
              setOffset((prev) => ({ ...prev, x: prev.x + paso }));
            } else if (e.key === 'ArrowUp') {
              setOffset((prev) => ({ ...prev, y: prev.y - paso }));
            } else if (e.key === 'ArrowDown') {
              setOffset((prev) => ({ ...prev, y: prev.y + paso }));
            }
          }}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Imagen para recortar"
            className="kyrios-crop-image"
            style={{
              width: `${renderedW}px`,
              height: `${renderedH}px`,
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            }}
            onLoad={handleImageLoad}
            draggable={false}
          />

          {/* Marco y guías de regla de tercios */}
          <div className="kyrios-crop-mask" />
          <div className="kyrios-crop-grid-h" />
          <div className="kyrios-crop-grid-v" />
        </div>

        {/* Controles de Zoom */}
        <div className="kyrios-crop-controls">
          <div className="kyrios-crop-zoom-bar">
            <ZoomOut size={16} className="text-muted" aria-hidden="true" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => handleZoomChange(Number.parseFloat(e.target.value))}
              className="form-range kyrios-crop-slider"
              aria-label="Nivel de zoom para recorte"
            />
            <ZoomIn size={16} className="text-muted" aria-hidden="true" />
            <span className="small fw-semibold text-muted ms-1" style={{ minWidth: '38px' }}>
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="kyrios-crop-preview-box">
            <span>Formato: <strong>Cuadrado 1:1</strong></span>
            <span>•</span>
            <span>Optimizado para el catálogo</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ImageCropModal;
