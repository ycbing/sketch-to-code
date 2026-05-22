// lib/frameworks.ts — Multi-framework code output configuration

export type Framework = "react" | "vue" | "miniprogram" | "html";

export interface FrameworkConfig {
  id: Framework;
  name: string;
  icon: string;
  description: string;
  sandpackTemplate: string;
  extraDependencies?: Record<string, string>;
  systemPromptAddendum: string;
}

export const FRAMEWORK_CONFIGS: FrameworkConfig[] = [
  {
    id: "react",
    name: "React",
    icon: "⚛️",
    description: "React 18 + Tailwind CSS",
    sandpackTemplate: "react",
    extraDependencies: {
      "lucide-react": "^0.292.0",
    },
    systemPromptAddendum: "",
  },
  {
    id: "vue",
    name: "Vue 3",
    icon: "🟢",
    description: "Vue 3 + Composition API + Tailwind CSS",
    sandpackTemplate: "vue3",
    extraDependencies: {
      "lucide-vue-next": "^0.344.0",
    },
    systemPromptAddendum: `## Vue 3 Specific Rules

You MUST output Vue 3 code using the following conventions:

### Syntax
- Use \`<script setup>\` with Composition API (no Options API)
- Use \`import { ref, reactive, computed, onMounted } from 'vue'\`
- Use \`defineProps\` and \`defineEmits\` for component communication
- Do NOT use \`this\` keyword — it is not available in \`<script setup>\`

### File Format
- Main file: \`/src/App.vue\` (always export as default)
- Component files: \`/src/components/Header.vue\`, \`/src/components/Card.vue\`, etc.
- All component files use Single File Component (SFC) format: \`<script setup>\` + \`<template>\` + \`<style scoped>\` (only if needed)

### Component Example
\`\`\`vue
<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<template>
  <button @click="count++">{{ count }}</button>
</template>
\`\`\`

### Template Rules
- Use \`@click\`, \`@input\`, \`v-model\`, \`v-for\`, \`v-if\`, \`v-show\` directives
- Use \`:class\` and \`:style\` for dynamic bindings
- Use \`{{ }}\` for text interpolation
- Use \`v-for=\"(item, index) in items\" :key=\"item.id\"\` for lists

### Styling
- Use Tailwind CSS utility classes in templates (same as React rules)
- Only add \`<style scoped>\` if absolutely necessary for non-Tailwind styles

### Imports
- Import icons from \`lucide-vue-next\` instead of \`lucide-react\`
- Example: \`import { Search, Menu } from 'lucide-vue-next'\`

### State Management
- Use \`ref()\` for primitive values, \`reactive()\` for objects
- Use \`computed()\` for derived state
- Do NOT use Vuex or Pinia for simple components — keep state local`,
  },
  {
    id: "miniprogram",
    name: "小程序",
    icon: "📱",
    description: "微信小程序 (WXML + WXSS + JS)",
    sandpackTemplate: "vanilla",
    systemPromptAddendum: `## 微信小程序 (Mini Program) Specific Rules

You MUST output WeChat Mini Program code. The output uses Page structure with WXML + WXSS + JS.

### File Format
- Main page file: \`/index.wxml\` (template)
- Style file: \`/index.wxss\` (styles — use WXSS which supports most CSS + rpx units)
- Logic file: \`/index.js\` (Page logic using Page({}) constructor)
- Component files: \`/components/Header.wxml\`, \`/components/Header.wxss\`, \`/components/Header.js\`, \`/components/Header.json\`

### Page Structure (index.js)
\`\`\`javascript
Page({
  data: {
    message: 'Hello',
    items: []
  },
  onLoad() {
    // initialization
  },
  handleClick() {
    this.setData({ message: 'Updated' })
  }
})
\`\`\`

### WXML Rules
- Use \`wx:for=\"{{items}}\" wx:key=\"id\"\` for lists
- Use \`wx:if=\"{{condition}}\"` for conditional rendering
- Use \`bindtap=\"handleTap\"` for event binding
- Use \`{{expression}}\` for data binding
- Use \`class=\"{{active ? 'active-class' : 'normal-class'}}\"\` for dynamic classes
- NO Tailwind CSS — write regular CSS/WXSS with rpx units for responsive sizing

### WXSS Rules
- Use \`rpx\` as the primary unit (750rpx = screen width)
- Use flexbox layout extensively
- Use \`@import\` for component styles
- Support \`vw\`, \`vh\`, \`rem\`, \`px\` as fallback units

### Component Rules
- Each component needs 4 files: .wxml, .wxss, .js, .json
- Use \`Component({})\` constructor for custom components
- Use \`properties\` for props, \`data\` for internal state

### Important Constraints
- Do NOT use any npm packages or ES module imports in .js files
- Do NOT use \`import/export\` syntax — use \`require()\` if needed
- Do NOT use Tailwind CSS classes — write plain WXSS
- Use \`wx.showToast\`, \`wx.navigateTo\` etc. for WeChat APIs`,
  },
  {
    id: "html",
    name: "HTML",
    icon: "🌐",
    description: "单文件 HTML + Tailwind CSS CDN",
    sandpackTemplate: "vanilla",
    systemPromptAddendum: `## HTML Single-File Specific Rules

You MUST output a single HTML file with embedded CSS (via Tailwind CDN) and JavaScript.

### File Format
- Main file: \`/index.html\` — this is the ONLY file
- The file must be a complete, standalone HTML document
- Include \`<script src=\"https://cdn.tailwindcss.com\"></script>\` in the \`<head>\`
- All CSS uses Tailwind utility classes inline
- All JavaScript goes in \`<script>\` tags at the end of \`<body>\`

### HTML Structure
\`\`\`html
<!DOCTYPE html>
<html lang=\"zh-CN\">
<head>
  <meta charset=\"UTF-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
  <title>Page Title</title>
  <script src=\"https://cdn.tailwindcss.com\"></script>
</head>
<body>
  <!-- content here -->
  <script>
    // JavaScript here
  </script>
</body>
</html>
\`\`\`

### JavaScript Rules
- Use vanilla JavaScript (no frameworks)
- Use \`document.querySelector()\` and \`document.querySelectorAll()\` for DOM access
- Use \`addEventListener()\` for event handling
- Use template literals for dynamic HTML generation
- For interactivity: show/hide elements, toggle classes, update text content

### Constraints
- Do NOT use React, Vue, or any framework
- Do NOT create multiple files — everything goes in one HTML file
- Do NOT use npm packages or external scripts (except Tailwind CDN)
- If the user requests a complex app with state management, still output single-file HTML with well-organized vanilla JS`,
  },
];

export function getFrameworkConfig(id: Framework): FrameworkConfig | undefined {
  return FRAMEWORK_CONFIGS.find((f) => f.id === id);
}

export function getDefaultFrameworkConfig(): FrameworkConfig {
  return FRAMEWORK_CONFIGS[0]; // React
}
