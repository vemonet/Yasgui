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

export const sparqlThemeSolarizedDark = {
  name: "SPARQL Solarized Dark Theme",
  type: "dark",
  colors: {
    "editor.foreground": "#839496", // base0 - solarized
    "editor.background": "#002b36", // base03 - solarized dark background
    "editor.selectionBackground": "#073642", // base02 - solarized
    "editor.lineHighlightBackground": "#073642", // base02 - solarized
    "editorCursor.foreground": "#fdf6e3", // base3 - solarized
    "editorWhitespace.foreground": "#586e75", // base01 - solarized
    "editorIndentGuide.activeBackground": "#cb4b1680", // keeping from light theme but with transparency
    "editor.selectionHighlightBorder": "#d33682", // magenta - solarized accent
  },
  tokenColors: [
    {
      scope: "keyword.control.sparql",
      settings: {
        foreground: "#859900", // green - solarized (inspired by light theme's purple)
        // fontStyle: "bold",
      },
    },
    {
      scope: "keyword.operator.function.sparql",
      settings: {
        foreground: "#cb4b16", // orange - solarized (keeping from light theme)
        // fontStyle: "bold",
      },
    },
    // {
    //   scope: "keyword.operator.function.sparql",
    //   settings: {
    //     foreground: "#dc322f", // red - solarized (keeping from light theme)
    //     fontStyle: "bold",
    //   },
    // },
    {
      scope: "keyword.operator.prefixdecl.sparql",
      settings: {
        foreground: "#859900", // green - solarized (matching control keywords)
        fontStyle: "bold",
      },
    },
    // {
    //   scope: "variable.prefix.sparql",
    //   settings: {
    //     foreground: "#dc322f", // red - solarized (inspired by light theme's orange)
    //     fontStyle: "italic",
    //   },
    // },
    // {
    //   scope: "variable.reference.sparql",
    //   settings: {
    //     foreground: "#dc322f", // red - solarized (matching prefix variables)
    //     fontStyle: "italic",
    //   },
    // },
    {
      scope: "variable.prefix.sparql",
      settings: {
        foreground: "#FF5600", // orange - solarized (inspired by light theme's orange)
        fontStyle: "italic",
      },
    },
    {
      scope: "variable.reference.sparql",
      settings: {
        foreground: "#FF5600", // orange - solarized (matching prefix variables)
        fontStyle: "italic",
      },
    },
    // {
    //   scope: "variable.prefix.sparql",
    //   settings: {
    //     foreground: "#cb4b16", // orange - solarized (inspired by light theme's orange)
    //     fontStyle: "italic",
    //   },
    // },
    // {
    //   scope: "variable.reference.sparql",
    //   settings: {
    //     foreground: "#cb4b16", // orange - solarized (matching prefix variables)
    //     fontStyle: "italic",
    //   },
    // },
    {
      scope: "variable.other.sparql",
      settings: {
        foreground: "#268bd2", // blue - solarized (inspired by light theme's blue)
      },
    },
    {
      scope: "constant.other.iri.sparql",
      settings: {
        foreground: "#2aa198", // cyan - solarized (inspired by light theme's green)
      },
    },
    {
      scope: "constant.numeric",
      settings: {
        foreground: "#2aa198", // cyan - solarized (keeping consistent with light theme)
      },
    },
    {
      scope: "string",
      settings: {
        foreground: "#b58900", // yellow - solarized (inspired by light theme's red)
        // fontStyle: "bold italic",
      },
    },
    {
      scope: "keyword.symbol",
      settings: {
        foreground: "#93a1a1", // base1 - solarized (light gray for symbols)
        fontStyle: "bold",
      },
    },
  ],
};
