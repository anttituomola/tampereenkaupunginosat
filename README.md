# Tampereen kaupunginosat

An interactive map and geography game for learning the districts of Tampere, Finland.

**[Open the live application](https://tampereenkaupunginosat.vercel.app/)**

## What it does

- Highlights a district and asks the player to identify it
- Tracks score and accuracy
- Provides map browsing and district search
- Supports smooth map navigation and responsive layouts
- Generates indexable district pages and SEO files

## Technical approach

The source geographic data is transformed before it reaches the browser. Preprocessing scripts:

1. Read and normalize GeoJSON data
2. Convert map coordinates with `proj4`
3. Produce browser-friendly district geometry
4. Generate the assets used by the React interface

Districts are rendered as SVG rather than through a heavyweight map SDK. This keeps the interaction model under application control and makes highlighting, selection and animation straightforward.

## Stack

- React 19
- TypeScript
- Vite
- React Router
- SVG and GeoJSON
- proj4
- ESLint

## Development

```bash
npm install
npm run prepare-districts
npm run dev
```

Production check:

```bash
npm run lint
npm run build
```
