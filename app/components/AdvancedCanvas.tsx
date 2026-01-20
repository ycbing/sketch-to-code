// app/components/AdvancedCanvas.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Canvas,
  Object,
  Rect,
  Line,
  Ellipse,
  Image,
  ITextEvents,
  IText,
  Polyline,
  PencilBrush,
} from "fabric";
import { useDebouncedCallback } from "use-debounce";
import {
  MousePointer2,
  Pencil,
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Minus,
  ArrowRight,
  Eraser,
  RotateCcw,
  RotateCw,
  Trash2,
  ZoomIn,
  ZoomOut,
  Download,
  Copy,
  Layers,
  Move,
  Grid3X3,
  Palette,
} from "lucide-react";

// 工具类型定义
type ToolType =
  | "select"
  | "pencil"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "text"
  | "image"
  | "eraser";

interface CanvasHistory {
  state: string;
  timestamp: number;
}

interface AdvancedCanvasProps {
  onExport: (imageData: string) => void;
  onSave?: (canvasData: string) => void;
  initialData?: string;
}

// 预设颜色
const COLORS = [
  "#000000",
  "#374151",
  "#6B7280",
  "#9CA3AF",
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#3B82F6",
  "#6366F1",
  "#A855F7",
  "#EC4899",
];

// 预设笔触大小
const STROKE_SIZES = [1, 2, 4, 6, 8, 12, 16];

