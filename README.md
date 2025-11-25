# Tampereen Kaupunginosat - Geography Quiz Game

A geography quiz game where players are shown a detailed, label-free map of Tampere and must identify which district is highlighted by choosing the correct name from three options. Each round presents a new district, combining learning and challenge as players try to recognize the city's neighborhoods by their shapes and locations.

## Features

- Interactive map with district highlighting
- Multiple choice quiz format
- Score tracking
- Smooth zoom animations
- District recognition challenge

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **SVG** - Vector graphics for map rendering
- **CSS** - Styling

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Data Processing

The app includes scripts to preprocess GeoJSON district data:

```bash
# Process districts for SVG rendering
npm run prepare-districts

# Alternative preprocessing (legacy)
npm run preprocess
```

## Project Structure

- `src/components/` - React components (Game, MapView, OptionsPanel, ScorePanel)
- `src/types.ts` - TypeScript type definitions
- `public/` - Static assets including district data and basemap image
- `scripts/` - Data preprocessing scripts
