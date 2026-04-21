# Migrationsplan: Tailwind CSS → Mantine UI

## 📋 Übersicht

Dieser Plan beschreibt die schrittweise Migration des Mavenoid Flow Visualizer Projekts von **Tailwind CSS v4** zu **Mantine UI v9**.

### Warum Mantine?
- ✅ Umfassende, vorgefertigte React-Komponenten
- ✅ Eingebautes Theme-System mit Dark Mode
- ✅ TypeScript-first Design
- ✅ Bessere Accessibility out-of-the-box
- ✅ Integrierte Hooks-Bibliothek
- ✅ Konsistente Design-Sprache

---

## 🎯 Phase 1: Setup & Installation

### 1.1 Dependencies installieren

```bash
# Mantine Core-Pakete installieren
yarn add @mantine/core @mantine/hooks

# PostCSS-Setup für Mantine
yarn add --dev postcss postcss-preset-mantine postcss-simple-vars

# Optional: Icons
yarn add @tabler/icons-react
```

### 1.2 Tailwind entfernen

```bash
# Tailwind-Abhängigkeiten entfernen
yarn remove tailwindcss @tailwindcss/vite
```

### 1.3 PostCSS konfigurieren

**Neue Datei erstellen:** `postcss.config.cjs`

```javascript
module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};
```

### 1.4 Vite-Konfiguration anpassen

**Datei:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/mavenoid-flow-visualizer/',
})
```

### 1.5 Styles aktualisieren

**Datei:** `src/index.css`

```css
/* Mantine Styles importieren */
@import '@mantine/core/styles.css';

body {
  margin: 0;
  min-height: 100vh;
}

#root {
  min-height: 100vh;
}
```

---

## 🎨 Phase 2: MantineProvider Setup

### 2.1 Main-Datei anpassen

**Datei:** `src/main.tsx`

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core'
import App from './App.tsx'
import './index.css'

// Theme-Konfiguration
const theme = createTheme({
  primaryColor: 'indigo',
  defaultRadius: 'md',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </StrictMode>,
)
```

---

## 🔄 Phase 3: Komponenten migrieren

### 3.1 Migration-Mapping: Tailwind → Mantine

#### Layout & Container
| Tailwind | Mantine Äquivalent |
|----------|-------------------|
| `className="flex"` | `<Flex>` oder `<Group>` |
| `className="grid"` | `<Grid>` + `<Grid.Col>` |
| `className="space-y-4"` | `<Stack gap="md">` |
| `className="container mx-auto"` | `<Container>` |

#### Buttons & Inputs
| Tailwind | Mantine Äquivalent |
|----------|-------------------|
| `<button className="...">` | `<Button>` |
| `<input type="text" className="...">` | `<TextInput>` |
| `<input type="checkbox" className="...">` | `<Checkbox>` oder `<Switch>` |
| `<input type="number" className="...">` | `<NumberInput>` |
| `<select className="...">` | `<Select>` oder `<NativeSelect>` |

#### Typography & Text
| Tailwind | Mantine Äquivalent |
|----------|-------------------|
| `className="text-xl font-semibold"` | `<Title order={3}>` |
| `className="text-sm text-gray-500"` | `<Text size="sm" c="dimmed">` |

#### Colors & Styling
| Tailwind | Mantine |
|----------|---------|
| `bg-blue-500` | `bg="blue"` oder `style={{ backgroundColor: 'var(--mantine-color-blue-5)' }}` |
| `text-gray-600` | `c="dimmed"` oder `c="gray.6"` |
| `border-gray-200` | Nutze `withBorder` auf Paper/Card Komponenten |

---

### Reihenfolge der Migration:

1. ✅ FileUploader.tsx (einfachste Komponente)
2. ✅ ViewToggle.tsx
3. ✅ Sidebar.tsx
4. ✅ GraphControls.tsx (komplex)
5. ✅ App.tsx (Layout & Stats)

---

## 📚 Ressourcen

- **Mantine Docs**: https://mantine.dev/
- **Mantine Components**: https://mantine.dev/core/getting-started/
- **Theme Object**: https://mantine.dev/theming/theme-object/
- **Styling**: https://mantine.dev/styles/style-props/

---

## ⚠️ Wichtige Hinweise

### GraphView.tsx
- **Nicht ändern!** Diese Komponente nutzt Cytoscape.js direkt
- Container-Styling kann mit Mantine-Klassen umgeben werden

### Bundle Size
- Mantine ist etwas größer als Tailwind (~70-100 KB gzipped)
- Tree-shaking durch ES Modules gut unterstützt
- Nur importierte Komponenten landen im Bundle