export default function AdvancedCanvas({
  onExport,
  onSave,
  initialData,
}: AdvancedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);

  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [fillColor, setFillColor] = useState("transparent");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(20);

  // 历史记录管理
  const [history, setHistory] = useState<CanvasHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);

  // 网格显示
  const [showGrid, setShowGrid] = useState(true);

  // 图层面板
  const [showLayers, setShowLayers] = useState(false);
  const [objects, setObjects] = useState<Object[]>([]);

  // 初始化 Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
      selection: true,
    });

    fabricRef.current = canvas;

    // 加载初始数据
    if (initialData) {
      canvas.loadFromJSON(initialData, () => {
        canvas.renderAll();
        updateObjects();
      });
    }

    // 监听对象修改
    canvas.on("object:modified", saveToHistory);
    canvas.on("object:added", () => {
      if (!isDrawing) saveToHistory();
      updateObjects();
    });
    canvas.on("object:removed", () => {
      saveToHistory();
      updateObjects();
    });

    // 初始化历史记录
    saveToHistory();

    // 绘制网格
    if (showGrid) drawGrid();

    return () => {
      canvas.dispose();
    };
  }, []);

  // 更新对象列表
  const updateObjects = useCallback(() => {
    if (!fabricRef.current) return;
    const objs = fabricRef.current
      .getObjects()
      .filter((obj) => obj.name !== "grid");
    setObjects([...objs]);
  }, []);

  // 保存历史记录
  const saveToHistory = useDebouncedCallback(() => {
    if (!fabricRef.current) return;

    const json = JSON.stringify(fabricRef.current.toJSON(["name"]));
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      state: json,
      timestamp: Date.now(),
    });

    // 最多保留 50 条历史
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, 300);

  // 撤销
  const handleUndo = () => {
    if (historyIndex <= 0 || !fabricRef.current) return;

    const newIndex = historyIndex - 1;
    fabricRef.current.loadFromJSON(history[newIndex].state, () => {
      fabricRef.current?.renderAll();
      setHistoryIndex(newIndex);
      updateObjects();
    });
  };

  // 重做
  const handleRedo = () => {
    if (historyIndex >= history.length - 1 || !fabricRef.current) return;

    const newIndex = historyIndex + 1;
    fabricRef.current.loadFromJSON(history[newIndex].state, () => {
      fabricRef.current?.renderAll();
      setHistoryIndex(newIndex);
      updateObjects();
    });
  };

  // 绘制网格
  const drawGrid = useCallback(() => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;
    const gridSize = 20;
    const width = canvas.getWidth();
    const height = canvas.getHeight();

    // 移除旧网格
    canvas.getObjects().forEach((obj) => {
      if (obj.name === "grid") canvas.remove(obj);
    });

    if (!showGrid) return;

    // 绘制新网格
    for (let i = 0; i < width / gridSize; i++) {
      const line = new Line([i * gridSize, 0, i * gridSize, height], {
        stroke: "#e5e7eb",
        strokeWidth: 1,
        selectable: false,
        evented: false,
        name: "grid",
      });
      canvas.add(line);
      // canvas.sendToBack(line);
    }

    for (let i = 0; i < height / gridSize; i++) {
      const line = new Line([0, i * gridSize, width, i * gridSize], {
        stroke: "#e5e7eb",
        strokeWidth: 1,
        selectable: false,
        evented: false,
        name: "grid",
      });
      canvas.add(line);
      // canvas.sendToBack(line);
    }
  }, [showGrid]);

  // 创建箭头
  const createArrow = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 15;

    const points = [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
      {
        x: x2 - headLength * Math.cos(angle - Math.PI / 6),
        y: y2 - headLength * Math.sin(angle - Math.PI / 6),
      },
      { x: x2, y: y2 },
      {
        x: x2 - headLength * Math.cos(angle + Math.PI / 6),
        y: y2 - headLength * Math.sin(angle + Math.PI / 6),
      },
    ];

    return new Polyline(points, {
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      fill: "",
      selectable: true,
    });
  }, [strokeColor, strokeWidth]);

  // 文字点击处理
  const handleTextClick = useCallback((e: any) => {
    if (!fabricRef.current) return;

    // Fabric.js 7.x 使用 scenePoint 替代 getPointer
    const pointer = e.scenePoint || { x: 0, y: 0 };
    const text = new IText("双击编辑", {
      left: pointer.x,
      top: pointer.y,
      fontSize: fontSize,
      fill: strokeColor,
      fontFamily: "Arial",
    });

    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    text.enterEditing();
    saveToHistory();
  }, [fontSize, strokeColor, saveToHistory]);

  // 形状绘制逻辑
  const setupShapeDrawing = useCallback((shape: string) => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;

    let startX = 0;
    let startY = 0;
    let currentShape: Object | null = null;

    canvas.defaultCursor = "crosshair";
    canvas.selection = false;

    canvas.on("mouse:down", (e) => {
      setIsDrawing(true);
      // Fabric.js 7.x 使用 scenePoint 替代 getPointer
      const pointer = e.scenePoint || { x: 0, y: 0 };
      startX = pointer.x;
      startY = pointer.y;

      const options = {
        left: startX,
        top: startY,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        fill: fillColor === "transparent" ? "" : fillColor,
        selectable: true,
      };

      switch (shape) {
        case "rectangle":
          currentShape = new Rect({
            ...options,
            width: 0,
            height: 0,
          });
          break;
        case "circle":
          currentShape = new Ellipse({
            ...options,
            rx: 0,
            ry: 0,
          });
          break;
        case "line":
          currentShape = new Line([startX, startY, startX, startY], {
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            selectable: true,
          });
          break;
        case "arrow":
          currentShape = createArrow(startX, startY, startX, startY);
          break;
      }

      if (currentShape) {
        canvas.add(currentShape);
      }
    });

    canvas.on("mouse:move", (e) => {
      if (!currentShape) return;

      // Fabric.js 7.x 使用 scenePoint 替代 getPointer
      const pointer = e.scenePoint || { x: 0, y: 0 };
      const width = pointer.x - startX;
      const height = pointer.y - startY;

      switch (shape) {
        case "rectangle":
          (currentShape as Rect).set({
            width: Math.abs(width),
            height: Math.abs(height),
            left: width > 0 ? startX : pointer.x,
            top: height > 0 ? startY : pointer.y,
          });
          break;
        case "circle":
          (currentShape as Ellipse).set({
            rx: Math.abs(width) / 2,
            ry: Math.abs(height) / 2,
            left: startX - Math.abs(width) / 2,
            top: startY - Math.abs(height) / 2,
          });
          break;
        case "line":
          (currentShape as Line).set({
            x2: pointer.x,
            y2: pointer.y,
          });
          break;
        case "arrow":
          canvas.remove(currentShape);
          currentShape = createArrow(startX, startY, pointer.x, pointer.y);
          canvas.add(currentShape);
          break;
      }

      canvas.renderAll();
    });

    canvas.on("mouse:up", () => {
      currentShape = null;
      setIsDrawing(false);
      saveToHistory();
    });
  }, [strokeColor, strokeWidth, fillColor, createArrow, saveToHistory]);

  // 工具切换
  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;

    // 重置状态
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = "default";
    canvas.off("mouse:down");
    canvas.off("mouse:move");
    canvas.off("mouse:up");

    switch (activeTool) {
      case "select":
        canvas.selection = true;
        break;

      case "pencil":
        canvas.isDrawingMode = true;
        // Fabric.js 7.x 需要显式创建 PencilBrush
        if (!canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush = new PencilBrush(canvas);
        }
        canvas.freeDrawingBrush.color = strokeColor;
        canvas.freeDrawingBrush.width = strokeWidth;
        break;

      case "eraser":
        canvas.isDrawingMode = true;
        // Fabric.js 7.x 需要显式创建 PencilBrush
        if (!canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush = new PencilBrush(canvas);
        }
        canvas.freeDrawingBrush.color = "#ffffff";
        canvas.freeDrawingBrush.width = strokeWidth * 3;
        break;

      case "rectangle":
        setupShapeDrawing("rectangle");
        break;

      case "circle":
        setupShapeDrawing("circle");
        break;

      case "line":
        setupShapeDrawing("line");
        break;

      case "arrow":
        setupShapeDrawing("arrow");
        break;

      case "text":
        canvas.defaultCursor = "text";
        canvas.on("mouse:down", handleTextClick);
        break;
    }
  }, [activeTool, strokeColor, fillColor, strokeWidth, setupShapeDrawing, handleTextClick]);

  // 图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      Image.fromURL(event.target?.result as string, (img) => {
        // 限制图片大小
        const maxSize = 300;
        if (img.width! > maxSize || img.height! > maxSize) {
          const scale = maxSize / Math.max(img.width!, img.height!);
          img.scale(scale);
        }

        img.set({
          left: 100,
          top: 100,
        });

        fabricRef.current?.add(img);
        fabricRef.current?.setActiveObject(img);
        saveToHistory();
      });
    };
    reader.readAsDataURL(file);
  };

  // 删除选中对象
  const handleDelete = () => {
    if (!fabricRef.current) return;

    const activeObjects = fabricRef.current.getActiveObjects();
    activeObjects.forEach((obj) => {
      fabricRef.current?.remove(obj);
    });
    fabricRef.current.discardActiveObject();
    fabricRef.current.renderAll();
  };

  // 复制选中对象
  const handleDuplicate = () => {
    if (!fabricRef.current) return;

    const activeObject = fabricRef.current.getActiveObject();
    if (!activeObject) return;

    activeObject.clone((cloned: Object) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      fabricRef.current?.add(cloned);
      fabricRef.current?.setActiveObject(cloned);
      saveToHistory();
    });
  };

  // 清空画布
  const handleClear = () => {
    if (!fabricRef.current) return;

    fabricRef.current.getObjects().forEach((obj) => {
      if (obj.name !== "grid") {
        fabricRef.current?.remove(obj);
      }
    });
    fabricRef.current.renderAll();
    saveToHistory();
  };

  // 缩放
  const handleZoom = (direction: "in" | "out") => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;
    let zoom = canvas.getZoom();
    zoom = direction === "in" ? zoom * 1.1 : zoom / 1.1;
    zoom = Math.min(Math.max(zoom, 0.5), 3);
    canvas.setZoom(zoom);
    canvas.renderAll();
  };

  // 导出图片
  const handleExport = () => {
    if (!fabricRef.current) return;

    // 临时隐藏网格
    const gridObjects = fabricRef.current
      .getObjects()
      .filter((obj) => obj.name === "grid");
    gridObjects.forEach((obj) => obj.set("visible", false));

    const dataUrl = fabricRef.current.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });

    // 恢复网格
    gridObjects.forEach((obj) => obj.set("visible", true));
    fabricRef.current.renderAll();

    onExport(dataUrl);
  };

  // 保存画布数据
  const handleSave = () => {
    if (!fabricRef.current || !onSave) return;

    const json = JSON.stringify(fabricRef.current.toJSON(["name"]));
    onSave(json);
  };

  // 图层选择
  const handleLayerSelect = (obj: Object) => {
    if (!fabricRef.current) return;
    fabricRef.current.setActiveObject(obj);
    fabricRef.current.renderAll();
  };

  // 图层排序
  const handleLayerMove = (index: number, direction: "up" | "down") => {
    if (!fabricRef.current) return;

    const obj = objects[index];
    if (direction === "up") {
      fabricRef.current.bringForward(obj);
    } else {
      fabricRef.current.sendBackwards(obj);
    }
    updateObjects();
    saveToHistory();
  };

  // 工具按钮组件
  const ToolButton = ({
    tool,
    icon: Icon,
    title,
  }: {
    tool: ToolType;
    icon: React.ElementType;
    title: string;
  }) => (
    <button
      onClick={() => setActiveTool(tool)}
      className={`p-2 rounded hover:bg-gray-200 transition-colors ${
        activeTool === tool ? "bg-blue-100 text-blue-600" : ""
      }`}
      title={title}
    >
      <Icon size={20} />
    </button>
  );

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden bg-white">
      {/* 顶部工具栏 */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b flex-wrap">
        {/* 选择工具 */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <ToolButton tool="select" icon={MousePointer2} title="选择" />
          <ToolButton tool="pencil" icon={Pencil} title="画笔" />
          <ToolButton tool="eraser" icon={Eraser} title="橡皮擦" />
        </div>

        {/* 形状工具 */}
        <div className="flex items-center gap-1 px-2 border-r">
          <ToolButton tool="rectangle" icon={Square} title="矩形" />
          <ToolButton tool="circle" icon={Circle} title="圆形" />
          <ToolButton tool="line" icon={Minus} title="直线" />
          <ToolButton tool="arrow" icon={ArrowRight} title="箭头" />
          <ToolButton tool="text" icon={Type} title="文字" />
        </div>

        {/* 图片上传 */}
        <div className="flex items-center gap-1 px-2 border-r">
          <label
            className="p-2 rounded hover:bg-gray-200 cursor-pointer"
            title="插入图片"
          >
            <ImageIcon size={20} />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* 颜色选择 */}
        <div className="flex items-center gap-2 px-2 border-r">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">线条</span>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">填充</span>
            <input
              type="color"
              value={fillColor === "transparent" ? "#ffffff" : fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <button
              onClick={() => setFillColor("transparent")}
              className={`px-2 py-1 text-xs rounded ${
                fillColor === "transparent"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100"
              }`}
            >
              无
            </button>
          </div>
        </div>

        {/* 笔触大小 */}
        <div className="flex items-center gap-2 px-2 border-r">
          <span className="text-xs text-gray-500">粗细</span>
          <select
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            {STROKE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1 px-2 border-r">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-30"
            title="撤销 (Ctrl+Z)"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-30"
            title="重做 (Ctrl+Y)"
          >
            <RotateCw size={20} />
          </button>
          <button
            onClick={handleDuplicate}
            className="p-2 rounded hover:bg-gray-200"
            title="复制"
          >
            <Copy size={20} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded hover:bg-gray-200 text-red-500"
            title="删除"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* 视图控制 */}
        <div className="flex items-center gap-1 px-2 border-r">
          <button
            onClick={() => handleZoom("out")}
            className="p-2 rounded hover:bg-gray-200"
            title="缩小"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={() => handleZoom("in")}
            className="p-2 rounded hover:bg-gray-200"
            title="放大"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded hover:bg-gray-200 ${showGrid ? "text-blue-600" : ""}`}
            title="网格"
          >
            <Grid3X3 size={20} />
          </button>
          <button
            onClick={() => setShowLayers(!showLayers)}
            className={`p-2 rounded hover:bg-gray-200 ${showLayers ? "text-blue-600" : ""}`}
            title="图层"
          >
            <Layers size={20} />
          </button>
        </div>

        {/* 导出 */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded"
          >
            清空
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <Download size={16} />
            生成代码
          </button>
        </div>
      </div>

      {/* 预设颜色面板 */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b">
        <Palette size={16} className="text-gray-400 mr-2" />
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setStrokeColor(color)}
            className={`w-6 h-6 rounded border-2 ${
              strokeColor === color ? "border-blue-500" : "border-transparent"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* 主体区域 */}
      <div className="flex flex-1">
        {/* 画布 */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          <canvas ref={canvasRef} />
        </div>

        {/* 图层面板 */}
        {showLayers && (
          <div className="w-64 border-l bg-white overflow-auto">
            <div className="p-2 border-b font-medium text-sm">
              图层 ({objects.length})
            </div>
            <div className="divide-y">
              {objects.map((obj, index) => (
                <div
                  key={index}
                  onClick={() => handleLayerSelect(obj)}
                  className={`flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer ${
                    fabricRef.current?.getActiveObject() === obj
                      ? "bg-blue-50"
                      : ""
                  }`}
                >
                  <span className="text-sm flex-1 truncate">
                    {obj.type === "i-text"
                      ? "文字"
                      : obj.type === "rect"
                        ? "矩形"
                        : obj.type === "ellipse"
                          ? "圆形"
                          : obj.type === "line"
                            ? "直线"
                            : obj.type === "image"
                              ? "图片"
                              : obj.type === "path"
                                ? "路径"
                                : obj.type}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLayerMove(index, "up");
                      }}
                      className="p-1 hover:bg-gray-200 rounded text-gray-400"
                      disabled={index === objects.length - 1}
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLayerMove(index, "down");
                      }}
                      className="p-1 hover:bg-gray-200 rounded text-gray-400"
                      disabled={index === 0}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
              {objects.length === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm">
                  暂无图层
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 快捷键提示 */}
      <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 flex gap-4">
        <span>Delete: 删除</span>
        <span>Ctrl+Z: 撤销</span>
        <span>Ctrl+Y: 重做</span>
        <span>Ctrl+D: 复制</span>
      </div>
    </div>
  );
}
