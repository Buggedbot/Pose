# Manga Pose Reference

A browser-based 3D posing tool for manga/sketch artists. It renders a faceless,
feminine-proportioned mannequin built from an FK joint hierarchy that you can
pose freely for figure-drawing reference — orbit the camera around it in free
space, click any joint, then drag its rotate gizmo or use the side-panel
sliders to bend it within human-plausible limits.

## Features

- Posable female mannequin (hips → spine → chest → neck/head, shoulders → arms
  → hands, hips → legs → feet) with per-joint rotation limits.
- Free camera movement (orbit/pan/zoom) around the figure.
- Click a joint on the model or pick it from the sidebar list; drag the 3D
  gizmo or use the Bend/Twist/Swing sliders to pose it.
- Pose presets (relaxed stand, hands on hips, walking, action lunge, sitting,
  arms raised) plus the ability to save/load your own poses (stored locally).
- Lighting controls (key light azimuth/elevation/intensity, fill light, rim
  light, floor grid) for shading/reference studies.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and produce a production build
```
