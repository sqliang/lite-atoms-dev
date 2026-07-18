import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageViewerProps {
  content: string;
  title: string;
}

export default function ImageViewer({ content, title }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  return (
    <div className="h-full flex flex-col bg-[hsl(222,47%,4%)] workspace-enter">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border/30">
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 cursor-pointer"
          onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 cursor-pointer"
          onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 cursor-pointer"
          onClick={() => setRotation((r) => r + 90)}
        >
          <RotateCw className="w-3.5 h-3.5" />
        </Button>
        <div className="h-4 w-px bg-border/40 mx-1" />
        <span className="text-[11px] text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" className="w-7 h-7 cursor-pointer">
          <Download className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Image canvas */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-8">
        <div
          className="transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
        >
          <img
            src={content}
            alt={title}
            className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain"
            draggable={false}
          />
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center px-3 py-1.5 border-t border-border/30 text-[10px] text-muted-foreground/60">
        <span>{title}</span>
        <div className="flex-1" />
        <span>Preview Mode</span>
      </div>
    </div>
  );
}