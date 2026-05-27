import * as React from 'react'
import { flushSync } from 'react-dom'
import * as ReactDOM from 'react-dom/client'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

type CanvasWithPaint = HTMLCanvasElement & {
  requestPaint?: () => void
}

type HTMLTextureConstructor = new (element: HTMLElement) => THREE.Texture

export type HtmlTextureStatus =
  | {
      state: 'ready'
      paintCount: number
      message: string
    }
  | {
      state: 'unsupported'
      paintCount: number
      message: string
    }

export interface UseHtmlTextureOptions {
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
  warnUnsupported?: boolean
  onStatusChange?: (status: HtmlTextureStatus) => void
}

function getHTMLTextureCtor(): HTMLTextureConstructor | undefined {
  return (THREE as unknown as { HTMLTexture?: HTMLTextureConstructor }).HTMLTexture
}

function getUnsupportedReason(canvas: CanvasWithPaint, gl: THREE.WebGLRenderer) {
  const HTMLTexture = getHTMLTextureCtor()
  const context = gl.getContext?.() as WebGLRenderingContext | undefined

  if (typeof document === 'undefined') return 'document is not available.'
  if (!(canvas instanceof HTMLCanvasElement)) return 'R3F renderer is not backed by an HTMLCanvasElement.'
  if (!HTMLTexture) return 'THREE.HTMLTexture is not available. Use Three.js r184 or newer.'
  if (typeof canvas.requestPaint !== 'function') return 'canvas.requestPaint() is not available.'
  if (typeof (context as any)?.texElementImage2D !== 'function') {
    return 'WebGLRenderingContext.texElementImage2D() is not available.'
  }

  return null
}

export function useHtmlTexture(
  children: React.ReactNode,
  {
    width = 512,
    height = 256,
    className,
    style,
    warnUnsupported = true,
    onStatusChange,
  }: UseHtmlTextureOptions = {},
) {
  const gl = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)
  const [texture, setTexture] = React.useState<THREE.Texture | null>(null)
  const rootRef = React.useRef<ReactDOM.Root | null>(null)
  const warnedRef = React.useRef(false)
  const paintCountRef = React.useRef(0)
  const paintReportFrameRef = React.useRef<number | null>(null)
  const requestPaintFrameRef = React.useRef<number | null>(null)

  React.useLayoutEffect(() => {
    const canvas = gl.domElement as CanvasWithPaint
    const unsupportedReason = getUnsupportedReason(canvas, gl)
    const HTMLTexture = getHTMLTextureCtor()

    if (unsupportedReason || !HTMLTexture) {
      const status: HtmlTextureStatus = {
        state: 'unsupported',
        paintCount: paintCountRef.current,
        message: unsupportedReason || 'THREE.HTMLTexture is not available.',
      }

      onStatusChange?.(status)

      if (warnUnsupported && !warnedRef.current) {
        console.warn(`[html-texture prototype] ${status.message}`)
        warnedRef.current = true
      }

      return
    }

    canvas.setAttribute('layoutsubtree', '')

    const element = document.createElement('div')
    element.className = className || 'html-texture-source'
    element.style.display = 'block'
    element.style.width = `${width}px`
    element.style.height = `${height}px`
    element.style.position = 'absolute'
    element.style.left = '0'
    element.style.top = '0'
    element.style.pointerEvents = 'none'
    if (style) Object.assign(element.style, style)

    canvas.appendChild(element)

    const root = ReactDOM.createRoot(element)
    rootRef.current = root
    flushSync(() => {
      root.render(<>{children}</>)
    })

    const htmlTexture = new HTMLTexture(element)
    htmlTexture.needsUpdate = true
    htmlTexture.colorSpace = THREE.SRGBColorSpace
    setTexture(htmlTexture)

    onStatusChange?.({
      state: 'ready',
      paintCount: paintCountRef.current,
      message: 'THREE.HTMLTexture is active.',
    })

    const reportPaintStatus = () => {
      paintReportFrameRef.current = null
      onStatusChange?.({
        state: 'ready',
        paintCount: paintCountRef.current,
        message: 'Canvas paint event observed.',
      })
    }

    const handlePaint = () => {
      paintCountRef.current += 1
      htmlTexture.needsUpdate = true

      if (paintReportFrameRef.current === null) {
        paintReportFrameRef.current = window.requestAnimationFrame(reportPaintStatus)
      }

      invalidate()
    }

    canvas.addEventListener('paint', handlePaint)
    canvas.requestPaint?.()
    requestPaintFrameRef.current = window.requestAnimationFrame(() => {
      requestPaintFrameRef.current = null
      canvas.requestPaint?.()
      invalidate()
    })

    return () => {
      canvas.removeEventListener('paint', handlePaint)
      if (paintReportFrameRef.current !== null) {
        window.cancelAnimationFrame(paintReportFrameRef.current)
        paintReportFrameRef.current = null
      }
      if (requestPaintFrameRef.current !== null) {
        window.cancelAnimationFrame(requestPaintFrameRef.current)
        requestPaintFrameRef.current = null
      }
      setTexture(null)
      htmlTexture.dispose()
      root.unmount()
      rootRef.current = null

      if (element.parentNode === canvas) {
        canvas.removeChild(element)
      }
    }
  }, [className, gl, height, invalidate, onStatusChange, style, warnUnsupported, width])

  React.useLayoutEffect(() => {
    if (rootRef.current) {
      flushSync(() => {
        rootRef.current?.render(<>{children}</>)
      })
    }
    const canvas = gl.domElement as CanvasWithPaint
    canvas.requestPaint?.()
    if (requestPaintFrameRef.current !== null) {
      window.cancelAnimationFrame(requestPaintFrameRef.current)
    }
    requestPaintFrameRef.current = window.requestAnimationFrame(() => {
      requestPaintFrameRef.current = null
      canvas.requestPaint?.()
      invalidate()
    })
  }, [children, gl])

  return texture
}
