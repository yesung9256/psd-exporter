# Penpot PSD Exporter — experimental beta

This repository implements a **browser-side PSD exporter** for a selected Penpot board.

## Supported experimentally
- One selected board
- Editable Photoshop vector shapes for solid-color rectangles, rounded rectangles and ellipses (using ag-psd vectorFill, vectorMask, vectorOrigination)
- Editable Photoshop text layers (using ag-psd text descriptors)
- Layer groups and nested hierarchy
- 1x, 2x, 3x scale
- Basic PSD read-back validation before download

## Known limitations
- Not yet tested by opening output in Adobe Photoshop.
- Fonts may substitute or shift; rich text styles and layout are not preserved.
- Image fills, gradients, strokes, masks, shadows, paths and component features are not implemented and may be skipped.
- Vector live shape parameters require real Photoshop verification.
- Uses ag-psd from esm.sh; an internet connection is required.
- Not production ready.

## Install
Enable GitHub Pages on the main branch at repository root. Then install:
https://yesung9256.github.io/psd-exporter/manifest.json
in Penpot's Plugin Manager.

## Development
1. Select a board in Penpot.
2. Launch plugin and click Export editable PSD.
3. Open the downloaded file in Photoshop.
4. Verify shape color, radius and text remain editable.
5. Report failures for the next iteration.

The plugin uses ag-psd. Source documentation:
https://github.com/Agamnentzar/ag-psd/blob/master/README_PSD.md
