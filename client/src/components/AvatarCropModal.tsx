import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Loader2 } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface CroppedArea {
  x: number; y: number; width: number; height: number;
}

async function getCroppedImg(imageSrc: string, pixelCrop: CroppedArea): Promise<Blob> {
  const image = await createImageBitmap(await (await fetch(imageSrc)).blob());
  const canvas = document.createElement("canvas");
  const size = Math.min(pixelCrop.width, pixelCrop.height, 400); // max 400×400
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Draw circular clip
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0, size, size
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/jpeg", 0.92);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AvatarCropModalProps {
  imageSrc: string;
  onCancel: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
  uploading?: boolean;
}

export default function AvatarCropModal({ imageSrc, onCancel, onCropComplete, uploading = false }: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = useCallback((c: { x: number; y: number }) => setCrop(c), []);
  const onZoomChange = useCallback((z: number) => setZoom(z), []);
  const onCropCompleteInternal = useCallback((_: any, croppedPixels: CroppedArea) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(blob);
    } catch (e) {
      console.error("Crop failed:", e);
    } finally {
      setProcessing(false);
    }
  };

  const isLoading = processing || uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="bg-[oklch(0.18_0_0)] px-5 py-3 flex items-center justify-between border-b border-[oklch(0.22_0_0)]">
          <span className="text-sm font-black text-white">Crop Profile Photo</span>
          <button onClick={onCancel} disabled={isLoading} className="text-[oklch(0.50_0_0)] hover:text-white transition-colors disabled:opacity-40">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative bg-black" style={{ height: 300 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteInternal}
            style={{
              containerStyle: { background: "#000" },
              cropAreaStyle: { border: "3px solid #F5C518", boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)" },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-5 py-4 border-t border-[oklch(0.20_0_0)]">
          <div className="flex items-center gap-3">
            <button onClick={() => setZoom(Math.max(1, zoom - 0.1))} className="text-[oklch(0.55_0_0)] hover:text-white transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, oklch(0.85 0.18 95) 0%, oklch(0.85 0.18 95) ${((zoom - 1) / 2) * 100}%, oklch(0.25 0 0) ${((zoom - 1) / 2) * 100}%, oklch(0.25 0 0) 100%)`
              }}
            />
            <button onClick={() => setZoom(Math.min(3, zoom + 0.1))} className="text-[oklch(0.55_0_0)] hover:text-white transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => { setZoom(1); setCrop({ x: 0, y: 0 }); }} className="text-[oklch(0.45_0_0)] hover:text-white transition-colors ml-1" title="Reset">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-[oklch(0.40_0_0)] text-center mt-2">Drag to reposition · Scroll or use slider to zoom</p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] text-[oklch(0.65_0_0)] hover:text-white font-bold text-sm py-2.5 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isLoading || !croppedAreaPixels}
            className="flex-1 bg-[oklch(0.85_0.18_95)] text-black font-black text-sm py-2.5 hover:bg-[oklch(0.78_0.18_95)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {uploading ? "Uploading..." : "Processing..."}</>
            ) : (
              <><Check className="w-4 h-4" /> Apply & Upload</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
