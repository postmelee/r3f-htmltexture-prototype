import * as React from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { HtmlTextureStatus, useHtmlTexture } from './useHtmlTexture'

function TexturePanel({ revision }: { revision: number }) {
  return (
    <div className="texture-panel">
      <div className="texture-panel__label">HTMLTexture prototype</div>
      <h2>Visual-only DOM texture</h2>
      <p>
        React DOM is mounted under the canvas and passed to <strong>THREE.HTMLTexture</strong>.
      </p>
      <div className="texture-panel__grid">
        <span>Revision</span>
        <strong>{revision.toString().padStart(2, '0')}</strong>
        <span>Mode</span>
        <strong>Static panel</strong>
      </div>
    </div>
  )
}

function HtmlTexturePlane({
  revision,
  onStatusChange,
}: {
  revision: number
  onStatusChange: (status: HtmlTextureStatus) => void
}) {
  const source = React.useMemo(() => <TexturePanel revision={revision} />, [revision])

  const texture = useHtmlTexture(source, {
    width: 512,
    height: 256,
    onStatusChange,
  })

  return (
    <mesh rotation={[0.18, -0.38, 0]}>
      <planeGeometry args={[3.6, 1.8]} />
      <meshBasicMaterial
        color={texture ? '#ffffff' : '#2b2f38'}
        map={texture}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function Scene({
  revision,
  onStatusChange,
}: {
  revision: number
  onStatusChange: (status: HtmlTextureStatus) => void
}) {
  return (
    <>
      <color attach="background" args={['#11151c']} />
      <ambientLight intensity={1} />
      <HtmlTexturePlane revision={revision} onStatusChange={onStatusChange} />
    </>
  )
}

export function App() {
  const [revision, setRevision] = React.useState(1)
  const [status, setStatus] = React.useState<HtmlTextureStatus>({
    state: 'unsupported',
    paintCount: 0,
    message: 'Waiting for R3F canvas.',
  })

  const handleStatusChange = React.useCallback((nextStatus: HtmlTextureStatus) => {
    setStatus(nextStatus)
  }, [])

  return (
    <main className="app-shell">
      <section className="intro">
        <div>
          <p className="eyebrow">R3F contribution prototype</p>
          <h1>HTML-in-Canvas visual-only helper test</h1>
          <p>
            This verifies the smallest useful shape for a future Drei helper: mount React DOM
            under the canvas, create a native <code>THREE.HTMLTexture</code>, and attach it to a
            material map.
          </p>
          <p className="flag-note">
            Successful path requires Chrome with{' '}
            <code>chrome://flags/#canvas-draw-element</code> enabled. Unsupported browsers should
            show fallback diagnostics.
          </p>
        </div>
        <button type="button" onClick={() => setRevision((value) => value + 1)}>
          Update DOM source
        </button>
      </section>

      <section className="stage-card">
        <div className="canvas-wrap">
          <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} frameloop="demand">
            <Scene revision={revision} onStatusChange={handleStatusChange} />
          </Canvas>
        </div>

        <aside className="diagnostics" aria-live="polite">
          <h2>Diagnostics</h2>
          <dl>
            <div>
              <dt>State</dt>
              <dd data-state={status.state}>{status.state}</dd>
            </div>
            <div>
              <dt>Paint events</dt>
              <dd>{status.paintCount}</dd>
            </div>
            <div>
              <dt>Message</dt>
              <dd>{status.message}</dd>
            </div>
          </dl>
          <p>
            Native interaction is intentionally out of scope here. The source element is rendered
            with <code>pointer-events: none</code> so this demo only proves DOM-to-texture
            lifecycle behavior.
          </p>
        </aside>
      </section>
    </main>
  )
}
