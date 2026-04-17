# RouterOps Control (Portfolio Desktop App)

Premium Linux-focused QA utility built with **Tauri v2 + React + TypeScript + Vite + Tailwind + shadcn/ui**.

Current workflow defaults are configured around **GL-AX1800** (`192.168.8.1`, `scp`, `sysupgrade -n`), with platform-tag-based artifact resolution and optional local image path flashing.

## Install from .deb (Ubuntu/Debian)

Download the `.deb` from the latest GitHub Actions build artifact, then:

```bash
sudo dpkg -i routerops-control_*.deb
sudo apt-get install -f   # resolve any missing dependencies
```

## Build from source

### Prerequisites (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf
```

You also need [Node.js](https://nodejs.org/) (v20+) and [Rust](https://rustup.rs/).

### Development

```bash
npm install
npm run tauri dev
```

### Production .deb bundle

```bash
npm install
npx tauri build --bundles deb
```

The `.deb` file will be at `src-tauri/target/release/bundle/deb/`.

## Project structure

```text
src/
  app/                     # app navigation + section metadata
  components/
    app/                   # product-specific UI (sidebar, topbar, status, palette)
    ui/                    # shadcn/ui primitives
  data/                    # realistic mock data and flash-plan generation
  domain/                  # typed domain models
  features/                # state orchestration and interactions
  lib/                     # utilities/formatters
  pages/                   # section screens (Home, Flash, Aliases, Platforms, Jobs, Settings)
  services/                # service contracts + mock implementations
```

## What is mocked in this iteration

- Firmware URL resolving/downloading
- Router transfer and upgrade execution
- Alias command execution backend
- Alias export/deploy to remote router shell profile (`~/.profile`)
- Streaming job/log transport
- Persistence layer for settings/jobs/history

All these seams are abstracted behind typed services so they can be replaced with Tauri commands or a Python sidecar without rewriting UI flows.

## Integration next steps

1. Replace `MockFlashService` and `MockAliasService` with Tauri command invocations.
2. Add backend event streaming for real-time step updates/log chunks.
3. Persist jobs, aliases, and settings in local storage/DB.
4. Add credential management and secure command execution boundary.
