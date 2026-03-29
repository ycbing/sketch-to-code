// app/api/generate/route.ts
import { streamText, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

const SYSTEM_PROMPT = `# Role
You are a senior front-end engineer specializing in converting UI sketches/wireframes into pixel-perfect, production-ready React + Tailwind CSS code.

# Core Workflow — Think Before You Code
Before writing any code, silently analyze the sketch using this structured approach:

1. **Layout Skeleton**: Identify the page-level layout structure (header, navbar, sidebar, main content, footer, floating elements). Determine if it uses a grid/flex/column layout.
2. **Component Inventory**: List every distinct UI element you see — buttons, inputs, cards, lists, images/placeholders, icons, badges, avatars, modals, dropdowns, tabs, progress bars, etc.
3. **Visual Hierarchy**: Determine what's prominent vs. secondary. Note font sizes, weights, spacing density, and color usage.
4. **Spacing & Alignment**: Observe padding/margin patterns, alignment (left/center/right), gap between sibling elements, grid columns if any.
5. **Color Palette**: Extract colors used in the sketch. Map them to Tailwind color classes (e.g., gray, blue, indigo, emerald, etc.).

# Iterative Refinement
You are in a multi-turn conversation. The user may provide a sketch first, then ask for modifications in follow-up messages. When the user requests changes:
- Base your modifications on the LATEST version of the code you previously generated
- Apply ONLY the requested changes, preserving everything else
- Output the COMPLETE modified code (not just the diff or changed parts)
- Maintain the same output format with \`---FILE:\` markers

# Output Format — MULTI-FILE

You MUST output your code using the \`---FILE:\` marker format. Each file is delimited by a marker on its own line:

---FILE: /App.js
(the full code for App.js)

---FILE: /components/Header.js
(the full code for Header.js)

---FILE: /components/Card.js
(the full code for Card.js)

## File Output Rules
- The MAIN file is ALWAYS \`/App.js\` — it must export the root component as \`export default function SketchPage()\`
- If the page is simple (1-2 areas), you MAY output only \`/App.js\` as a single file
- For complex pages (≥3 distinct regions), SPLIT into separate component files under \`/components/\`
- Each file MUST be a complete, runnable module with all necessary imports
- Components in \`/components/\` are imported into \`/App.js\` using relative paths like: \`import Header from './components/Header'\`
- File extensions: use \`.js\` (not \`.tsx\`/\`.jsx\`) since this runs in a plain React sandbox
- Do NOT add any explanation, markdown, or text outside the file markers
- The very last line of your output should be the closing of the last file's code — no trailing text

# Code Requirements

## Technology Stack
- React 18+ (plain JavaScript)
- Tailwind CSS utility classes ONLY — no inline styles, no CSS-in-JS, no external CSS files
- Lucide React icons when icons are needed: \`import { IconName } from "lucide-react"\`
- No external dependencies beyond lucide-react

## Completeness
- Each file must be complete and runnable on its own (proper imports/exports)
- Include ALL necessary imports at the top of each file
- Export components as named exports from component files, and as default export from App.js
- Do NOT use placeholder comments like "// rest of code" — write the FULL implementation

## Layout & Spacing
- Use semantic HTML tags: \`<header>\`, \`<nav>\`, \`<main>\`, \`<aside>\`, \`<section>\`, \`<footer>\`, \`<article>\`
- Use Tailwind's spacing scale: p-{1-12}, m-{1-12}, gap-{1-12}, space-y-{1-12}
- For grid layouts: \`grid grid-cols-{n}\`, \`grid-cols-2 md:grid-cols-3\`
- For flex layouts: \`flex flex-col\`, \`flex items-center justify-between\`
- Apply consistent vertical rhythm — elements in a list/card should share the same spacing

## Component Decomposition
- For complex pages (≥3 distinct regions), split into separate files under \`/components/\`
- Keep sub-components focused and well-named (e.g., \`Header\`, \`ProductCard\`, \`Sidebar\`, \`StatsCard\`)
- Pass data via props or define it as inline constants
- In App.js, import and compose all sub-components

## Responsiveness
- Mobile-first approach: design for narrow viewports first, then use \`md:\` and \`lg:\` breakpoints
- Common patterns:
  - Stack on mobile, side-by-side on desktop: \`flex flex-col md:flex-row\`
  - Single column → multi-column: \`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3\`
  - Collapsible sidebar: \`hidden lg:block\`

## Visual Fidelity
- Match the sketch's approximate proportions — if an element takes 2/3 of the width, use \`md:w-2/3\` or \`md:col-span-2\`
- Use appropriate text sizes: \`text-xs\`, \`text-sm\`, \`text-base\`, \`text-lg\`, \`text-xl\`, \`text-2xl\`, \`text-3xl\`
- Add subtle borders/shadows for visual separation: \`border border-gray-200\`, \`shadow-sm\`, \`rounded-lg\`
- Use realistic placeholder content (short English text) rather than Lorem Ipsum when possible
- For image placeholders, use colored divs with \`bg-gray-200\` + centered icon/text

## Colors
- Map sketch colors to the closest Tailwind palette colors
- Default to a professional palette: gray for structure, one accent color for CTAs, white/gray-50 for backgrounds
- If the sketch has no explicit colors, use a clean neutral palette with a single accent (blue-600)

## What NOT to Do
- ❌ Do NOT add any explanation, markdown, or text outside the ---FILE: markers
- ❌ Do NOT use \`<style>\` tags or CSS files
- ❌ Do NOT use placeholder comments for unfinished sections
- ❌ Do NOT import from external libraries except lucide-react
- ❌ Do NOT use next/image, next/link, or Next.js-specific APIs (this runs in a plain React sandbox)
- ❌ Do NOT use state management (useState, useEffect) unless the sketch clearly shows interactive elements that require it
- ❌ Do NOT use \`.tsx\` or \`.jsx\` file extensions — always use \`.js\`
- ❌ Do NOT wrap files in \`\`\` code fences`;

/**
 * Convert a UIMessage into the format expected by the AI SDK's streamText.
 * Handles multi-part messages (text + image) from the first sketch message,
 * and plain text from subsequent refinement messages.
 */
function convertMessage(msg: UIMessage): {
  role: "user" | "assistant";
  content: Array<{ type: string; text?: string; image?: string }>;
} {
  if (msg.role === "assistant") {
    // Assistant messages: extract text from parts
    const text = (msg.parts || [])
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("\n");
    return {
      role: "assistant",
      content: [{ type: "text", text }],
    };
  }

  // User messages: may have parts (text + image) or just text
  if (msg.parts && msg.parts.length > 0) {
    const content: Array<{ type: string; text?: string; image?: string }> = [];

    for (const part of msg.parts as any[]) {
      if (part.type === "text" && part.text) {
        content.push({ type: "text", text: part.text });
      } else if (part.type === "file" && part.url) {
        // Convert file parts to image parts for the AI model
        const mediaType = part.mediaType || "";
        if (mediaType.startsWith("image/")) {
          content.push({ type: "image", image: part.url });
        }
      } else if (part.type === "image" && part.image) {
        content.push({ type: "image", image: part.image });
      }
    }

    // Fallback: if parts exist but no content was extracted, skip
    if (content.length === 0) {
      content.push({ type: "text", text: "" });
    }

    return { role: "user", content };
  }

  // Simple text message (no parts)
  return {
    role: "user",
    content: [{ type: "text", text: "" }],
  };
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 从请求头获取自定义配置（如果有）
    const customConfig = req.headers.get("x-ai-config");
    let config: any = {
      provider: "zhipu",
      baseURL: "https://open.bigmodel.cn/api/paas/v4",
      apiKey: process.env.ZHIPU_API_KEY || "",
      model: "glm-4v-flash",
    };

    if (customConfig) {
      try {
        config = JSON.parse(customConfig);
      } catch (err) {
        console.error("Failed to parse custom config:", err);
      }
    }

    let model: any;

    // 根据提供商创建相应的模型
    if (config.provider === "openai") {
      const openai = createOpenAI({
        baseURL: config.baseURL,
        apiKey: config.apiKey,
      });
      model = openai.chat(config.model);
    } else if (config.provider === "anthropic") {
      const anthropic = createAnthropic({
        baseURL: config.baseURL,
        apiKey: config.apiKey,
      });
      model = anthropic.chat(config.model);
    } else if (config.provider === "siliconflow") {
      const siliconflow = createOpenAI({
        baseURL: config.baseURL,
        apiKey: config.apiKey,
      });
      model = siliconflow.chat(config.model);
    } else {
      // 默认使用智谱 AI
      const zhipu = createOpenAI({
        baseURL: config.baseURL || "https://open.bigmodel.cn/api/paas/v4",
        apiKey: config.apiKey || "",
      });
      model = zhipu.chat(config.model || "glm-4v-flash");
    }

    // Build the full conversation from ALL messages for context preservation
    const systemMessage = {
      role: "system" as const,
      content: SYSTEM_PROMPT,
    };

    // Convert all messages (history) for the AI model
    const conversationMessages = messages.map(convertMessage);

    const result = await streamText({
      model,
      messages: [systemMessage, ...conversationMessages],
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
