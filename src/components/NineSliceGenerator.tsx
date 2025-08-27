import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Image as ImageIcon, Grid3x3, Settings, X, RotateCcw, Eye, Move } from 'lucide-react';

interface NineSliceGeneratorProps {
  onClose: () => void;
}

interface SliceLines {
  vertical1: number;   // 左边垂直线位置 (像素)
  vertical2: number;   // 右边垂直线位置 (像素)
  horizontal1: number; // 上边水平线位置 (像素)  
  horizontal2: number; // 下边水平线位置 (像素)
}

interface NineSliceData {
  image: HTMLImageElement;
  lines: SliceLines;
}

const NineSliceGenerator: React.FC<NineSliceGeneratorProps> = ({ onClose }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [nineSliceData, setNineSliceData] = useState<NineSliceData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [targetSize, setTargetSize] = useState({ width: 300, height: 200 });
  const [previewResult, setPreviewResult] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<'v1' | 'v2' | 'h1' | 'h2' | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // 处理文件上传
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件！');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setImagePreview(imageUrl);
      
      // 创建图像对象
      const img = new Image();
      img.onload = () => {
        // 初始化切分线位置（三等分）
        const lines: SliceLines = {
          vertical1: Math.floor(img.width * 0.33),
          vertical2: Math.floor(img.width * 0.67),
          horizontal1: Math.floor(img.height * 0.33),
          horizontal2: Math.floor(img.height * 0.67)
        };
        
        setNineSliceData({ image: img, lines });
        setTargetSize({ width: img.width, height: img.height });
        drawNineSliceEditor(img, lines);
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  // 绘制九宫格编辑器
  const drawNineSliceEditor = useCallback((img: HTMLImageElement, lines: SliceLines) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    canvas.width = img.width;
    canvas.height = img.height;

    // 绘制原始图片
    ctx.drawImage(img, 0, 0, img.width, img.height);

    // 绘制切分线
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // 垂直线
    ctx.beginPath();
    ctx.moveTo(lines.vertical1, 0);
    ctx.lineTo(lines.vertical1, img.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(lines.vertical2, 0);
    ctx.lineTo(lines.vertical2, img.height);
    ctx.stroke();

    // 水平线
    ctx.beginPath();
    ctx.moveTo(0, lines.horizontal1);
    ctx.lineTo(img.width, lines.horizontal1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, lines.horizontal2);
    ctx.lineTo(img.width, lines.horizontal2);
    ctx.stroke();

    // 绘制拖拽手柄
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff4444';
    const handleSize = 8;

    // 垂直线手柄
    ctx.fillRect(lines.vertical1 - handleSize/2, img.height/2 - handleSize/2, handleSize, handleSize);
    ctx.fillRect(lines.vertical2 - handleSize/2, img.height/2 - handleSize/2, handleSize, handleSize);

    // 水平线手柄
    ctx.fillRect(img.width/2 - handleSize/2, lines.horizontal1 - handleSize/2, handleSize, handleSize);
    ctx.fillRect(img.width/2 - handleSize/2, lines.horizontal2 - handleSize/2, handleSize, handleSize);

    // 绘制区域标识
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    const regions = [
      { x: lines.vertical1/2, y: lines.horizontal1/2, text: '角' },
      { x: (lines.vertical1 + lines.vertical2)/2, y: lines.horizontal1/2, text: '←→' },
      { x: (lines.vertical2 + img.width)/2, y: lines.horizontal1/2, text: '角' },
      { x: lines.vertical1/2, y: (lines.horizontal1 + lines.horizontal2)/2, text: '↑↓' },
      { x: (lines.vertical1 + lines.vertical2)/2, y: (lines.horizontal1 + lines.horizontal2)/2, text: '↔↕' },
      { x: (lines.vertical2 + img.width)/2, y: (lines.horizontal1 + lines.horizontal2)/2, text: '↑↓' },
      { x: lines.vertical1/2, y: (lines.horizontal2 + img.height)/2, text: '角' },
      { x: (lines.vertical1 + lines.vertical2)/2, y: (lines.horizontal2 + img.height)/2, text: '←→' },
      { x: (lines.vertical2 + img.width)/2, y: (lines.horizontal2 + img.height)/2, text: '角' },
    ];

    regions.forEach(region => {
      ctx.fillText(region.text, region.x, region.y);
    });

  }, []);

  // 处理鼠标事件
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!nineSliceData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const { lines } = nineSliceData;
    const tolerance = 15; // 拖拽容忍度

    // 检测点击在哪个手柄附近
    if (Math.abs(x - lines.vertical1) < tolerance) {
      setIsDragging(true);
      setDragTarget('v1');
    } else if (Math.abs(x - lines.vertical2) < tolerance) {
      setIsDragging(true);
      setDragTarget('v2');
    } else if (Math.abs(y - lines.horizontal1) < tolerance) {
      setIsDragging(true);
      setDragTarget('h1');
    } else if (Math.abs(y - lines.horizontal2) < tolerance) {
      setIsDragging(true);
      setDragTarget('h2');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragTarget || !nineSliceData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const img = nineSliceData.image;
    const newLines = { ...nineSliceData.lines };

    // 更新对应的线位置
    switch (dragTarget) {
      case 'v1':
        newLines.vertical1 = Math.max(10, Math.min(x, newLines.vertical2 - 10));
        break;
      case 'v2':
        newLines.vertical2 = Math.max(newLines.vertical1 + 10, Math.min(x, img.width - 10));
        break;
      case 'h1':
        newLines.horizontal1 = Math.max(10, Math.min(y, newLines.horizontal2 - 10));
        break;
      case 'h2':
        newLines.horizontal2 = Math.max(newLines.horizontal1 + 10, Math.min(y, img.height - 10));
        break;
    }

    setNineSliceData({ ...nineSliceData, lines: newLines });
    drawNineSliceEditor(img, newLines);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
  };

  // 生成九宫格拉伸图片
  const generateNineSliceImage = useCallback(async () => {
    if (!nineSliceData) return;

    setIsProcessing(true);
    
    try {
      const { image: img, lines } = nineSliceData;
      const { width: targetWidth, height: targetHeight } = targetSize;

      // 创建输出画布
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = targetWidth;
      outputCanvas.height = targetHeight;
      const ctx = outputCanvas.getContext('2d');
      
      if (!ctx) return;

      // 计算各个区域的源位置和目标位置
      const srcRegions = {
        // 源区域 [x, y, width, height]
        topLeft: [0, 0, lines.vertical1, lines.horizontal1],
        topCenter: [lines.vertical1, 0, lines.vertical2 - lines.vertical1, lines.horizontal1],
        topRight: [lines.vertical2, 0, img.width - lines.vertical2, lines.horizontal1],
        
        middleLeft: [0, lines.horizontal1, lines.vertical1, lines.horizontal2 - lines.horizontal1],
        middleCenter: [lines.vertical1, lines.horizontal1, lines.vertical2 - lines.vertical1, lines.horizontal2 - lines.horizontal1],
        middleRight: [lines.vertical2, lines.horizontal1, img.width - lines.vertical2, lines.horizontal2 - lines.horizontal1],
        
        bottomLeft: [0, lines.horizontal2, lines.vertical1, img.height - lines.horizontal2],
        bottomCenter: [lines.vertical1, lines.horizontal2, lines.vertical2 - lines.vertical1, img.height - lines.horizontal2],
        bottomRight: [lines.vertical2, lines.horizontal2, img.width - lines.vertical2, img.height - lines.horizontal2]
      };

      // 计算目标区域的位置和尺寸
      const leftWidth = lines.vertical1;
      const rightWidth = img.width - lines.vertical2;
      const centerWidth = targetWidth - leftWidth - rightWidth;
      
      const topHeight = lines.horizontal1;
      const bottomHeight = img.height - lines.horizontal2;
      const middleHeight = targetHeight - topHeight - bottomHeight;

      const destRegions = {
        // 目标区域 [x, y, width, height]
        topLeft: [0, 0, leftWidth, topHeight],
        topCenter: [leftWidth, 0, centerWidth, topHeight],
        topRight: [leftWidth + centerWidth, 0, rightWidth, topHeight],
        
        middleLeft: [0, topHeight, leftWidth, middleHeight],
        middleCenter: [leftWidth, topHeight, centerWidth, middleHeight],
        middleRight: [leftWidth + centerWidth, topHeight, rightWidth, middleHeight],
        
        bottomLeft: [0, topHeight + middleHeight, leftWidth, bottomHeight],
        bottomCenter: [leftWidth, topHeight + middleHeight, centerWidth, bottomHeight],
        bottomRight: [leftWidth + centerWidth, topHeight + middleHeight, rightWidth, bottomHeight]
      };

      // 绘制各个区域
      Object.keys(srcRegions).forEach(key => {
        const [sx, sy, sw, sh] = (srcRegions as any)[key];
        const [dx, dy, dw, dh] = (destRegions as any)[key];
        
        ctx.drawImage(
          img,
          sx, sy, sw, sh,  // 源区域
          dx, dy, dw, dh   // 目标区域
        );
      });

      // 转换为blob并更新预览
      outputCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPreviewResult(url);
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('生成九宫格拉伸图片失败:', error);
      alert('生成失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  }, [nineSliceData, targetSize]);

  // 下载结果
  const downloadResult = () => {
    if (!previewResult) return;
    
    const a = document.createElement('a');
    a.href = previewResult;
    a.download = `${selectedImage?.name.replace(/\.[^/.]+$/, '') || 'nineslice'}_${targetSize.width}x${targetSize.height}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 重新绘制当数据更新时
  useEffect(() => {
    if (nineSliceData) {
      drawNineSliceEditor(nineSliceData.image, nineSliceData.lines);
    }
  }, [nineSliceData, drawNineSliceEditor]);

  // 文件输入处理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 拖拽处理
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  // 重置
  const reset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setNineSliceData(null);
    setPreviewResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold">九宫格拉伸生成器</h2>
            <div className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
              Nine-Slice
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* 说明信息 */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Grid3x3 className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-800 font-medium">九宫格拉伸原理</p>
                <p className="text-blue-700">
                  拖动红色分割线将图片分成9个区域：<strong>四角保持</strong>，<strong>上下横向拉伸</strong>，<strong>左右纵向拉伸</strong>，<strong>中心双向拉伸</strong>
                </p>
              </div>
            </div>
          </div>

          {/* 文件上传区域 */}
          {!imagePreview && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">拖拽图片到这里或点击上传</p>
              <p className="text-gray-500 mb-4">适合有边框、背景的UI元素</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                选择图片
              </button>
            </div>
          )}

          {/* 九宫格编辑区域 */}
          {imagePreview && nineSliceData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">九宫格编辑器</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={reset}
                    className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-1 px-3 py-1 rounded"
                  >
                    <RotateCcw className="w-4 h-4" />
                    重新选择
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 编辑区域 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Move className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium">拖拽红色线条调整分割区域</span>
                  </div>
                  
                  <div className="border border-gray-300 rounded-lg p-4 bg-white overflow-auto">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      className="cursor-crosshair max-w-full block"
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '400px', 
                        objectFit: 'contain' 
                      }}
                    />
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <p>🎯 <strong>操作提示</strong>：拖拽红色方块调整分割线位置</p>
                    <p>📐 <strong>区域说明</strong>：角=保持，←→=横向拉伸，↑↓=纵向拉伸，↔↕=双向拉伸</p>
                  </div>
                </div>

                {/* 设置和预览区域 */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">输出设置</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          目标宽度
                        </label>
                        <input
                          type="number"
                          min="50"
                          max="2000"
                          value={targetSize.width}
                          onChange={(e) => setTargetSize(prev => ({ ...prev, width: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          目标高度
                        </label>
                        <input
                          type="number"
                          min="50"
                          max="2000"
                          value={targetSize.height}
                          onChange={(e) => setTargetSize(prev => ({ ...prev, height: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={generateNineSliceImage}
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            生成中...
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            生成预览
                          </>
                        )}
                      </button>
                      
                      {previewResult && (
                        <button
                          onClick={downloadResult}
                          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          下载
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 预览结果 */}
                  {previewResult && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">拉伸结果预览</h4>
                      <div className="border border-gray-300 rounded-lg p-2 bg-white">
                        <img
                          src={previewResult}
                          alt="拉伸结果"
                          className="max-w-full max-h-48 object-contain mx-auto block"
                        />
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        尺寸: {targetSize.width} × {targetSize.height}px
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NineSliceGenerator;
