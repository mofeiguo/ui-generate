import React, { useState, useEffect } from 'react'
import { Download, Palette, Square, Type, Circle, Image, ChevronUp, ChevronDown, MoveUp, MoveDown, GripVertical, Square as NinePatchIcon } from 'lucide-react'
import UIGenerator from './components/UIGenerator'
import ControlPanel from './components/ControlPanel'
import PreviewCanvas from './components/PreviewCanvas'
import NineSliceGenerator from './components/NineSliceGenerator'
import { UIElement, UIElementType } from './types/ui'

function App() {
  const [elements, setElements] = useState<UIElement[]>([])
  const [selectedElements, setSelectedElements] = useState<UIElement[]>([])
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [showNineSliceGenerator, setShowNineSliceGenerator] = useState(false)
  
  // 向后兼容的单选元素获取器
  const selectedElement = selectedElements.length === 1 ? selectedElements[0] : null

  const addElement = (type: UIElementType) => {
    const newElement: UIElement = {
      id: Date.now().toString(),
      type,
      x: Math.random() * 300,
      y: Math.random() * 200,
      width: type === 'button' ? 120 : type === 'text' ? 200 : 150,
      height: type === 'button' ? 40 : type === 'text' ? 30 : 100,
      text: type === 'text' ? '示例文本' : type === 'button' ? '按钮' : '',
      backgroundColor: type === 'button' ? '#3b82f6' : type === 'panel' ? '#f3f4f6' : 'transparent',
      textColor: type === 'button' ? '#ffffff' : '#000000',
      borderRadius: type === 'button' ? 8 : 4,
      fontSize: type === 'button' ? 16 : type === 'text' ? 18 : 14,
      borderWidth: 1,
      borderColor: '#d1d5db',
      opacity: 1,
      rotation: 0,
    }
    setElements(prev => [...prev, newElement])
    setSelectedElements([newElement])
  }

  const updateElement = (id: string, updates: Partial<UIElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
    setSelectedElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
  }

  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id))
    setSelectedElements(prev => prev.filter(el => el.id !== id))
  }

  const duplicateElement = (element: UIElement) => {
    const newElement: UIElement = {
      ...element,
      id: Date.now().toString(),
      x: element.x + 20,
      y: element.y + 20,
    }
    setElements(prev => [...prev, newElement])
    setSelectedElements([newElement])
  }

  // 多选处理函数
  const handleElementSelect = (element: UIElement, multiSelect: boolean = false) => {
    if (multiSelect) {
      setSelectedElements(prev => {
        const isSelected = prev.some(el => el.id === element.id)
        if (isSelected) {
          return prev.filter(el => el.id !== element.id) // 取消选择
        } else {
          return [...prev, element] // 添加到选择列表
        }
      })
    } else {
      setSelectedElements([element])
    }
  }

  const clearSelection = () => {
    setSelectedElements([])
  }

  const isElementSelected = (element: UIElement) => {
    return selectedElements.some(el => el.id === element.id)
  }

  // 图层排序相关函数
  const moveElementUp = (id: string) => {
    setElements(prev => {
      const index = prev.findIndex(el => el.id === id)
      if (index > 0) {
        const newElements = [...prev]
        const temp = newElements[index]
        newElements[index] = newElements[index - 1]
        newElements[index - 1] = temp
        return newElements
      }
      return prev
    })
  }

  const moveElementDown = (id: string) => {
    setElements(prev => {
      const index = prev.findIndex(el => el.id === id)
      if (index < prev.length - 1) {
        const newElements = [...prev]
        const temp = newElements[index]
        newElements[index] = newElements[index + 1]
        newElements[index + 1] = temp
        return newElements
      }
      return prev
    })
  }

  const moveElementToTop = (id: string) => {
    setElements(prev => {
      const element = prev.find(el => el.id === id)
      if (element) {
        const newElements = prev.filter(el => el.id !== id)
        return [...newElements, element]
      }
      return prev
    })
  }

  const moveElementToBottom = (id: string) => {
    setElements(prev => {
      const element = prev.find(el => el.id === id)
      if (element) {
        const newElements = prev.filter(el => el.id !== id)
        return [element, ...newElements]
      }
      return prev
    })
  }

  // 拖拽排序函数
  const reorderElements = (fromIndex: number, toIndex: number) => {
    setElements(prev => {
      const newElements = [...prev]
      const [movedElement] = newElements.splice(fromIndex, 1)
      newElements.splice(toIndex, 0, movedElement)
      return newElements
    })
  }

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 防止在输入框中触发快捷键
      if ((event.target as HTMLElement).tagName === 'INPUT' || 
          (event.target as HTMLElement).tagName === 'TEXTAREA') {
        return
      }

      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          selectedElements.forEach(element => deleteElement(element.id))
          break
        case 'd':
        case 'D':
          if ((event.ctrlKey || event.metaKey) && selectedElements.length > 0) {
            event.preventDefault()
            selectedElements.forEach(element => duplicateElement(element))
          }
          break
        case 'Escape':
          clearSelection()
          break
        case 'a':
        case 'A':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            setSelectedElements([...elements])
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElements, elements])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* 头部导航 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-500 rounded-lg">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">UI素材生成器</h1>
                <p className="text-sm text-gray-600">专业游戏UI素材制作工具</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                画布尺寸: {canvasSize.width} × {canvasSize.height}
                {elements.length > 0 && ` | ${elements.length}个元素`}
                {selectedElements.length > 0 && ` | 已选中${selectedElements.length}个`}
              </div>
              <div className="text-xs text-gray-500">
                💡 快捷键: Delete删除 | Ctrl+D复制 | Ctrl+A全选 | Esc取消 | 新增：九宫格拉伸生成器
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* 左侧工具栏 */}
        <div className="w-80 bg-white shadow-sm border-r border-gray-200 flex flex-col">
          {/* 元素添加工具 */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">添加元素</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => addElement('button')}
                className="btn-secondary flex items-center justify-center space-x-2 py-3"
              >
                <Square className="w-4 h-4" />
                <span>按钮</span>
              </button>
              <button 
                onClick={() => addElement('text')}
                className="btn-secondary flex items-center justify-center space-x-2 py-3"
              >
                <Type className="w-4 h-4" />
                <span>文本</span>
              </button>
              <button 
                onClick={() => addElement('panel')}
                className="btn-secondary flex items-center justify-center space-x-2 py-3"
              >
                <Square className="w-4 h-4" />
                <span>面板</span>
              </button>
              <button 
                onClick={() => addElement('circle')}
                className="btn-secondary flex items-center justify-center space-x-2 py-3"
              >
                <Circle className="w-4 h-4" />
                <span>圆形</span>
              </button>
            </div>
          </div>

          {/* 九宫格拉伸工具 */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">图片工具</h3>
            <button 
              onClick={() => setShowNineSliceGenerator(true)}
              className="btn-primary w-full flex items-center justify-center space-x-2 py-3 bg-purple-600 hover:bg-purple-700"
            >
              <NinePatchIcon className="w-4 h-4" />
              <span>九宫格拉伸生成器</span>
            </button>
            <div className="text-xs text-gray-500 mt-2">
              💡 制作可拉伸的UI背景元素
            </div>
          </div>

          {/* 控制面板 */}
          <div className="flex-1 overflow-y-auto">
            <ControlPanel
              selectedElement={selectedElement}
              onUpdateElement={updateElement}
              canvasSize={canvasSize}
              onCanvasSizeChange={setCanvasSize}
            />
          </div>
        </div>

        {/* 中央预览区域 */}
        <div className="flex-1 flex flex-col">
          <PreviewCanvas
            elements={elements}
            selectedElements={selectedElements}
            onSelectElement={handleElementSelect}
            onClearSelection={clearSelection}
            onUpdateElement={updateElement}
            onDeleteElement={deleteElement}
            onDuplicateElement={duplicateElement}
            canvasSize={canvasSize}
            isElementSelected={isElementSelected}
          />
        </div>

        {/* 右侧层级面板 */}
        <div className="w-64 bg-white shadow-sm border-l border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">图层列表</h3>
              {selectedElements.length > 1 && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                  已选中 {selectedElements.length} 个
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mb-2">
              💡 拖拽图层调整顺序，编号越大层级越高
            </div>
            <div className="space-y-1">
              {elements.map((element, index) => {
                const LayerItem = ({ element, index }: { element: UIElement, index: number }) => {
                  const [isDragging, setIsDragging] = useState(false)
                  const [dragOver, setDragOver] = useState(false)

                  const handleDragStart = (e: React.DragEvent) => {
                    e.dataTransfer.setData('text/plain', index.toString())
                    setIsDragging(true)
                  }

                  const handleDragEnd = () => {
                    setIsDragging(false)
                  }

                  const handleDragOver = (e: React.DragEvent) => {
                    e.preventDefault()
                    setDragOver(true)
                  }

                  const handleDragLeave = () => {
                    setDragOver(false)
                  }

                  const handleDrop = (e: React.DragEvent) => {
                    e.preventDefault()
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
                    const toIndex = index
                    if (fromIndex !== toIndex) {
                      reorderElements(fromIndex, toIndex)
                    }
                    setDragOver(false)
                  }

                  return (
                    <div
                      key={element.id}
                      draggable
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`group relative rounded-lg transition-all duration-200 ${
                        isDragging ? 'opacity-50 scale-95' : ''
                      } ${
                        dragOver ? 'border-t-2 border-primary-500' : ''
                      } ${
                        isElementSelected(element)
                          ? 'bg-primary-100 border-2 border-primary-300' 
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center p-2">
                        {/* 拖拽手柄 */}
                        <div className="flex-shrink-0 mr-2 opacity-40 group-hover:opacity-80 cursor-grab">
                          <GripVertical className="w-4 h-4 text-gray-500" />
                        </div>
                        
                        {/* 图层内容 */}
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={(e) => handleElementSelect(element, e.ctrlKey || e.metaKey)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {element.type === 'button' && <Square className="w-4 h-4" />}
                              {element.type === 'text' && <Type className="w-4 h-4" />}
                              {element.type === 'panel' && <Square className="w-4 h-4" />}
                              {element.type === 'circle' && <Circle className="w-4 h-4" />}
                              <span className="text-sm font-medium">
                                {element.type === 'button' ? '按钮' : 
                                 element.type === 'text' ? '文本' : 
                                 element.type === 'panel' ? '面板' : '圆形'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">#{index + 1}</span>
                          </div>
                          {element.text && (
                            <div className="text-xs text-gray-600 mt-1 truncate">
                              {element.text}
                            </div>
                          )}
                        </div>

                        {/* 图层操作按钮 */}
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 ml-2">
                          <div className="flex flex-col space-y-1 bg-white border border-gray-300 p-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                moveElementUp(element.id)
                              }}
                              disabled={index === 0}
                              className="p-1 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="向前一层"
                            >
                              <ChevronUp className="w-3 h-3 text-gray-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                moveElementDown(element.id)
                              }}
                              disabled={index === elements.length - 1}
                              className="p-1 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="向后一层"
                            >
                              <ChevronDown className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 快速操作菜单 */}
                      {isElementSelected(element) && selectedElements.length === 1 && (
                        <div className="absolute right-2 top-2 bg-white border border-gray-300 flex">
                          <button
                            onClick={() => moveElementToTop(element.id)}
                            className="p-1 hover:bg-gray-100 text-xs"
                            title="置于顶层"
                          >
                            <MoveUp className="w-3 h-3 text-gray-600" />
                          </button>
                          <div className="w-px bg-gray-300"></div>
                          <button
                            onClick={() => moveElementToBottom(element.id)}
                            className="p-1 hover:bg-gray-100 text-xs"
                            title="置于底层"
                          >
                            <MoveDown className="w-3 h-3 text-gray-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                }
                return <LayerItem key={element.id} element={element} index={index} />
              })}
              {elements.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Image className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm">暂无元素</p>
                  <p className="text-xs">点击左侧工具添加UI元素</p>
                  <p className="text-xs mt-2">💡 Ctrl+点击可多选</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 九宫格拉伸生成器弹窗 */}
      {showNineSliceGenerator && (
        <NineSliceGenerator 
          onClose={() => setShowNineSliceGenerator(false)}
        />
      )}
    </div>
  )
}

export default App
