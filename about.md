# Menu Icon Exporter

exports your blockbench models as icons with full camera control.

![Menu Icon Exporter Preview](images/plugin_example.png)

## what it does

- auto frames your model 
- manual camera controls (zoom, pan, rotate on all axes)
- export in different sizes (16x16 up to 128x128 or custom)
- live preview so you see what youre getting
- quick export buttons for common sizes

## how to use it

**main export**: File → Export → Export Menu Icon (or Ctrl+Shift+I)
**quick 16x16**: File → Export → Quick Export 16×16 Icon
**quick 64x64**: File → Export → Quick Export 64×64 Icon

## controls

- **zoom**: 0.5x to 3.0x distance
- **pan**: move the model left/right and up/down
- **rotate x**: flips the model 
- **rotate y**: spins like a top
- **rotate z**: rolls the model
- **reset camera**: puts everything back to auto frame (only works after you move stuff)

## export options

- sizes: 16x16, 32x32, 48x48, 64x64, 128x128, or custom
- background: transparent, white, black, gray, or pick your own color
- quality: standard (4x), high (8x), ultra (16x) - higher = sharper but slower
- filename: automatically removes .geo from your project name

## tips

- 16x16 or 32x32 for minecraft items
- transparent background for game textures
- use auto frame checkbox to recenter fast
- all camera controls update live in the preview

outputs png icons that work across blockbench formats and platforms.
platform-specific size, naming, and folder rules still apply.

by NET
