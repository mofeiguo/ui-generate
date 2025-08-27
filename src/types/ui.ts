export type UIElementType = 'button' | 'text' | 'panel' | 'circle'

export interface UIElement {
  id: string
  type: UIElementType
  x: number
  y: number
  width: number
  height: number
  text?: string
  backgroundColor: string
  textColor: string
  borderRadius: number
  fontSize: number
  borderWidth: number
  borderColor: string
  opacity: number
  rotation: number
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  textAlign?: 'left' | 'center' | 'right'
  boxShadow?: string
  gradient?: {
    type: 'linear' | 'radial'
    colors: string[]
    direction?: number
  }
}

export interface CanvasSize {
  width: number
  height: number
}

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'svg'
  quality: number
  scale: number
  backgroundColor: string
}
