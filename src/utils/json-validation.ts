export function isValidJson(str: string): boolean {
  try {
    if (str.trim() === "") return true;
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export function formatJson(str: string): string {
  try {
    const obj = JSON.parse(str);
    return JSON.stringify(obj, null, 2);
  } catch {
    return str;
  }
}

export function tryParseJson(str: string): any {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}
