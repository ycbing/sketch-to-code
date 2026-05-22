/**
 * Parse multi-file output from AI generated text.
 *
 * Expected format:
 *   ---FILE: /App.tsx---
 *   (code)
 *
 *   ---FILE: /components/Header.tsx---
 *   (code)
 *
 * If no ---FILE: markers found, the entire text is treated as a single /App.js file.
 */

const FILE_DELIMITER = /^---FILE:\s*(.+?)---\s*$/gm;

export interface ParsedFiles {
  files: Record<string, string>;
  fileNames: string[];
}

export function parseGeneratedFiles(text: string): ParsedFiles {
  // Strip <<<THINKING>>> ... <<<END_THINKING>>> blocks (two-stage generation)
  const cleanedText = text.replace(/<<<THINKING>>>[\s\S]*?<<<END_THINKING>>>/g, "");

  // Check if the text uses the multi-file format
  const matches = Array.from(cleanedText.matchAll(FILE_DELIMITER));

  if (matches.length === 0) {
    // Single file mode: treat entire cleaned text as /App.js
    const code = cleanedText.trim();
    if (!code) {
      return { files: {}, fileNames: [] };
    }
    return {
      files: { "/App.js": code },
      fileNames: ["/App.js"],
    };
  }

  const files: Record<string, string> = {};
  const fileNames: string[] = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const filePath = match[1].trim();
    const codeStart = match.index! + match[0].length;
    const codeEnd = i + 1 < matches.length ? matches[i + 1].index! : cleanedText.length;

    let code = cleanedText.slice(codeStart, codeEnd).trim();

    // Remove leading/trailing markdown code fences if present
    // e.g. ```tsx\n...\n```
    code = code.replace(/^```(?:tsx|jsx|javascript|js|css|ts)?\s*\n?/, "");
    code = code.replace(/\n?```\s*$/, "");

    if (code) {
      // Normalize: ensure path starts with /
      const normalizedPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
      files[normalizedPath] = code;
      fileNames.push(normalizedPath);
    }
  }

  return { files, fileNames };
}
