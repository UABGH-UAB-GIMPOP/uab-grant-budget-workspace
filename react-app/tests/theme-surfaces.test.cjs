const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('shadcn popup surfaces compile to opaque, readable UAB colors', async () => {
  const {compile} = await import('tailwindcss');
  const source = fs.readFileSync(path.join(__dirname, '../src/style.css'), 'utf8');
  const theme = source.match(/@theme inline\s*\{[^}]+\}/)[0];
  const compiler = await compile(`${theme}\n@tailwind utilities;`);
  const css = compiler.build(['bg-popover', 'text-popover-foreground']);
  assert.match(css, /\.bg-popover\s*\{\s*background-color:\s*#ffffff;/);
  assert.match(css, /\.text-popover-foreground\s*\{\s*color:\s*#17352a;/);
});

test('shared select viewport bounds and wrapping rules remain wired to SelectContent', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/style.css'), 'utf8');
  const component = fs.readFileSync(path.join(__dirname, '../src/components/ui/select.tsx'), 'utf8');
  assert.match(component, /app-select-content relative z-50/);
  assert.match(source, /\.app-select-content\{max-width:calc\(100vw - 20px\)/);
  assert.match(source, /\.app-select-content \[role=option\]\{white-space:normal;overflow-wrap:anywhere/);
});

test('portfolio metric layout preserves unbroken currency values', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/style.css'), 'utf8');
  assert.match(source, /\.portfolio-view \.metrics strong\{overflow-wrap:normal;white-space:nowrap;font-variant-numeric:tabular-nums\}/);
  assert.match(source, /@media\(max-width:600px\)\{\.portfolio-view \.metrics\{grid-template-columns:minmax\(0,1fr\)\}\}/);
  assert.match(source, /\.portfolio-view \.metrics \.financial-status\{white-space:normal\}/);
});

test('outgoing workspace panels leave layout before destination entry focus', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/style.css'), 'utf8');
  assert.match(source, /\.workspace \[role=tabpanel\]\[data-state=inactive\]\{display:none\}/);
  assert.match(source, /\[role=tabpanel\]\[data-state=active\]\{animation:panel-enter/);
});
