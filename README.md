# LVGL Previewer

A local preview tool for LVGL XML projects with built-in compilation support.

## Features

- **Project Management** — Manage multiple LVGL projects with a simple sidebar interface
- **Live Preview** — Preview screens and components in real-time
- **XML Editor** — CodeMirror 6 powered editor with syntax highlighting for XML files
- **Zoom Support** — Zoom in/out on the preview canvas (mouse wheel or buttons)
- **Compile Support** — Compile LVGL projects using LVGL Pro CLI
- **File Explorer** — Browse and edit screens, components, and configuration files

## Project Structure

```
lvgl-previewer/
├── index.html              # Project manager UI
├── viewer.html             # Preview and editor interface
├── server.js               # Node.js HTTP server with APIs
├── cli/                    # LVGL Pro CLI tools
│   ├── lved-cli.js
│   └── lvgl-resources.zip
├── node_modules/           # Dependencies
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## Quick Start

### 1. Install Dependencies

```bash
cd lvgl-previewer
npm install
```

### 2. Start the Server

```bash
node server.js [port]
```

Default port is `8080`. You can specify a custom port as an argument.

### 3. Open in Browser

Navigate to `http://localhost:8080` in your browser.

### 4. Add a Project

- Enter a project name and absolute path to an LVGL project directory
- Click "Open Project" to load it
- Or use URL parameter: `http://localhost:8080/?project=/path/to/project`

## Supported Project Structure

Your LVGL project should have the following structure:

```
your-project/
├── project.xml            # Project configuration (width, height, name)
├── globals.xml            # Global constants, colors, images
├── screens/               # Screen XML files
│   ├── screen1.xml
│   └── screen2.xml
├── components/            # Component XML files
│   ├── component1.xml
│   └── component2.xml
├── fonts/                 # Font files (.ttf, .otf)
│   └── your-font.ttf
├── images/                # Image files (.png, .jpg)
│   └── your-image.png
└── preview-bin/           # Compiled WASM runtime
    ├── lved-runtime.js
    └── lved-runtime.wasm
```

## API Endpoints

The server provides the following REST APIs:

- `GET /api/screens?project=/path/to/project` — List all screens
- `GET /api/components?project=/path/to/project` — List all components
- `GET /api/assets?project=/path/to/project` — List all assets (fonts, images)
- `GET /api/file?project=/path/to/project&path=relative/path.xml` — Read file
- `POST /api/save` — Save file changes
- `POST /api/compile` — Compile project using LVGL CLI

## Keyboard Shortcuts

In the XML editor (CodeMirror 6):

- `Ctrl+Z` / `Cmd+Z` — Undo
- `Ctrl+Y` / `Cmd+Y` — Redo
- `Tab` — Indent
- `Shift+Tab` — Unindent

## Zoom Controls

- Click `−` / `+` buttons in the preview toolbar
- Use mouse wheel on the canvas area
- Click `Reset` to return to 100%

## Compilation

Click the "Compile" button in the preview toolbar to compile the project using LVGL Pro CLI. This generates the WebAssembly runtime files required for preview.

## Browser Compatibility

- Chrome / Chromium (recommended)
- Firefox
- Safari
- Edge

Requires a modern browser that supports:
- ES6 Modules
- WebAssembly
- SharedArrayBuffer (for COOP/COEP headers)

## Troubleshooting

### "WASM runtime not found"

Make sure you have compiled the project first. Click the "Compile" button or run LVGL CLI manually.

### "Invalid project path"

Ensure the project path is absolute (starts with `/` on Unix or `C:\` on Windows) and contains a valid `globals.xml` file.

### Module loading errors

If you see module resolution errors, try clearing browser cache with `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac).

## License

MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Credits

- [LVGL](https://lvgl.io/) — Light and Versatile Graphics Library
- [CodeMirror 6](https://codemirror.net/) — Text editor component
- LVGL Pro CLI — Compilation and build tools
