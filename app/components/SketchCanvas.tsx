// app/components/SketchCanvas.tsx
'use client';

import { useRef } from 'react';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';
import { Eraser, Pencil, RotateCcw, Download } from 'lucide-react';

interface SketchCanvasProps {
  onExport: (imageData: string) => void;
}

export default function SketchCanvas({ onExport }: SketchCanvasProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);

  const handleExport = async () => {
    if (canvasRef.current) {
      const imageData = await canvasRef.current.exportImage('png');
      onExport(imageData);
    }
  };

  const handleClear = () => {
    canvasRef.current?.clearCanvas();
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 工具栏 */}
      <div className="flex gap-2 p-2 bg-gray-100 border-b">
        <button
          onClick={() => canvasRef.current?.eraseMode(false)}
          className="p-2 hover:bg-gray-200 rounded"
          title="画笔"
        >
          <Pencil size={20} />
        </button>
        <button
          onClick={() => canvasRef.current?.eraseMode(true)}
          className="p-2 hover:bg-gray-200 rounded"
          title="橡皮擦"
        >
          <Eraser size={20} />
        </button>
        <button
          onClick={handleUndo}
          className="p-2 hover:bg-gray-200 rounded"
          title="撤销"
        >
          <RotateCcw size={20} />
        </button>
        <button
          onClick={handleClear}
          className="p-2 hover:bg-gray-200 rounded text-red-500"
          title="清空"
        >
          清空
        </button>
        <div className="flex-1" />
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
        >
          <Download size={16} />
          生成代码
        </button>
      </div>

      {/* 画布 */}
      <ReactSketchCanvas
        ref={canvasRef}
        width="100%"
        height="500px"
        strokeWidth={3}
        strokeColor="black"
        canvasColor="white"
      />
    </div>
  );
}
