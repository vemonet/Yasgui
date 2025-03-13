import {
  EditorView,
  keymap,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  lineNumbers,
  highlightActiveLineGutter,
} from "@codemirror/view";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
} from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { indentWithTab, defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { search, searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { linter, lintGutter, lintKeymap } from "@codemirror/lint";
import { sparql } from "codemirror-lang-sparql";
import { sparqlLinter } from "./extensions/sparql-linter";
import { wordHover } from "./extensions/tooltip";
import { sparqlCompletions } from "./extensions/autocomplete";

// https://github.com/aatauil/sparql-editor/blob/master/src/index.ts
// https://github.com/aatauil/codemirror-lang-sparql

const defaultQuery = `# https://www.bgee.org/sparql/
PREFIX genex: <http://purl.org/genex#>
PREFIX orth: <http://purl.org/net/orth#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX obo: <http://purl.obolibrary.org/obo/>
PREFIX up: <http://purl.uniprot.org/core/>

SELECT DISTINCT ?geneName ?anatName WHERE {
    ?seq a orth:Gene ;
        genex:isExpressedIn ?anat ;
        rdfs:label ?geneName .
    ?anat a genex:AnatomicalEntity ;
        rdfs:label ?anatName .
    ?seq orth:organism ?organism .
    ?organism obo:RO_0002162  ?species .
    ?species a up:Taxon ;
        up:scientificName "Homo sapiens" .
    FILTER (CONTAINS(LCASE(?geneName), "collagen"))
}`;

export class Yasqe extends EditorView {
  public rootEl: HTMLDivElement;
  // private cmView: EditorView;
  // private static storageNamespace = "triply";
  // public autocompleters: { [name: string]: Autocompleter.Completer | undefined } = {};
  // private prevQueryValid = false;
  // public queryValid = true;
  // public lastQueryDuration: number | undefined;
  // private req: Request | undefined;
  // private abortController: AbortController | undefined;
  // private queryStatus: "valid" | "error" | undefined;
  // private queryBtn: HTMLButtonElement | undefined;
  // private resizeWrapper?: HTMLDivElement;
  // public storage: YStorage;
  // public config: Config;
  // public persistentConfig: PersistentConfig | undefined;

  constructor(parent: HTMLElement, conf: any = {}) {
    super({
      doc: defaultQuery,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
          indentWithTab,
        ]),
        // ^basicSetup https://github.com/codemirror/basic-setup/blob/main/src/codemirror.ts#L50
        sparql(),
        search({ top: true }),
        lintGutter(),
        linter(sparqlLinter),
        wordHover,
        sparqlCompletions,
      ],
    });
    if (!parent) throw new Error("No parent passed as argument. Dont know where to draw YASQE");
    this.rootEl = document.createElement("div");
    this.rootEl.className = "yasqe";
    parent.appendChild(this.rootEl);
    this.rootEl.appendChild(this.dom);
    // this.config = merge({}, Yasqe.defaults, conf);
  }
}

export default Yasqe;
