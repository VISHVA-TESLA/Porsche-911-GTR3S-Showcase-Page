# Porsche 911 Scroll Experience — Setup Notes

## Handling the .glb model

1. **Source a model you have rights to use.** Don't pull an unlicensed
   Porsche model into a commercial build — Porsche's design and the
   911 silhouette are protected IP. For production, license a model
   (e.g. via Porsche's own asset partners, Sketchfab's "Editorial Use"
   or royalty-free commercial-license listings, or a 3D scan you
   commission) or use a generic/placeholder sports-car mesh during
   development and swap it before launch.

2. **Compress before shipping.** Raw .glb exports from Blender/3DS Max
   are often 40–100MB+, which will stutter on scroll. Run it through
   `gltf-transform` or `gltfpack`:

   ```bash
   npx gltf-transform optimize input.glb output.glb \
     --texture-compress webp \
     --simplify
   ```

   Target under ~8MB for a hero asset. Draco-compress geometry and
   convert textures to WebP/KTX2 — this is usually the biggest single
   win.

3. **Host it efficiently.** Put the compressed `.glb` in `/public/models/`
   for local dev, but for production serve it from a CDN with proper
   cache headers (`Cache-Control: public, max-age=31536000, immutable`)
   since the file is static and versioned by filename.

4. **Preload it.** Call `useGLTF.preload("/models/porsche-911.glb")`
   outside the component (module scope) so the model starts fetching
   the moment the bundle loads, not when the Canvas mounts:

   ```js
   useGLTF.preload("/models/porsche-911.glb");
   ```

5. **Bake instead of compute where possible.** If the model comes with
   baked ambient occlusion / lightmaps, keep them — don't rely purely
   on real-time lights for the rim-light look, it's far cheaper.

## Performance checklist

- `dpr={[1, 1.8]}` on the `<Canvas>` caps device-pixel-ratio so retina/4K
  screens don't render at full native res for no visible gain.
- `ContactShadows` is much cheaper than real shadow-mapped lights for a
  static ground shadow — use it instead of `castShadow` on a floor plane.
- The camera rig lerps toward target positions every frame rather than
  jumping straight to GSAP-tweened values — this is what gives the
  "silky" feel and also naturally smooths out fast/jittery scroll input.
- The idle-fallback (`idleRef`) only kicks in 1.2s after scroll stops,
  so it never fights the scrub animation — it only takes over once the
  user has actually paused.
- Use `React.lazy` + `Suspense` to code-split this whole experience if
  it's not the very first thing on the page, so the 3D bundle doesn't
  block initial paint.
- Test on a throttled mid-tier mobile profile in DevTools — orbit
  controls and high-poly chrome trim are the first things to chug.

## Wiring up GSAP ScrollTrigger correctly in React

`ScrollTrigger.create` is set up in a `useEffect` and torn down on
unmount (`trigger.kill()`). This avoids the classic React/GSAP bug
where ScrollTrigger instances pile up across re-renders/hot-reloads
and start firing duplicate `onUpdate` callbacks.

## File map

```
src/
  App.jsx                          – page shell, mounts the experience
  components/
    PorscheScrollExperience.jsx    – sticky 300vh container, camera rig,
                                      lighting, overlays, idle fallback
tailwind.config.js                 – type/color tokens
package.json                       – deps
```
