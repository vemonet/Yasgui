/**
 * Generic, schema-driven settings panel for a language server (classic DOM, no Monaco UI).
 *
 * A language server can describe its tunable settings with a {@link LanguageServerSettingsSchema}
 * (a small JSON-schema subset) via `LanguageServerDef.configSchema`. Yasqe renders this modal from
 * that schema and, on Apply, hands the collected values back to `LanguageServerDef.configCallback`,
 * which pushes them to the running server. Yasqe itself stays language-server agnostic: it never
 * knows what the settings mean, only how to render and collect them.
 */

/** A single configurable field. The property key may be dotted (e.g. `format.tabSize`). */
export interface SettingFieldSchema {
  /** Widget/value type: checkbox, number input, or text/select. */
  type: "boolean" | "number" | "string";
  /** Human label shown next to the field (defaults to the property key). */
  title?: string;
  /** Optional helper text shown under the field. */
  description?: string;
  /** Default value, used when no value has been applied yet and by the Reset button. */
  default?: boolean | number | string;
  /** When set, a `string` field renders as a `<select>` of these options. */
  enum?: (string | number)[];
  /** Bounds for `number` fields. */
  minimum?: number;
  maximum?: number;
  /** Optional section heading the field is grouped under (e.g. "Formatting"). */
  group?: string;
}

/** Describes the settings a language server exposes; drives the {@link openSettingsPanel} modal. */
export interface LanguageServerSettingsSchema {
  /** Panel heading (defaults to `<server> settings`). */
  title?: string;
  /** The configurable fields, keyed by (optionally dotted) setting path. */
  properties: Record<string, SettingFieldSchema>;
}

export interface SettingsPanelOptions {
  /** Element to overlay the modal in (the yasqe root; must be `position: relative`). */
  root: HTMLElement;
  schema: LanguageServerSettingsSchema;
  /** Server label, used for the default panel title. */
  serverLabel: string;
  /** Currently applied values as a flat `{ [dottedKey]: value }` map. */
  current: Record<string, unknown>;
  /** Called with the collected flat values when the user clicks Apply. */
  onApply: (values: Record<string, unknown>) => void;
}

function fieldDefault(field: SettingFieldSchema): boolean | number | string {
  if (field.default !== undefined) return field.default;
  if (field.type === "boolean") return false;
  if (field.type === "number") return 0;
  if (field.enum?.length) return field.enum[0];
  return "";
}

/**
 * Open the settings modal. Returns a dispose function that removes it. The modal is modal-ish: a
 * backdrop covers the editor, Esc and a backdrop click cancel, Apply commits via `onApply`.
 */
export function openSettingsPanel(opts: SettingsPanelOptions): () => void {
  const { root, schema, serverLabel, current, onApply } = opts;

  const backdrop = document.createElement("div");
  backdrop.className = "yasqe-settings-backdrop";

  const dialog = document.createElement("div");
  dialog.className = "yasqe-settings-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");

  const header = document.createElement("div");
  header.className = "yasqe-settings-header";
  const title = document.createElement("h3");
  title.className = "yasqe-settings-title";
  title.textContent = schema.title ?? `${serverLabel} settings`;
  header.appendChild(title);
  dialog.appendChild(header);

  const body = document.createElement("div");
  body.className = "yasqe-settings-body";
  dialog.appendChild(body);

  // Per-field "read current widget value" closures, keyed by setting path, plus a "set" used by Reset.
  const readers = new Map<string, () => boolean | number | string>();
  const resetters: (() => void)[] = [];

  // Group the fields, preserving insertion order; ungrouped fields go in a leading anonymous section.
  const groups = new Map<string, [string, SettingFieldSchema][]>();
  for (const [key, field] of Object.entries(schema.properties)) {
    const g = field.group ?? "";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push([key, field]);
  }

  for (const [groupName, fields] of groups) {
    const section = document.createElement("div");
    section.className = "yasqe-settings-section";
    if (groupName) {
      const legend = document.createElement("div");
      legend.className = "yasqe-settings-legend";
      legend.textContent = groupName;
      section.appendChild(legend);
    }
    for (const [key, field] of fields) {
      const def = fieldDefault(field);
      const value = current[key] ?? def;
      const row = document.createElement("label");
      row.className = "yasqe-settings-row";
      const labelText = field.title ?? key;

      if (field.type === "boolean") {
        row.classList.add("yasqe-settings-row-bool");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = Boolean(value);
        const span = document.createElement("span");
        span.textContent = labelText;
        row.appendChild(input);
        row.appendChild(span);
        readers.set(key, () => input.checked);
        resetters.push(() => {
          input.checked = Boolean(def);
        });
      } else {
        const span = document.createElement("span");
        span.className = "yasqe-settings-label";
        span.textContent = labelText;
        row.appendChild(span);
        if (field.type === "string" && field.enum?.length) {
          const select = document.createElement("select");
          for (const opt of field.enum) {
            const o = document.createElement("option");
            o.value = String(opt);
            o.textContent = String(opt);
            select.appendChild(o);
          }
          select.value = String(value);
          row.appendChild(select);
          readers.set(key, () => select.value);
          resetters.push(() => {
            select.value = String(def);
          });
        } else {
          const input = document.createElement("input");
          input.type = field.type === "number" ? "number" : "text";
          if (field.type === "number") {
            if (field.minimum !== undefined) input.min = String(field.minimum);
            if (field.maximum !== undefined) input.max = String(field.maximum);
          }
          input.value = String(value);
          row.appendChild(input);
          readers.set(key, () =>
            field.type === "number" ? (input.value === "" ? Number(def) : Number(input.value)) : input.value,
          );
          resetters.push(() => {
            input.value = String(def);
          });
        }
      }
      section.appendChild(row);
      if (field.description) {
        const help = document.createElement("div");
        help.className = "yasqe-settings-help";
        help.textContent = field.description;
        section.appendChild(help);
      }
    }
    body.appendChild(section);
  }

  const footer = document.createElement("div");
  footer.className = "yasqe-settings-footer";
  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "yasqe-settings-btn yasqe-settings-btn-secondary";
  resetBtn.textContent = "Reset";
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "yasqe-settings-btn yasqe-settings-btn-secondary";
  cancelBtn.textContent = "Cancel";
  const applyBtn = document.createElement("button");
  applyBtn.type = "button";
  applyBtn.className = "yasqe-settings-btn yasqe-settings-btn-primary";
  applyBtn.textContent = "Apply";
  footer.append(resetBtn, cancelBtn, applyBtn);
  dialog.appendChild(footer);

  backdrop.appendChild(dialog);
  root.appendChild(backdrop);

  const dispose = () => {
    document.removeEventListener("keydown", onKey, true);
    backdrop.remove();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      dispose();
    }
  };
  document.addEventListener("keydown", onKey, true);

  backdrop.addEventListener("mousedown", (e) => {
    if (e.target === backdrop) dispose();
  });
  resetBtn.addEventListener("click", () => resetters.forEach((r) => r()));
  cancelBtn.addEventListener("click", dispose);
  applyBtn.addEventListener("click", () => {
    const values: Record<string, unknown> = {};
    for (const [key, read] of readers) values[key] = read();
    onApply(values);
    dispose();
  });

  return dispose;
}
