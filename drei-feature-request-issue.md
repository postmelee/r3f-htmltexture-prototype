### Describe the feature you'd like:

Tracking issue for Discussion #2740:

https://github.com/pmndrs/drei/discussions/2740

I would like to add an experimental, web-only Drei helper for native `THREE.HTMLTexture`.

The first PR would intentionally be visual-only:

- mount React DOM as an HTML-in-Canvas source under the R3F canvas
- create a native `THREE.HTMLTexture` from that source element
- expose the texture for use as a material map
- call `canvas.requestPaint()` when the source changes
- invalidate the R3F frame loop when canvas `paint` events are observed
- gracefully fall back when the browser does not support the required APIs

Out of scope for the first PR:

- native DOM interaction
- partial text selection
- form controls
- focus management
- copy/paste
- DOM hit-testing through transformed 3D meshes
- React Native support

The goal is not to replace Drei's existing `<Html />`, but to provide a DOM-backed texture helper for cases where React DOM/CSS output should become pixels in the Three.js material pipeline.

Prototype:

- Live demo: https://postmelee.github.io/r3f-htmltexture-prototype/
- Source: https://github.com/postmelee/r3f-htmltexture-prototype
- Supported screenshot: https://raw.githubusercontent.com/postmelee/r3f-htmltexture-prototype/main/screenshots/htmltexture-supported-ready.png?v=2
- Unsupported fallback screenshot: https://raw.githubusercontent.com/postmelee/r3f-htmltexture-prototype/main/screenshots/htmltexture-unsupported-fallback.png?v=2

The successful path currently requires Chrome with:

```txt
chrome://flags/#canvas-draw-element
```

### Suggested implementation:

Start with a small visual-only API, probably hook-first:

```tsx
const texture = useHtmlTexture(
  <div className="panel">
    <h2>Status</h2>
    <p>Rendered by React DOM, sampled as a texture.</p>
  </div>,
  { width: 512, height: 256 },
)
```

Potential JSX wrapper if maintainers prefer it:

```tsx
<meshBasicMaterial>
  <HtmlTexture attach="map" width={512} height={256}>
    <Panel />
  </HtmlTexture>
</meshBasicMaterial>
```

Implementation notes from the prototype:

- capability-gate on `THREE.HTMLTexture`, `canvas.requestPaint()`, and `WebGLRenderingContext.texElementImage2D()`
- flush the DOM source before constructing `THREE.HTMLTexture`
- request an initial paint after source setup
- coalesce canvas `paint` diagnostics to avoid feedback loops
- keep the React DOM source identity stable across unrelated parent renders
- use `pointer-events: none` for the visual-only version
- add a Storybook entry and docs clearly marking the helper as experimental and visual-only

