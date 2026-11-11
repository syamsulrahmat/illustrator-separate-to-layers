# Illustrator Separate to Layers

[![Adobe Illustrator](https://img.shields.io/badge/Adobe%20Illustrator-CS6%20--%202026%2B-orange.svg)](https://www.adobe.com/products/illustrator.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows-lightgrey.svg)]()
[![Type](https://img.shields.io/badge/Type-ExtendScript%20JSX-brightgreen.svg)]()

> **Smart Shape & Group Layer Distributor for Adobe Illustrator.**  
> Distributes selected shapes and objects onto their own individual layers while strictly preserving nested groups and clipping masks intact—with automatic source layer prefixing and exact visual stacking order (z-order) preservation.

---

## Why this script?

Adobe Illustrator’s native **"Release to Layers (Sequence)"** command has severe limitations:
1. It ungroups and breaks down **everything** into sublayers, destroying nested groups that you wanted to keep intact (such as icons, characters, wheels, buttons, or multi-element assets).
2. It breaks **clipping masks**, exposing clipped overflow paths.
3. It creates sublayers rather than clean, top-level export-ready layers for After Effects, SVG workflows, or animation.

**Illustrator Separate to Layers** fixes all of these issues:

```text
Selection
├── Loose Shape A        ───>  [Layer] SourceLayer - Loose Shape A
├── Loose Shape B        ───>  [Layer] SourceLayer - Loose Shape B
└── Top-Level Group 1
    ├── Child Shape 1    ───>  [Layer] SourceLayer - Child Shape 1
    ├── Child Shape 2    ───>  [Layer] SourceLayer - Child Shape 2
    └── Nested Group 2   ───>  [Layer] SourceLayer - Group 1 (INTACT with all inner shapes!)
```

---

## Features

- **Selective Group Unpacking:**
  - Selected top-level groups have their immediate shape children distributed to separate layers.
  - Any **nested group inside a group** remains **100% intact as a single grouped unit** and is moved to its own layer without breaking apart.
- **Source Layer Prefixing:**
  - Automatically prefixes the source layer name to each newly generated layer (e.g., `Characters - Head`, `Layer 1 - Path 1`, `Layer 1 - Group 1`).
  - Automatically avoids duplicate prefixing if an item already begins with the layer name.
- **Clipping Mask Protection:**
  - Clip Groups (`clipped = true`) are recognized and preserved intact so clipping masks are never destroyed.
- **Exact Visual Stacking Order (Z-Order):**
  - Traverses objects bottom-to-top and creates layers sequentially directly above the original layer, guaranteeing that the artwork's visual hierarchy is preserved 1:1.
- **Smart Descriptive Layer Naming:**
  - Preserves existing custom object names (`item.name`).
  - Provides descriptive fallbacks for unnamed items (`Path 1`, `Group 1`, `Compound Path 1`, `Text ("...")`).
- **Clean Document State:**
  - Automatically removes emptied parent groups after their children have been distributed.
- **Full Object Support:**
  - Paths (`PathItem`), Compound Paths (`CompoundPathItem`), Groups (`GroupItem`), Text Frames (`TextFrame`), Images (`RasterItem`), Placed Items (`PlacedItem`), and Mesh objects.
- **Compatibility:**
  - Works across Adobe Illustrator CS6 through CC 2026+ on both Windows and macOS.

---

## Installation & Usage

### Quick Run (On-Demand)
1. Open your document in Adobe Illustrator.
2. Select the objects, paths, or groups you want to separate.
3. Go to **File > Scripts > Other Script...** (or press `Ctrl+F12` on Windows / `Cmd+F12` on macOS).
4. Choose `Separate_Shapes_To_Layers.jsx`.

### Permanent Installation (Scripts Menu)
To access the script directly inside Illustrator's **File > Scripts** menu:
1. Copy `Separate_Shapes_To_Layers.jsx` into your Illustrator Scripts folder:
   - **Windows:** `C:\Program Files\Adobe\Adobe Illustrator <Version>\Presets\<Language>\Scripts\`
   - **macOS:** `/Applications/Adobe Illustrator <Version>/Presets/<Language>/Scripts/`
2. Restart Adobe Illustrator.
3. Access it anytime from **File > Scripts > Separate_Shapes_To_Layers**.

---

## License

This project is licensed under the [MIT License](LICENSE).
