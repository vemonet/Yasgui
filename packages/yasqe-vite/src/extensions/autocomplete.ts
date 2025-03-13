import { Completion, CompletionResult, CompletionContext } from "@codemirror/autocomplete";
import { SyntaxNode } from "@lezer/common";
import { syntaxTree } from "@codemirror/language";
import { SparqlLanguage } from "codemirror-lang-sparql";
import { dictionary } from "../keywords";

type CompleterConfig = {
  onInitialize?: () => void;
  get: (context: CompletionContext) => CompletionResult | any;
  isValidCompletionPosition: (context: CompletionContext) => boolean;
  // preProcessToken: (yasqe: any, token: any) => any;
  // postProcessSuggestion: (yasqe: any, token: any, suggestedString: string) => string;
  // bulk: boolean;
  name: string;
};

/**
 * Provides keyword completions based on the current context.
 */
const keywordCompleter: CompleterConfig = {
  name: "keyword",
  get: (context: CompletionContext) => {
    const word = context.matchBefore(/\w*/);
    // if (!word || (word.from === word.to && !context.explicit)) return null;
    console.log(word);
    const options = Object.values(dictionary);
    return {
      from: word?.from,
      options,
      validFor: /^(@\w*)?$/,
    };
  },
  isValidCompletionPosition: (context: CompletionContext) => {
    const token = syntaxTree(context.state).resolveInner(context.pos, -1);
    if (token.type.name === "PropertyListPathNotEmpty") return false;
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return false;
    return true;
  },
};

/**
 * Provides local variable completions within a SPARQL query.
 */
const variablesCompleter: CompleterConfig = {
  name: "variable",
  get: (context: CompletionContext) => {
    const inner = syntaxTree(context.state).resolveInner(context.pos, -1);
    // console.log(inner);
    const read = (node: SyntaxNode) => context.state.doc.sliceString(node.from, node.to);
    // Collect all variable names throughout the query
    const allVariables = new Set<string>();
    const collectVariables = (node: SyntaxNode) => {
      if (node.name === "Var") {
        allVariables.add(read(node));
      }
      let child = node.firstChild;
      while (child) {
        collectVariables(child);
        child = child.nextSibling;
      }
    };
    // Start collection from the root of the syntax tree
    const root = syntaxTree(context.state).topNode;
    collectVariables(root);
    let options: Completion[] = [];
    for (const variable of allVariables) {
      options.push({
        type: "variable",
        label: variable,
        boost: 99,
      });
    }
    return {
      options,
      from: inner.from,
    };
  },
  isValidCompletionPosition: (context: CompletionContext) => {
    // Get the current word being typed
    const word = context.matchBefore(/[\?$]?\w*/);
    if (!word) return false;
    // Get the text of the current word
    const currentText = context.state.doc.sliceString(word.from, word.to);
    // Check if it starts with ? or $ (variable indicators in SPARQL)
    if (currentText.startsWith("?") || currentText.startsWith("$")) return true;
    return false;

    // Get the current node in the syntax tree
    // const inner = syntaxTree(context.state).resolveInner(context.pos, -1);
    // // Check if we're in a position where a variable would be valid
    // // Typically variables are valid in most SPARQL query positions
    // // except inside certain contexts like IRIs, literals, etc.
    // const nodeName = inner.name;
    // const invalidNodeTypes = ["String", "RDFLiteral", "IRIREF", "PNAME_LN", "PNAME_NS"];
    // if (invalidNodeTypes.includes(nodeName)) {
    //   return false;
    // }
    // return true;
  },
};

const completionsList: CompleterConfig[] = [variablesCompleter, keywordCompleter];

/**
 * Provides SPARQL completions based on the current context.
 * @param {CompletionContext} context - The context in which completion is requested.
 * @returns {CompletionResult | null} - A completion result containing keyword options or null if no completion is applicable.
 */
export function sparqlCompletionSource(context: CompletionContext) {
  for (const completer of completionsList) {
    if (completer.isValidCompletionPosition(context)) {
      return completer.get(context);
    }
  }
}

/**
 * SPARQL completions configuration.
 */
export const sparqlCompletions = SparqlLanguage.data.of({
  autocomplete: sparqlCompletionSource,
});
