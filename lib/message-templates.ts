export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function renderNotificationTemplate(
  template: string,
  variables: Record<string, string | number | boolean | null | undefined>
) {
  return Object.entries(variables).reduce((result, [key, value]) => {
    const normalizedKey = key.startsWith("{") ? key : `{${key}}`;
    const normalizedValue = value == null ? "" : String(value);
    return result.replace(new RegExp(escapeRegExp(normalizedKey), "g"), normalizedValue);
  }, template);
}

