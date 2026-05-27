# Proposal: visual-only HtmlTexture helper for native THREE.HTMLTexture

## Summary

I would like to propose an experimental, web-only Drei helper for using native `THREE.HTMLTexture` with React DOM content.

The first version would intentionally be **visual-only**:

- mount React DOM as an HTML-in-Canvas source under the R3F canvas
- create a native `THREE.HTMLTexture` from that source element
- expose the texture for use as a material map
- request browser paints when the React DOM source changes
- invalidate the R3F frame loop when canvas `paint` events are observed
- gracefully return `null` or an unsupported state when the browser does not support the required APIs

Native DOM interaction, text selection, focus, form input, and copy/paste would be out of scope for the first PR.

## Motivation

Drei already has several useful abstractions around R3F rendering, portals, DOM overlays, and texture helpers. Native `THREE.HTMLTexture` creates a different integration point: it lets DOM/CSS-rendered content become an actual texture that can be mapped onto a mesh.

That is useful for cases where users want DOM/CSS layout as pixels inside the 3D material pipeline instead of a screen-space DOM overlay:

- cards, labels, charts, badges, dashboards, or rich text panels on meshes
- perspective-correct DOM visuals on arbitrary geometry
- shader/material composition using DOM-generated pixels
- progressive experimentation with the browser's native HTML-in-Canvas path

This would not replace Drei's existing `<Html />`. It is closer to a DOM-backed texture helper.

## Browser/API Requirements

The helper would be capability-gated. It should only activate when all required runtime APIs are available:

- `THREE.HTMLTexture`
- `canvas.requestPaint()`
- `WebGLRenderingContext.texElementImage2D()`
- an R3F renderer backed by an `HTMLCanvasElement`

The browser feature is currently experimental and can be tested in Chrome with:

```txt
chrome://flags/#canvas-draw-element
```

Chrome reference:

https://developer.chrome.com/blog/html-in-canvas-origin-trial

## Proposed API Shape

I think the smallest useful shape is a hook, with a component wrapper if maintainers prefer Drei's existing JSX ergonomics.

### Hook

```tsx
function PanelTexture() {
  const texture = useHtmlTexture(
    <div className="panel">
      <h2>Status</h2>
      <p>Rendered by React DOM, sampled as a texture.</p>
    </div>,
    {
      width: 512,
      height: 256,
    },
  )

  return (
    <mesh>
      <planeGeometry args={[3, 1.5]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}
```

### Optional JSX helper

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

The first PR could include only the hook if that is easier to review. The JSX wrapper can be added if maintainers think it better matches Drei's API style.

## Suggested Scope for First PR

Include:

- `useHtmlTexture`
- optional `<HtmlTexture />` wrapper if desired
- TypeScript types
- web-only export
- unsupported-browser fallback
- cleanup/disposal behavior
- Storybook entry demonstrating the visual-only use case
- docs that clearly mark the helper as experimental and visual-only

Exclude:

- native DOM interaction
- partial text selection
- form controls
- focus management
- copy/paste
- DOM hit-testing through transformed 3D meshes
- React Native export
- non-Chrome compatibility guarantees while the browser API is experimental

## Prototype Verification

I built a small external R3F prototype to validate the visual-only lifecycle before proposing a Drei PR.

Live prototype:

https://postmelee.github.io/r3f-htmltexture-prototype/

Source:

https://github.com/postmelee/r3f-htmltexture-prototype

Screenshots:

- Supported path: https://github.com/postmelee/r3f-htmltexture-prototype/blob/main/screenshots/htmltexture-supported-ready.png
- Unsupported fallback: https://github.com/postmelee/r3f-htmltexture-prototype/blob/main/screenshots/htmltexture-unsupported-fallback.png

To see the successful path, open the live prototype in Chrome with:

```txt
chrome://flags/#canvas-draw-element
```

Without that flag/API support, the demo should show the unsupported fallback state.

Verified unsupported path:

- in the Codex in-app browser, `canvas.requestPaint()` was unavailable
- the app rendered without crashing
- diagnostics reported an unsupported state

Verified supported path in Chrome with `chrome://flags/#canvas-draw-element` enabled:

- diagnostics reached `ready`
- a React DOM panel rendered through `THREE.HTMLTexture` on a tilted plane
- clicking "Update DOM source" updated the DOM source and triggered a new paint
- paint events incremented on source updates instead of continuously

Important implementation findings from the prototype:

- the DOM source should be flushed before constructing `THREE.HTMLTexture`
- an initial `requestPaint()` is needed after source setup
- `paint` event diagnostics must be coalesced to avoid feedback loops
- the React DOM source identity should be stable, otherwise parent renders can accidentally request new paints
- the source element should use `pointer-events: none` for the visual-only version

## Interaction as Future Work

An interactive version likely needs a separate API, for example `HtmlTextureSurface interactive`, because native DOM interaction requires more than creating a texture.

The browser-visible source element would need to stay synchronized with the rendered mesh transform and size closely enough for hit testing, selection, focus, and input to work. That is a larger design problem and should not be coupled to the first visual-only helper.

For that reason, I suggest the first PR only covers the visual lifecycle. Interaction can be explored in a follow-up experiment/PR after the visual-only API is accepted.

## Open Questions

- Would this belong in Drei as an experimental web-only helper?
- Should the first API be hook-only, component-only, or both?
- Should unsupported browsers return `null`, expose a status object, warn once, or some combination?
- Should this live near existing portal/texture helpers, or in a separate experimental area?
- Is a Storybook-only example enough while the browser API is behind a flag/origin trial?
