# Built-in figure

Drop a rigged (skinned) humanoid model here named **`figure.glb`**:

```
public/models/figure.glb
```

On startup the app checks for this file. If it exists, it loads as the default
figure you pose. If it's absent, the app falls back to the built-in procedural
mannequin — nothing breaks either way.

Requirements for the file:

- Format: `.glb` (a `.gltf` or `.vrm` also works if you rename/point to it, but
  `figure.glb` is what the app looks for by default).
- Must be **rigged** — it needs a humanoid skeleton (bones), not just a static mesh.
- A T-pose or A-pose rest position works best.

Good free sources: Ready Player Me, VRoid Studio (export VRM), or Mixamo
(download as glTF Binary in T-pose).
