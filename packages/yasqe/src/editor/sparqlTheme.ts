export const sparqlThemeDark = {
  name: "SPARQL Custom Dark Theme",
  type: "dark",
  colors: {
    "editor.foreground": "#928364",
    "editor.background": "#282828",
    "editor.selectionBackground": "#44475a",
    "editor.lineHighlightBackground": "#32302f",
    "editorCursor.foreground": "#f8f8f0",
    "editorWhitespace.foreground": "#3B3A32",
    "editorIndentGuide.activeBackground": "#9D550FB0",
    "editor.selectionHighlightBorder": "#222218",
  },
  tokenColors: [
    {
      scope: "keyword.control.sparql",
      settings: {
        foreground: "#98971a",
        fontStyle: "bold",
      },
    },
    {
      scope: "keyword.operator.function.sparql",
      settings: {
        foreground: "#d65d0e",
        fontStyle: "bold",
      },
    },
    {
      scope: "keyword.operator.prefixdecl.sparql",
      settings: {
        foreground: "#689d6a",
        fontStyle: "bold",
      },
    },
    {
      scope: "variable.prefix.sparql",
      settings: {
        foreground: "#cc241d",
        fontStyle: "italic",
      },
    },
    {
      scope: "variable.reference.sparql",
      settings: {
        foreground: "#d79921",
        fontStyle: "italic",
      },
    },
    {
      scope: "variable.other.sparql",
      settings: {
        foreground: "#ebdbb2",
      },
    },
    {
      scope: "constant.other.iri.sparql",
      settings: {
        foreground: "#fadb2f",
      },
    },
    {
      scope: "constant.numeric",
      settings: {
        foreground: "#689d6a",
      },
    },
    {
      scope: "string",
      settings: {
        foreground: "#d79921",
        fontStyle: "bold italic",
      },
    },
    {
      scope: "keyword.symbol",
      settings: {
        foreground: "#fe8019",
        fontStyle: "italic bold",
      },
    },
  ],
};

export const sparqlThemeLight = {
  name: "SPARQL Custom Light Theme",
  type: "light",
  colors: {
    "editor.foreground": "#586e75",
    "editor.background": "#ffffff",
    "editor.selectionBackground": "#eee8d5",
    "editor.lineHighlightBackground": "#fdf6e3",
    "editorCursor.foreground": "#002b36",
    "editorWhitespace.foreground": "#93a1a1",
    "editorIndentGuide.activeBackground": "#cb4b1680",
    "editor.selectionHighlightBorder": "#d33682",
  },
  tokenColors: [
    {
      scope: "keyword.control.sparql",
      settings: {
        foreground: "#62036F",
        // fontStyle: "bold",
      },
    },
    {
      scope: "keyword.operator.function.sparql",
      settings: {
        foreground: "#cb4b16",
      },
    },
    {
      scope: "keyword.operator.prefixdecl.sparql",
      settings: {
        foreground: "#62036F",
      },
    },
    {
      scope: "variable.prefix.sparql",
      settings: {
        foreground: "#FF5600",
      },
    },
    {
      scope: "variable.reference.sparql",
      settings: {
        foreground: "#FF5600",
      },
    },
    {
      scope: "variable.other.sparql",
      settings: {
        foreground: "#219",
      },
    },
    {
      scope: "constant.other.iri.sparql",
      settings: {
        foreground: "#085",
      },
    },
    {
      scope: "constant.numeric",
      settings: {
        foreground: "#2aa198",
      },
    },
    {
      scope: "string",
      settings: {
        foreground: "#AA1011",
        // fontStyle: "bold italic",
      },
    },
    {
      scope: "keyword.symbol",
      settings: {
        foreground: "#000",
      },
    },
  ],
};
