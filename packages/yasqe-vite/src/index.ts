import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab, defaultKeymap } from "@codemirror/commands";
import { search } from "@codemirror/search";
import { linter, lintGutter } from "@codemirror/lint";
import { basicSetup } from "codemirror";
import { sparql } from "codemirror-lang-sparql";
import { sparqlLinter } from "./extensions/sparql-linter";
import { wordHover } from "./extensions/tooltip";
import { sparqlKeywordCompletions, sparqlLocalCompletions } from "./extensions/autocomplete";

// https://github.com/aatauil/sparql-editor/blob/master/src/index.ts
// https://github.com/aatauil/codemirror-lang-sparql

const defaultQuery = `SELECT * WHERE {
  ?s ?p ?o .
} LIMIT 10`;

export class Yasqe {
  public rootEl: HTMLDivElement;
  private cmView: EditorView;
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
    // super();
    if (!parent) throw new Error("No parent passed as argument. Dont know where to draw YASQE");
    this.rootEl = document.createElement("div");
    this.rootEl.className = "yasqe";
    parent.appendChild(this.rootEl);
    // this.config = merge({}, Yasqe.defaults, conf);

    this.cmView = new EditorView({
      parent: this.rootEl,
      doc: defaultQuery,
      extensions: [
        basicSetup,
        keymap.of([...defaultKeymap, indentWithTab]),
        sparql(),
        search({ top: true }),
        lintGutter(),
        linter(sparqlLinter),
        wordHover,
        sparqlKeywordCompletions,
        sparqlLocalCompletions,
      ],
    });
  }
}

export default Yasqe;
