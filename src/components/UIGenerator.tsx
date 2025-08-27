import React from 'react'
import { UIElementType } from '../types/ui'

interface UIGeneratorProps {
  onAddElement: (type: UIElementType) => void
}

const UIGenerator: React.FC<UIGeneratorProps> = ({ onAddElement }) => {
  // 这个组件的功能已经集成到App.tsx的主界面中
  // 保留此文件以备将来扩展使用
  return null
}

export default UIGenerator
