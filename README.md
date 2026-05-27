# R3F HTMLTexture Prototype

This is a small external prototype for a potential `@react-three/drei` `HtmlTexture` contribution.

Live demo:

```txt
https://postmelee.github.io/r3f-htmltexture-prototype/
```

Source repo:

```txt
https://github.com/postmelee/r3f-htmltexture-prototype
```

The prototype intentionally validates only the **visual-only** MVP:

- mount React DOM under the R3F canvas
- create a native `THREE.HTMLTexture` from that DOM source
- attach the texture to a material map
- call `requestPaint()` after source updates
- invalidate the R3F frame loop on canvas paint events
- fail gracefully in unsupported browsers

Native interaction is intentionally out of scope. The source element uses `pointer-events: none`.

## Run

```bash
npm install
npm run dev -- --port 5173
```

Open:

```txt
http://127.0.0.1:5173/
```

## Verify

Supported environment:

- Three.js r184 or newer
- browser with HTML-in-Canvas enabled
- `canvas.requestPaint()`
- `WebGLRenderingContext.texElementImage2D()`

For Chrome flag testing, enable:

```txt
chrome://flags/#canvas-draw-element
```

Expected supported behavior:

- diagnostics state is `ready`
- DOM panel appears on the plane mesh
- clicking "Update DOM source" updates the DOM source and requests repaint
- paint event count increments only when the source is painted, not continuously

Expected unsupported behavior:

- page still renders
- diagnostics state is `unsupported`
- no runtime crash
- unsupported reason is shown in diagnostics

## Current verification result

Two paths have now been verified.

Screenshots:

- supported path: [`screenshots/htmltexture-supported-ready.png`](./screenshots/htmltexture-supported-ready.png)
- unsupported fallback: [`screenshots/htmltexture-unsupported-fallback.png`](./screenshots/htmltexture-unsupported-fallback.png)

### Unsupported path

In the Codex in-app browser, HTML-in-Canvas was unavailable:

```txt
canvas.requestPaint() is not available.
```

That verifies the graceful fallback path: the app renders, diagnostics state is `unsupported`, and no runtime crash occurs.

### Supported Chrome flag path

In Chrome with `chrome://flags/#canvas-draw-element` enabled:

- diagnostics state becomes `ready`
- the DOM panel renders as a `THREE.HTMLTexture` on the tilted plane
- clicking "Update DOM source" updates the source DOM and increments paint events
- the previous paint feedback loop is fixed; paint events no longer increase continuously
- partial text selection inside the rendered texture is not available in this visual-only prototype

Text selection, focus, form input, and copy/paste are intentionally not validated here. Those require synchronizing the source DOM element's browser-visible transform with the rendered mesh, which belongs to a later `HtmlTextureSurface interactive` design.

## Implementation note

### Paint feedback loop

Do not call `requestPaint()` after every React render. A canvas `paint` event can update diagnostics state, and that state update can re-render the React tree. If the DOM source React node is recreated on every parent render, the hook requests another paint and creates a feedback loop.

This prototype avoids that by memoizing the DOM source element by `revision` and coalescing paint diagnostics to animation frames.

### Texture visibility

Create the `THREE.HTMLTexture` only after the React DOM source has been flushed into the source element. The prototype uses a synchronous initial render, marks the texture as needing an update, and requests an initial paint immediately and on the next animation frame.

The demo material is opaque. A transparent material can make this experiment harder to read when the browser's HTML snapshot path produces unexpected alpha.

### Interaction boundary

The source element uses `pointer-events: none` and is mounted only to provide pixels for `THREE.HTMLTexture`. This proves the visual DOM-to-texture lifecycle, not native DOM interaction.

A separate interactive experiment should validate the future API shape for mesh-aware transform synchronization and native DOM hit testing without expanding the first Drei contribution beyond the visual-only helper.
