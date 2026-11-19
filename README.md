# Penpot PSD Exporter — prototype

This is an early Penpot plugin prototype, **not yet a PSD converter**.

## What works
- Reads a single selected board and its descendants
- Extracts shape positions, dimensions, fills, strokes, corner radii, text metadata and groups
- Downloads the resulting data as JSON

## Not yet implemented
- Writing PSD files
- Photoshop-editable vector shapes, corner radius and text
- Accurate gradients, images, masks, effects and typography

## Install
Host manifest.json, plugin.js and index.html together via HTTPS and install the manifest URL through Penpot Plugin Manager.

## Next milestone
Implement and validate Photoshop-editable rectangle and text layers before claiming PSD support.
