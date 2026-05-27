# Proposal: visual-only HtmlTexture helper for native THREE.HTMLTexture

I would like to propose an experimental, web-only Drei helper for using native `THREE.HTMLTexture` with React DOM content.

The first version would intentionally be **visual-only**. It would turn React DOM/CSS output into a texture that can be assigned to a material map. It would not try to support native DOM interaction, text selection, form input, focus, or copy/paste in the first PR.

## Why this might fit Drei

`THREE.HTMLTexture` creates a useful path between React DOM/CSS layout and the actual Three.js material pipeline. This is different from Drei's existing `<Html />`, which renders DOM as an overlay. The proposed helper would make DOM-rendered pixels usable as a real texture on a mesh.

Potential use cases:

- rich labels, cards, badges, charts, or dashboard panels on meshes
- perspective-correct DOM visuals on 3D surfaces
- DOM-generated pixels used with materials, shaders, and geometry
- a small wrapper around the browser's native HTML-in-Canvas lifecycle

## Proposed first scope

Include:

- `useHtmlTexture`
- possibly a small `<HtmlTexture />` JSX wrapper
- TypeScript types
- web-only export
- capability-gated unsupported fallback
- cleanup/disposal behavior
- Storybook example
- docs marking it as experimental and visual-only

Exclude from the first PR:

- native DOM interaction
- partial text selection
- form controls and focus management
- copy/paste
- DOM hit-testing through transformed 3D meshes
- React Native support
- broad browser compatibility guarantees while the underlying browser API is experimental

## Browser/API requirements

The helper would only activate when the required runtime APIs are available:

- `THREE.HTMLTexture`
- `canvas.requestPaint()`
- `WebGLRenderingContext.texElementImage2D()`
- an R3F renderer backed by an `HTMLCanvasElement`

The browser feature is currently experimental. For Chrome testing:

```txt
chrome://flags/#canvas-draw-element
```

Chrome reference:

https://developer.chrome.com/blog/html-in-canvas-origin-trial

## API sketch

Hook-first:

```tsx
function PanelTexture() {
  const texture = useHtmlTexture(
    <div className="panel">
      <h2>Status</h2>
      <p>Rendered by React DOM, sampled as a texture.</p>
    </div>,
    { width: 512, height: 256 },
  )

  return (
    <mesh>
      <planeGeometry args={[3, 1.5]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}
```

Optional JSX wrapper:

```tsx
<mesh>
  <planeGeometry args={[3, 1.5]} />
  <meshBasicMaterial>
    <HtmlTexture attach="map" width={512} height={256}>
      <div className="panel">
        <h2>Status</h2>
        <p>Rendered by React DOM, sampled as a texture.</p>
      </div>
    </HtmlTexture>
  </meshBasicMaterial>
</mesh>
```

## Prototype

I built a small external R3F prototype to validate the visual-only lifecycle before proposing a Drei PR.

Live demo:

https://postmelee.github.io/r3f-htmltexture-prototype/

Source:

https://github.com/postmelee/r3f-htmltexture-prototype

To see the successful path, open the live demo in Chrome with:

```txt
chrome://flags/#canvas-draw-element
```

Without that flag/API support, the demo should show the unsupported fallback diagnostics.

### Supported path

![Supported HTMLTexture path](https://raw.githubusercontent.com/postmelee/r3f-htmltexture-prototype/main/screenshots/htmltexture-supported-ready.png)

### Unsupported fallback

![Unsupported fallback](https://raw.githubusercontent.com/postmelee/r3f-htmltexture-prototype/main/screenshots/htmltexture-unsupported-fallback.png)

## Prototype findings

- The DOM source should be flushed before constructing `THREE.HTMLTexture`.
- An initial `requestPaint()` is needed after source setup.
- Canvas `paint` diagnostics should be coalesced to avoid feedback loops.
- The React DOM source identity should stay stable, otherwise parent renders can accidentally request new paints.
- The source element should use `pointer-events: none` for the visual-only version.

## Interaction as future work

An interactive version likely needs a separate API, for example `HtmlTextureSurface interactive`, because native DOM interaction requires more than creating a texture.

The browser-visible source element would need to stay synchronized with the rendered mesh transform and size closely enough for native hit testing, text selection, focus, and input to work. That seems like a larger design problem and should not be coupled to the first visual-only helper.

## Questions

1. Would this be a good fit for Drei as an experimental web-only helper?
2. If yes, would maintainers prefer a hook-only API first, or both `useHtmlTexture` and `<HtmlTexture />`?
3. What unsupported-browser behavior would fit Drei best: return `null`, expose status, warn once, or some combination?

If this direction makes sense, I can open a focused first PR for the visual-only helper and keep interaction out of scope.

