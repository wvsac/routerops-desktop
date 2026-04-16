import type { AliasCommand } from "@/domain/models";

type AliasDraft = Omit<AliasCommand, "id">;

const clean = (value: string) => value.trim();

const toTitle = (value: string) =>
  value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const parseImportedAliases = (content: string, platformTag: string): AliasDraft[] => {
  const lines = content.split(/\r?\n/);
  const output: AliasDraft[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    i += 1;

    if (!line || line.startsWith("#")) continue;

    const aliasMatch = line.match(/^alias\s+([A-Za-z_][\w-]*)=(['"])([\s\S]*)\2$/);
    if (aliasMatch) {
      const routerAliasName = aliasMatch[1];
      const command = clean(aliasMatch[3]);
      output.push({
        name: toTitle(routerAliasName),
        kind: "alias",
        command,
        description: "Imported from shell script",
        tags: ["imported"],
        platformTags: [platformTag],
        dangerous: false,
        requiresConfirmation: false,
        exportToRouter: true,
        routerAliasName,
      });
      continue;
    }

    const oneLineFunction = line.match(/^([A-Za-z_][\w-]*)\s*\(\)\s*\{\s*(.*?)\s*\}$/);
    if (oneLineFunction) {
      const routerAliasName = oneLineFunction[1];
      output.push({
        name: toTitle(routerAliasName),
        kind: "function",
        command: clean(oneLineFunction[2]),
        description: "Imported bash function",
        tags: ["imported", "function"],
        platformTags: [platformTag],
        dangerous: false,
        requiresConfirmation: false,
        exportToRouter: true,
        routerAliasName,
      });
      continue;
    }

    const multiLineStart = line.match(/^([A-Za-z_][\w-]*)\s*\(\)\s*\{$/);
    if (multiLineStart) {
      const routerAliasName = multiLineStart[1];
      const functionBody: string[] = [];
      while (i < lines.length) {
        const bodyLine = lines[i];
        i += 1;
        if (bodyLine.trim() === "}") break;
        functionBody.push(bodyLine);
      }
      const command = functionBody.join("\n").trim();
      if (command) {
        output.push({
          name: toTitle(routerAliasName),
          kind: "function",
          command,
          description: "Imported bash function",
          tags: ["imported", "function"],
          platformTags: [platformTag],
          dangerous: false,
          requiresConfirmation: false,
          exportToRouter: true,
          routerAliasName,
        });
      }
    }
  }

  return output;
};
