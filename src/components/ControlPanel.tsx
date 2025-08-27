import React from 'react'
import { Settings, Move, Palette, Type as TypeIcon, Maximize } from 'lucide-react'
import { UIElement, CanvasSize } from '../types/ui'

interface ControlPanelProps {
  selectedElement: UIElement | null
  onUpdateElement: (id: string, updates: Partial<UIElement>) => void
  canvasSize: CanvasSize
  onCanvasSizeChange: (size: CanvasSize) => void
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedElement,
  onUpdateElement,
  canvasSize,
  onCanvasSizeChange
}) => {
  const handleElementUpdate = (field: keyof UIElement, value: any) => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { [field]: value })
    }
  }

  const commonPresets = {
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280', '#000000'],
    sizes: [
      { width: 800, height: 600, name: '800×600' },
      { width: 1024, height: 768, name: '1024×768' },
      { width: 1280, height: 720, name: '1280×720' },
      { width: 1920, height: 1080, name: '1920×1080' },
    ]
  }

  return (
    <div className="space-y-6">
      {/* 画布设置 */}
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Maximize className="w-4 h-4 text-gray-600" />
          <h4 className="font-medium text-gray-800">画布设置</h4>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">宽度</label>
              <input
                type="number"
                value={canvasSize.width}
                onChange={(e) => onCanvasSizeChange({ ...canvasSize, width: parseInt(e.target.value) || 800 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">高度</label>
              <input
                type="number"
                value={canvasSize.height}
                onChange={(e) => onCanvasSizeChange({ ...canvasSize, height: parseInt(e.target.value) || 600 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">常用尺寸</label>
            <div className="grid grid-cols-2 gap-1">
              {commonPresets.sizes.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onCanvasSizeChange({ width: preset.width, height: preset.height })}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedElement ? (
        <>
          {/* 位置和尺寸 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Move className="w-4 h-4 text-gray-600" />
              <h4 className="font-medium text-gray-800">位置和尺寸</h4>
            </div>
            <div className="mb-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
              💡 透明导出尺寸: {selectedElement.width}×{selectedElement.height}px (无阴影透明背景)
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">X坐标</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.x)}
                    onChange={(e) => handleElementUpdate('x', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Y坐标</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.y)}
                    onChange={(e) => handleElementUpdate('y', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">宽度</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.width)}
                    onChange={(e) => handleElementUpdate('width', parseFloat(e.target.value) || 1)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">高度</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.height)}
                    onChange={(e) => handleElementUpdate('height', parseFloat(e.target.value) || 1)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">旋转角度</label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={selectedElement.rotation}
                  onChange={(e) => handleElementUpdate('rotation', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center">{selectedElement.rotation}°</div>
              </div>
            </div>
          </div>

          {/* 外观设置 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Palette className="w-4 h-4 text-gray-600" />
              <h4 className="font-medium text-gray-800">外观</h4>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">背景颜色</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={selectedElement.backgroundColor}
                    onChange={(e) => handleElementUpdate('backgroundColor', e.target.value)}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedElement.backgroundColor}
                    onChange={(e) => handleElementUpdate('backgroundColor', e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="grid grid-cols-8 gap-1 mt-2">
                  {commonPresets.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleElementUpdate('backgroundColor', color)}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">圆角半径</label>
                  <input
                    type="number"
                    value={selectedElement.borderRadius}
                    onChange={(e) => handleElementUpdate('borderRadius', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">透明度</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedElement.opacity}
                    onChange={(e) => handleElementUpdate('opacity', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">边框宽度</label>
                  <input
                    type="number"
                    value={selectedElement.borderWidth}
                    onChange={(e) => handleElementUpdate('borderWidth', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">边框颜色</label>
                  <input
                    type="color"
                    value={selectedElement.borderColor}
                    onChange={(e) => handleElementUpdate('borderColor', e.target.value)}
                    className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 文字设置 */}
          {(selectedElement.type === 'button' || selectedElement.type === 'text') && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <TypeIcon className="w-4 h-4 text-gray-600" />
                <h4 className="font-medium text-gray-800">文字</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">文本内容</label>
                  <input
                    type="text"
                    value={selectedElement.text || ''}
                    onChange={(e) => handleElementUpdate('text', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">字体大小</label>
                    <input
                      type="number"
                      value={selectedElement.fontSize}
                      onChange={(e) => handleElementUpdate('fontSize', parseInt(e.target.value) || 12)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">文字颜色</label>
                    <input
                      type="color"
                      value={selectedElement.textColor}
                      onChange={(e) => handleElementUpdate('textColor', e.target.value)}
                      className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">字体粗细</label>
                    <select
                      value={selectedElement.fontWeight || 'normal'}
                      onChange={(e) => handleElementUpdate('fontWeight', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="normal">正常</option>
                      <option value="bold">粗体</option>
                      <option value="100">极细</option>
                      <option value="300">细</option>
                      <option value="500">中等</option>
                      <option value="700">粗</option>
                      <option value="900">极粗</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">对齐方式</label>
                    <select
                      value={selectedElement.textAlign || 'center'}
                      onChange={(e) => handleElementUpdate('textAlign', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="left">左对齐</option>
                      <option value="center">居中</option>
                      <option value="right">右对齐</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-4 text-center text-gray-500">
          <Settings className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">选择一个元素进行编辑</p>
        </div>
      )}
    </div>
  )
}

export default ControlPanel
