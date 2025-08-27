import React, { useRef, useEffect, useState } from 'react'
import { Download, Copy, Trash2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import { UIElement, CanvasSize } from '../types/ui'
import UIElementRenderer from './UIElementRenderer'

interface PreviewCanvasProps {
  elements: UIElement[]
  selectedElements: UIElement[]
  onSelectElement: (element: UIElement, multiSelect?: boolean) => void
  onClearSelection: () => void
  onUpdateElement: (id: string, updates: Partial<UIElement>) => void
  onDeleteElement: (id: string) => void
  onDuplicateElement: (element: UIElement) => void
  canvasSize: CanvasSize
  isElementSelected: (element: UIElement) => boolean
}

const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  elements,
  selectedElements,
  onSelectElement,
  onClearSelection,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  canvasSize,
  isElementSelected
}) => {
  // 向后兼容的单选元素获取器
  const selectedElement = selectedElements.length === 1 ? selectedElements[0] : null
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isExporting, setIsExporting] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string>('')
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const handleExportSelectedPNG = async (options = { scale: 1, backgroundColor: '#ffffff', transparent: false, exactSize: false, removeShadow: true }) => {
    if (!canvasRef.current || selectedElements.length === 0) return
    
    setIsExporting(true)
    try {
      // 计算选中元素的边界框
      let minX = Math.min(...selectedElements.map(el => el.x))
      let minY = Math.min(...selectedElements.map(el => el.y))
      let maxX = Math.max(...selectedElements.map(el => el.x + el.width))
      let maxY = Math.max(...selectedElements.map(el => el.y + el.height))
      
      // 如果需要精确尺寸，不添加padding
      const padding = options.exactSize ? 0 : 10
      const originalMinX = minX
      const originalMinY = minY
      
      minX = Math.max(0, minX - padding)
      minY = Math.max(0, minY - padding)
      maxX = Math.min(canvasSize.width, maxX + padding)
      maxY = Math.min(canvasSize.height, maxY + padding)
      
      const cropWidth = maxX - minX
      const cropHeight = maxY - minY

      // 如果是单个元素且需要精确尺寸，使用元素的实际尺寸
      let exportWidth = cropWidth
      let exportHeight = cropHeight
      
      if (options.exactSize && selectedElements.length === 1) {
        exportWidth = selectedElements[0].width
        exportHeight = selectedElements[0].height
      }

      // 创建临时画布容器 - 确保完全透明的背景
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '-9999px'
      tempContainer.style.width = `${exportWidth}px`
      tempContainer.style.height = `${exportHeight}px`
      tempContainer.style.backgroundColor = 'transparent' // 始终设置为透明，稍后通过html2canvas设置背景
      tempContainer.style.overflow = 'hidden'
      document.body.appendChild(tempContainer)

      // 找到画布中对应的真实DOM元素并复制
      const canvasElements = canvasRef.current.querySelectorAll('[data-element-id]') as NodeListOf<HTMLElement>
      
      selectedElements.forEach(element => {
        // 查找对应的DOM元素
        let sourceElement: HTMLElement | null = null
        canvasElements.forEach(canvasEl => {
          if (canvasEl.getAttribute('data-element-id') === element.id) {
            sourceElement = canvasEl
          }
        })

        // 如果没有找到DOM元素，则手动创建
        if (!sourceElement) {
          sourceElement = createElementDOM(element, options.removeShadow)
        }

        // 克隆元素
        const clonedElement = sourceElement.cloneNode(true) as HTMLElement
        clonedElement.style.position = 'absolute'
        
        // 移除所有选择指示器和控制按钮
        const selectionIndicators = clonedElement.querySelectorAll('.selection-indicator, .element-controls')
        selectionIndicators.forEach(indicator => indicator.remove())
        
        // 如果需要移除阴影，则移除所有子元素的box-shadow
        if (options.removeShadow) {
          const removeBoxShadow = (el: HTMLElement) => {
            el.style.boxShadow = 'none'
            // 递归处理所有子元素
            Array.from(el.children).forEach(child => {
              if (child instanceof HTMLElement) {
                removeBoxShadow(child)
              }
            })
          }
          removeBoxShadow(clonedElement)
        }
        
        // 计算元素在导出容器中的位置
        if (options.exactSize && selectedElements.length === 1) {
          // 单元素精确尺寸导出，元素占满整个容器
          clonedElement.style.left = '0px'
          clonedElement.style.top = '0px'
        } else {
          // 多元素或非精确尺寸导出，保持相对位置
          const offsetX = options.exactSize ? 0 : padding
          const offsetY = options.exactSize ? 0 : padding
          clonedElement.style.left = `${element.x - minX + offsetX}px`
          clonedElement.style.top = `${element.y - minY + offsetY}px`
        }
        
        clonedElement.style.width = `${element.width}px`
        clonedElement.style.height = `${element.height}px`
        clonedElement.style.transform = `rotate(${element.rotation}deg)`
        clonedElement.style.zIndex = '1'
        
        tempContainer.appendChild(clonedElement)
      })

      // 使用html2canvas导出，确保背景设置正确
      const canvas = await html2canvas(tempContainer, {
        width: exportWidth,
        height: exportHeight,
        scale: options.scale,
        backgroundColor: options.transparent ? null : options.backgroundColor,
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 15000,
        ignoreElements: (element) => {
          // 忽略选择指示器和控制按钮
          return element.classList.contains('selection-indicator') || 
                 element.classList.contains('element-controls')
        }
      })

      // 清理临时容器
      document.body.removeChild(tempContainer)

      // 下载图片
      const link = document.createElement('a')
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      const actualWidth = Math.round(exportWidth * options.scale)
      const actualHeight = Math.round(exportHeight * options.scale)
      link.download = `ui-selected-${selectedElements.length}-${actualWidth}x${actualHeight}-${timestamp}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log(`成功导出${selectedElements.length}个选中元素的PNG图片 - 尺寸: ${actualWidth}x${actualHeight}`)
    } catch (error) {
      console.error('选择性导出失败:', error)
      alert('选择性导出失败，请重试。')
    } finally {
      setIsExporting(false)
    }
  }

  // 创建元素DOM的辅助函数
  const createElementDOM = (element: UIElement, removeShadow: boolean = true): HTMLElement => {
    const elementDiv = document.createElement('div')
    elementDiv.setAttribute('data-element-id', element.id)
    elementDiv.style.position = 'absolute'
    elementDiv.style.width = `${element.width}px`
    elementDiv.style.height = `${element.height}px`
    
            // 使用UIElementRenderer的渲染逻辑
        const rendererDiv = document.createElement('div')
        rendererDiv.innerHTML = getElementHTML(element, removeShadow)
        elementDiv.appendChild(rendererDiv)
    
    return elementDiv
  }

  const getElementHTML = (element: UIElement, removeShadow: boolean = true) => {
    // 复制UIElementRenderer的完整渲染逻辑
    const getElementStyle = () => {
      const baseStyle: any = {
        width: '100%',
        height: '100%',
        backgroundColor: element.backgroundColor,
        borderRadius: element.borderRadius,
        border: element.borderWidth > 0 ? `${element.borderWidth}px solid ${element.borderColor}` : 'none',
        opacity: element.opacity,
        display: 'flex',
        alignItems: 'center',
        justifyContent: element.textAlign === 'left' ? 'flex-start' : 
                       element.textAlign === 'right' ? 'flex-end' : 'center',
        padding: element.type === 'button' ? '8px 16px' : element.type === 'text' ? '4px' : '8px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }

      // 添加渐变背景
      if (element.gradient) {
        if (element.gradient.type === 'linear') {
          const direction = element.gradient.direction || 0
          baseStyle.background = `linear-gradient(${direction}deg, ${element.gradient.colors.join(', ')})`
        } else {
          baseStyle.background = `radial-gradient(${element.gradient.colors.join(', ')})`
        }
      }

      // 添加阴影效果 - 根据导出选项决定是否包含阴影
      if (!removeShadow) {
        if (element.boxShadow) {
          baseStyle.boxShadow = element.boxShadow
        } else if (element.type === 'button') {
          baseStyle.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
        }
      }

      return baseStyle
    }

    const getTextStyle = () => {
      return {
        fontSize: element.fontSize,
        color: element.textColor,
        fontWeight: element.fontWeight || 'normal',
        textAlign: element.textAlign || 'center',
        width: '100%',
        lineHeight: 1.2,
        wordBreak: 'break-word',
        display: 'block'
      }
    }

    const styleToString = (styleObj: any) => {
      return Object.entries(styleObj).map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
        // 处理数值类型的CSS属性
        if (typeof value === 'number' && ['opacity', 'z-index', 'line-height'].includes(cssKey)) {
          return `${cssKey}: ${value}`
        } else if (typeof value === 'number') {
          return `${cssKey}: ${value}px`
        }
        // 处理特殊的CSS属性值
        if (key === 'alignItems' && value === 'center') {
          return 'align-items: center'
        }
        if (key === 'justifyContent') {
          if (value === 'flex-start') return 'justify-content: flex-start'
          if (value === 'flex-end') return 'justify-content: flex-end'
          if (value === 'center') return 'justify-content: center'
          return `justify-content: ${value}`
        }
        if (key === 'boxSizing') {
          return `box-sizing: ${value}`
        }
        if (key === 'wordBreak') {
          return `word-break: ${value}`
        }
        if (key === 'textAlign') {
          return `text-align: ${value}`
        }
        if (key === 'flex') {
          return `flex: ${value}`
        }
        return `${cssKey}: ${value}`
      }).join('; ')
    }

    const elementStyle = getElementStyle()
    const textStyle = getTextStyle()
    
    switch (element.type) {
      case 'button':
        return `
          <div style="${styleToString(elementStyle)}">
            <span style="${styleToString({...textStyle, flex: '1', textAlign: 'center'})}">
              ${element.text || '按钮'}
            </span>
          </div>`

      case 'text':
        const textElementStyle = {
          ...elementStyle,
          backgroundColor: element.backgroundColor === 'transparent' ? 'transparent' : element.backgroundColor,
          border: 'none',
          boxShadow: 'none',
          padding: '0'
        }
        return `
          <div style="${styleToString(textElementStyle)}">
            <span style="${styleToString(textStyle)}">
              ${element.text || '文本'}
            </span>
          </div>`

      case 'panel':
        return `
          <div style="${styleToString(elementStyle)}">
            ${element.text ? `<span style="${styleToString(textStyle)}">${element.text}</span>` : ''}
          </div>`

      case 'circle':
        const circleStyle = { ...elementStyle, borderRadius: '50%' }
        return `
          <div style="${styleToString(circleStyle)}">
            ${element.text ? `<span style="${styleToString(textStyle)}">${element.text}</span>` : ''}
          </div>`

      default:
        return `<div style="${styleToString(elementStyle)}"></div>`
    }
  }

  const handleExportPNG = async (options = { scale: 1, backgroundColor: '#ffffff', transparent: false }) => {
    if (!canvasRef.current) return
    
    setIsExporting(true)
    try {
      // 临时隐藏选择框、控制按钮、网格和标尺
      const hideElements = canvasRef.current.querySelectorAll('.selection-indicator, .element-controls')
      const gridElement = canvasRef.current.querySelector('div[style*="backgroundImage"]')
      const infoElement = canvasRef.current.querySelector('.absolute.bottom-2.right-2')
      
      hideElements.forEach(el => {
        (el as HTMLElement).style.display = 'none'
      })
      
      // 临时隐藏网格背景
      if (gridElement) {
        (gridElement as HTMLElement).style.opacity = '0'
      }
      
      // 临时隐藏画布信息
      if (infoElement) {
        (infoElement as HTMLElement).style.display = 'none'
      }

      const canvas = await html2canvas(canvasRef.current, {
        width: canvasSize.width,
        height: canvasSize.height,
        scale: options.scale,
        backgroundColor: options.transparent ? null : options.backgroundColor,
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 15000,
        removeContainer: false
      })

      // 恢复显示所有元素
      hideElements.forEach(el => {
        (el as HTMLElement).style.display = ''
      })
      
      if (gridElement) {
        (gridElement as HTMLElement).style.opacity = ''
      }
      
      if (infoElement) {
        (infoElement as HTMLElement).style.display = ''
      }

      // 创建下载链接
      const link = document.createElement('a')
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      const actualWidth = Math.round(canvasSize.width * options.scale)
      const actualHeight = Math.round(canvasSize.height * options.scale)
      link.download = `ui-canvas-${actualWidth}x${actualHeight}-${timestamp}.png`
      
      // 生成高质量PNG
      link.href = canvas.toDataURL('image/png', 1.0)
      
      // 自动下载
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log(`成功导出画布PNG图片 - 尺寸: ${actualWidth}x${actualHeight}`)
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败，请重试。可能是由于元素过多或画布过大导致的。')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClearSelection()
    }
  }

  const handleElementMouseDown = (e: React.MouseEvent, element: UIElement) => {
    e.preventDefault()
    e.stopPropagation()
    
    const multiSelect = e.ctrlKey || e.metaKey
    
    // 如果是多选模式或元素未被选中，则执行选择操作
    if (multiSelect || !isElementSelected(element)) {
      onSelectElement(element, multiSelect)
    }
    
    setIsDragging(true)
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left - element.x,
        y: e.clientY - rect.top - element.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // 处理拖拽移动
    if (isDragging && selectedElement && !isResizing) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const newX = e.clientX - rect.left - dragStart.x
        const newY = e.clientY - rect.top - dragStart.y
        
        // 限制在画布范围内
        const clampedX = Math.max(0, Math.min(newX, canvasSize.width - selectedElement.width))
        const clampedY = Math.max(0, Math.min(newY, canvasSize.height - selectedElement.height))
        
        onUpdateElement(selectedElement.id, { x: clampedX, y: clampedY })
      }
    }
    
    // 处理调整大小
    if (isResizing) {
      handleResizeMouseMove(e)
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!selectedElement) return
    
    setIsResizing(true)
    setResizeHandle(handle)
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: selectedElement.width,
        height: selectedElement.height
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle('')
  }

  const handleResizeMouseMove = (e: React.MouseEvent) => {
    if (!isResizing || !selectedElement || !resizeHandle) return

    const deltaX = e.clientX - resizeStart.x
    const deltaY = e.clientY - resizeStart.y
    
    let newWidth = resizeStart.width
    let newHeight = resizeStart.height
    let newX = selectedElement.x
    let newY = selectedElement.y

    switch (resizeHandle) {
      case 'se': // 右下角
        newWidth = Math.max(20, resizeStart.width + deltaX)
        newHeight = Math.max(20, resizeStart.height + deltaY)
        break
      case 'sw': // 左下角
        newWidth = Math.max(20, resizeStart.width - deltaX)
        newHeight = Math.max(20, resizeStart.height + deltaY)
        newX = selectedElement.x + (resizeStart.width - newWidth)
        break
      case 'ne': // 右上角
        newWidth = Math.max(20, resizeStart.width + deltaX)
        newHeight = Math.max(20, resizeStart.height - deltaY)
        newY = selectedElement.y + (resizeStart.height - newHeight)
        break
      case 'nw': // 左上角
        newWidth = Math.max(20, resizeStart.width - deltaX)
        newHeight = Math.max(20, resizeStart.height - deltaY)
        newX = selectedElement.x + (resizeStart.width - newWidth)
        newY = selectedElement.y + (resizeStart.height - newHeight)
        break
      case 'n': // 上边
        newHeight = Math.max(20, resizeStart.height - deltaY)
        newY = selectedElement.y + (resizeStart.height - newHeight)
        break
      case 's': // 下边
        newHeight = Math.max(20, resizeStart.height + deltaY)
        break
      case 'w': // 左边
        newWidth = Math.max(20, resizeStart.width - deltaX)
        newX = selectedElement.x + (resizeStart.width - newWidth)
        break
      case 'e': // 右边
        newWidth = Math.max(20, resizeStart.width + deltaX)
        break
    }

    // 限制在画布范围内
    newX = Math.max(0, Math.min(newX, canvasSize.width - newWidth))
    newY = Math.max(0, Math.min(newY, canvasSize.height - newHeight))
    newWidth = Math.min(newWidth, canvasSize.width - newX)
    newHeight = Math.min(newHeight, canvasSize.height - newY)

    onUpdateElement(selectedElement.id, { 
      x: newX, 
      y: newY, 
      width: newWidth, 
      height: newHeight 
    })
  }

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mouseup', handleMouseUp)
      return () => document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing])

  return (
    <div className="flex-1 p-6 bg-gray-100 relative">
      {/* 工具栏 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          元素数量: {elements.length}
          {selectedElements.length > 0 && ` | 已选中${selectedElements.length}个`}
          {/* 显示导出尺寸预览 */}
          {selectedElements.length > 0 && (
            <div className="text-xs text-blue-600 mt-1">
              {selectedElements.length === 1 ? (
                `透明导出尺寸: ${selectedElements[0].width}×${selectedElements[0].height}px (无阴影透明背景)`
              ) : (
                (() => {
                  const minX = Math.min(...selectedElements.map(el => el.x))
                  const minY = Math.min(...selectedElements.map(el => el.y))
                  const maxX = Math.max(...selectedElements.map(el => el.x + el.width))
                  const maxY = Math.max(...selectedElements.map(el => el.y + el.height))
                  return `组合透明导出: ${maxX - minX}×${maxY - minY}px`
                })()
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* 选择性导出按钮 */}
          {selectedElements.length > 0 && (
            <>
              <div className="h-6 border-l border-gray-300"></div>
              <button
                onClick={() => handleExportSelectedPNG({ scale: 1, backgroundColor: '#ffffff', transparent: true, exactSize: true, removeShadow: true })}
                disabled={isExporting}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                title="导出选中元素，透明背景，无阴影，1倍分辨率"
              >
                <Download className="w-4 h-4" />
                <span>透明导出</span>
              </button>
              <button
                onClick={() => handleExportSelectedPNG({ scale: 2, backgroundColor: '#ffffff', transparent: true, exactSize: true, removeShadow: true })}
                disabled={isExporting}
                className="bg-orange-400 hover:bg-orange-500 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
                title="导出选中元素，透明背景，无阴影，2倍分辨率"
              >
                <Download className="w-4 h-4" />
                <span>透明2x</span>
              </button>
              <div className="h-6 border-l border-gray-300"></div>
            </>
          )}
          
          {/* 画布导出按钮 */}
          <button
            onClick={() => handleExportPNG({ scale: 1, backgroundColor: '#ffffff', transparent: false })}
            disabled={isExporting}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? '导出中...' : '画布导出'}</span>
          </button>
        </div>
      </div>

      {/* 画布区域 */}
      <div className="flex justify-center items-start">
        <div className="relative shadow-lg">
          <div
            ref={canvasRef}
            className="relative bg-white border-2 border-gray-300 overflow-hidden"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              cursor: isDragging ? 'grabbing' : 'default'
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
          >
            {/* 网格背景 */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #000 1px, transparent 1px),
                  linear-gradient(to bottom, #000 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            />

            {/* 渲染UI元素 */}
            {elements.map((element, index) => (
              <div
                key={element.id}
                data-element-id={element.id}
                className="absolute group"
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  transform: `rotate(${element.rotation}deg)`,
                  cursor: isDragging && selectedElement?.id === element.id ? 'grabbing' : 'grab',
                  zIndex: index + 1
                }}
                onMouseDown={(e) => handleElementMouseDown(e, element)}
              >
                <UIElementRenderer element={element} />
                
                {/* 选择指示器 */}
                {isElementSelected(element) && (
                  <div className="selection-indicator absolute -inset-0.5" style={{ zIndex: 9999 }}>
                    {/* 简洁边框效果 */}
                    <div className={`absolute inset-0 border-2 ${
                      selectedElements.length > 1 
                        ? 'border-orange-500' 
                        : 'border-blue-500'
                    }`}>
                    </div>
                    
                    {/* 只在单选时显示调整手柄 */}
                    {selectedElements.length === 1 && selectedElement?.id === element.id && (
                      <>
                        {/* 角落调整手柄 */}
                        <div 
                          className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-white border-2 border-blue-500 cursor-se-resize hover:bg-blue-50"
                          onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
                          title="拖拽调整大小"
                        ></div>
                        <div 
                          className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-white border-2 border-blue-500 cursor-nw-resize hover:bg-blue-50"
                          onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
                          title="拖拽调整大小"
                        ></div>
                        <div 
                          className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-white border-2 border-blue-500 cursor-ne-resize hover:bg-blue-50"
                          onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
                          title="拖拽调整大小"
                        ></div>
                        <div 
                          className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-white border-2 border-blue-500 cursor-sw-resize hover:bg-blue-50"
                          onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
                          title="拖拽调整大小"
                        ></div>
                        
                        {/* 边缘调整手柄 */}
                        <div 
                          className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 cursor-n-resize hover:bg-blue-50"
                          onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
                          title="拖拽调整高度"
                        ></div>
                        <div 
                          className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 cursor-s-resize hover:bg-blue-50"
                          onMouseDown={(e) => handleResizeMouseDown(e, 's')}
                          title="拖拽调整高度"
                        ></div>
                        <div 
                          className="absolute -left-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 cursor-w-resize hover:bg-blue-50"
                          onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
                          title="拖拽调整宽度"
                        ></div>
                        <div 
                          className="absolute -right-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 cursor-e-resize hover:bg-blue-50"
                          onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
                          title="拖拽调整宽度"
                        ></div>
                      </>
                    )}
                    
                    {/* 多选标识 */}
                    {selectedElements.length > 1 && (
                      <div className="absolute -top-6 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                        {selectedElements.findIndex(el => el.id === element.id) + 1}
                      </div>
                    )}
                  </div>
                )}

                {/* 元素控制按钮 - 只在单选时显示 */}
                {selectedElements.length === 1 && selectedElement?.id === element.id && (
                  <div className="element-controls absolute -top-8 left-0 flex space-x-1" style={{ zIndex: 9999 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDuplicateElement(element)
                      }}
                      className="p-1 bg-white border border-blue-500 hover:bg-blue-50"
                      title="复制元素"
                    >
                      <Copy className="w-3 h-3 text-blue-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteElement(element.id)
                      }}
                      className="p-1 bg-white border border-red-500 hover:bg-red-50"
                      title="删除元素"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* 画布信息 */}
            <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
              {canvasSize.width} × {canvasSize.height}
            </div>
          </div>

          {/* 画布边缘标尺 */}
          <div className="absolute -top-6 left-0 right-0 h-6 bg-gray-200 border-b border-gray-300">
            {Array.from({ length: Math.ceil(canvasSize.width / 50) }, (_, i) => (
              <div
                key={i}
                className="absolute text-xs text-gray-500"
                style={{ left: i * 50, top: 2 }}
              >
                {i * 50}
              </div>
            ))}
          </div>
          <div className="absolute -left-6 top-0 bottom-0 w-6 bg-gray-200 border-r border-gray-300">
            {Array.from({ length: Math.ceil(canvasSize.height / 50) }, (_, i) => (
              <div
                key={i}
                className="absolute text-xs text-gray-500 transform -rotate-90 origin-center"
                style={{ top: i * 50, left: -8 }}
              >
                {i * 50}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 提示信息 */}
      {elements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-400">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-lg font-medium mb-2">开始创建你的UI素材</h3>
            <p className="text-sm mb-2">在左侧面板中选择元素类型开始设计</p>
            <p className="text-xs">💡 按住Ctrl/Cmd点击可多选元素</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PreviewCanvas
