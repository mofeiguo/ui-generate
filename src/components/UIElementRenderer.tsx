import React from 'react'
import { UIElement } from '../types/ui'

interface UIElementRendererProps {
  element: UIElement
}

const UIElementRenderer: React.FC<UIElementRendererProps> = ({ element }) => {
  const getElementStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
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

    // 添加阴影效果
    if (element.boxShadow) {
      baseStyle.boxShadow = element.boxShadow
    } else if (element.type === 'button') {
      baseStyle.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
    }

    return baseStyle
  }

  const getTextStyle = (): React.CSSProperties => {
    return {
      fontSize: element.fontSize,
      color: element.textColor,
      fontWeight: element.fontWeight || 'normal',
      textAlign: element.textAlign || 'center',
      width: '100%',
      lineHeight: 1.2,
      wordBreak: 'break-word'
    }
  }

  const renderContent = () => {
    switch (element.type) {
      case 'button':
        return (
          <div style={getElementStyle()}>
            <span style={getTextStyle()}>
              {element.text || '按钮'}
            </span>
          </div>
        )

      case 'text':
        return (
          <div style={{
            ...getElementStyle(),
            backgroundColor: element.backgroundColor === 'transparent' ? 'transparent' : element.backgroundColor,
            border: 'none',
            boxShadow: 'none',
            padding: '0'
          }}>
            <span style={getTextStyle()}>
              {element.text || '文本'}
            </span>
          </div>
        )

      case 'panel':
        return (
          <div style={getElementStyle()}>
            {element.text && (
              <span style={getTextStyle()}>
                {element.text}
              </span>
            )}
          </div>
        )

      case 'circle':
        return (
          <div style={{
            ...getElementStyle(),
            borderRadius: '50%'
          }}>
            {element.text && (
              <span style={getTextStyle()}>
                {element.text}
              </span>
            )}
          </div>
        )

      default:
        return <div style={getElementStyle()} />
    }
  }

  return (
    <div className="w-full h-full">
      {renderContent()}
    </div>
  )
}

export default UIElementRenderer
