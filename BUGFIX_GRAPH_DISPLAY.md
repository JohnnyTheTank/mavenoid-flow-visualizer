# Bugfix: Graph wird nicht angezeigt nach Migration

## Problem
Nach der Migration zu Mantine wurden die Graphen nicht mehr angezeigt, obwohl keine Fehler in der Console auftauchten.

## Ursache
Zwei Probleme führten dazu, dass der Graph-Container keine Höhe hatte:

### 1. Tailwind-Klassen in GraphView.tsx
GraphView.tsx hatte noch Tailwind-Klassen im return statement:
```tsx
<div ref={containerRef} className="w-full h-full bg-slate-50 rounded-lg" />
```

Diese Klassen wurden nicht mehr gerendert, da Tailwind entfernt wurde.

### 2. Flexbox-Layout im AppShell
Der Graph-Container hatte `flex: 1`, aber der Parent-Container hatte keine definierte Höhe und das richtige Flexbox-Setup fehlte.

## Lösung

### Fix 1: GraphView.tsx - Inline Styles
**Datei:** `src/components/GraphView.tsx` (Zeile 368)

**Vorher:**
```tsx
<div ref={containerRef} className="w-full h-full bg-slate-50 rounded-lg" />
```

**Nachher:**
```tsx
<div ref={containerRef} style={{ width: "100%", height: "100%", backgroundColor: "#f8fafc", borderRadius: "8px" }} />
```

### Fix 2: App.tsx - Flexbox Layout
**Datei:** `src/App.tsx`

**Vorher:**
```tsx
<AppShell.Main>
  <Stack gap={0} style={{ height: '100%' }}>
    {/* ... */}
    <Box style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
```

**Nachher:**
```tsx
<AppShell.Main style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
  {/* Stack entfernt, direktes Flex-Layout */}
  {/* ... */}
  <Box style={{ flex: 1, minHeight: 0, position: 'relative' }}>
```

**Wichtige Änderungen:**
- `height: '100vh'` auf AppShell.Main → Garantiert definierte Höhe
- `display: 'flex', flexDirection: 'column'` → Flex-Container für Kinder
- `minHeight: 0` auf Graph-Box → Verhindert, dass Flex-Item über Container hinauswächst
- Stack entfernt → Vereinfacht Layout-Hierarchie

## Warum `minHeight: 0`?

In Flexbox haben Flex-Items standardmäßig `min-height: auto`, was bedeutet, dass sie nicht kleiner als ihr Inhalt werden können. Das führt zu Problemen bei verschachtelten Flex-Containern mit Scroll.

Mit `minHeight: 0` erlauben wir dem Container, kleiner als sein Inhalt zu werden, was `overflow: hidden` und das Cytoscape-Rendering ermöglicht.

## Verifizierung

```bash
yarn build  # ✓ Build erfolgreich
yarn dev    # Graph wird jetzt korrekt angezeigt
```

## Weitere Learnings

- Immer prüfen, ob alte CSS-Framework-Klassen noch im Code sind
- Flexbox mit 100% Höhe benötigt eine Kette von definierten Höhen
- `minHeight: 0` ist oft nötig bei verschachtelten Flex-Containern
- AppShell.Main hat von Haus aus keine definierte Höhe - muss explizit gesetzt werden

## Status: ✅ GELÖST

Der Graph wird jetzt korrekt angezeigt, sobald JSON-Dateien geladen werden.
