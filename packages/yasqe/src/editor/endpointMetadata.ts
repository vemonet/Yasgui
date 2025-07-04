// import YStorage from "@zazuko/yasgui-utils/src/Storage";

// https://sparql.uniprot.org/sparql/
// https://qlever.cs.uni-freiburg.de/api/uniprot
// https://dbpedia.org/sparql/

export interface BackendDetails {
  name: string;
  slug: string;
  url: string;
  healthCheckUrl?: string;
}

export interface PrefixMap {
  [key: string]: string;
}

export interface CompletionQueries {
  [key: string]: string;
}

export interface Backend {
  backend: BackendDetails;
  prefixMap: PrefixMap;
  queries: CompletionQueries;
  default: boolean;
}

/**
 * Creates a backend configuration, optionally with minimal fallback prefixes
 * @param endpoint The SPARQL endpoint URL
 * @param options Configuration options including prefixMap
 */
export async function createBackendConf(endpoint: string, options: { prefixMap?: any } = {}): Promise<Backend> {
  let prefixMap = options.prefixMap;
  // If no prefixMap provided or empty, try to fetch from endpoint
  if (!prefixMap || Object.keys(prefixMap).length === 0) {
    try {
      prefixMap = await fetchPrefixMap(endpoint);
    } catch (error) {
      console.warn(`Failed to fetch prefix map from ${endpoint}, using fallback`, error);
      prefixMap = baseBackend.prefixMap;
    }
  }
  return {
    backend: {
      name: extractEndpointName(endpoint),
      slug: generateSlug(endpoint),
      url: endpoint,
      healthCheckUrl: endpoint,
    },
    prefixMap: prefixMap,
    queries: baseBackend.queries,
    default: false,
  };
}

/**
 * Execute a SPARQL query against an endpoint
 */
export async function executeSparqlQuery(endpoint: string, query: string): Promise<any> {
  const url = new URL(endpoint);
  url.searchParams.set("query", query);
  const response = await fetch(url.toString(), {
    method: "GET",
    signal: AbortSignal.timeout(5000),
    headers: {
      Accept: "application/sparql-results+json",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return await response.json();
}

/**
 * Extract a human-readable name from an endpoint URL
 */
function extractEndpointName(endpointUrl: string): string {
  try {
    const hostname = new URL(endpointUrl).hostname;
    // Remove www. prefix and common subdomains
    const cleanHostname = hostname.replace(/^(www\.|sparql\.|query\.)/, "");
    // Capitalize first letter
    return cleanHostname.charAt(0).toUpperCase() + cleanHostname.slice(1);
  } catch {
    return endpointUrl;
  }
}

/**
 * Generate a slug from an endpoint URL
 */
function generateSlug(endpointUrl: string): string {
  try {
    const hostname = new URL(endpointUrl).hostname;
    return hostname.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  } catch {
    return endpointUrl.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  }
}

/**
 * Fetch prefix map from SPARQL endpoint using SPARQL query
 */
export async function fetchPrefixMap(endpoint: string): Promise<PrefixMap> {
  // Get prefixes from the SPARQL endpoint using SHACL
  const prefixes: { [key: string]: string } = {};
  try {
    const queryResults = await executeSparqlQuery(
      endpoint,
      `PREFIX sh: <http://www.w3.org/ns/shacl#>
      SELECT DISTINCT ?prefix ?namespace
      WHERE { [] sh:namespace ?namespace ; sh:prefix ?prefix}
      ORDER BY ?prefix`
    );
    const bindings = (await queryResults).results.bindings;
    // Track used namespaces to avoid duplicates
    const usedNamespaces = new Set<string>();
    bindings.forEach((b: any) => {
      const prefix = b.prefix.value;
      const namespace = b.namespace.value;
      // Only add if namespace hasn't been used and prefix doesn't already exist
      if (!usedNamespaces.has(namespace) && !prefixes[prefix]) {
        prefixes[prefix] = namespace;
        usedNamespaces.add(namespace);
      }
    });
  } catch (error: any) {
    console.log(`Error retrieving Prefixes from ${endpoint}:`, error.message || error);
  }
  if (Object.keys(prefixes).length === 0) {
    return {
      rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      rdfs: "http://www.w3.org/2000/01/rdf-schema#",
      owl: "http://www.w3.org/2002/07/owl#",
      xsd: "http://www.w3.org/2001/XMLSchema#",
      skos: "http://www.w3.org/2004/02/skos/core#",
      foaf: "http://xmlns.com/foaf/0.1/",
      dc: "http://purl.org/dc/elements/1.1/",
      dcterms: "http://purl.org/dc/terms/",
    };
  }
  return prefixes;
}

export const baseBackend = {
  default: false,
  prefixMap: {
    annotation: "http://purl.uniprot.org/annotation/",
    bibo: "http://purl.org/ontology/bibo/",
    busco: "http://busco.ezlab.org/schema#",
    chebi: "http://purl.obolibrary.org/obo/CHEBI_",
    citation: "http://purl.uniprot.org/citations/",
    cito: "http://purl.org/spar/cito/",
    dcat: "http://www.w3.org/ns/dcat#",
    dcmit: "http://purl.org/dc/dcmitype/",
    dcterms: "http://purl.org/dc/terms/",
    disease: "http://purl.uniprot.org/diseases/",
    ECO: "http://purl.obolibrary.org/obo/ECO_",
    "embl-cds": "http://purl.uniprot.org/embl-cds/",
    ensembl: "http://rdf.ebi.ac.uk/resource/ensembl/",
    enzyme: "http://purl.uniprot.org/enzyme/",
    faldo: "http://biohackathon.org/resource/faldo#",
    foaf: "http://xmlns.com/foaf/0.1/",
    go: "http://purl.obolibrary.org/obo/GO_",
    hs: "https://hamap.expasy.org/rdf/vocab#",
    isoform: "http://purl.uniprot.org/isoforms/",
    keywords: "http://purl.uniprot.org/keywords/",
    location: "http://purl.uniprot.org/locations/",
    obo: "http://purl.obolibrary.org/obo/",
    oboInOwl: "http://www.geneontology.org/formats/oboInOwl#",
    owl: "http://www.w3.org/2002/07/owl#",
    patent: "http://purl.uniprot.org/EPO/",
    pav: "http://purl.org/pav/",
    position: "http://purl.uniprot.org/position/",
    prism: "http://prismstandard.org/namespaces/basic/2.0/",
    pubmed: "http://purl.uniprot.org/pubmed/",
    range: "http://purl.uniprot.org/range/",
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    rh: "http://rdf.rhea-db.org/",
    schema: "http://schema.org/",
    sd: "http://www.w3.org/ns/sparql-service-description#",
    sh: "http://www.w3.org/ns/shacl#",
    skos: "http://www.w3.org/2004/02/skos/core#",
    sp: "http://spinrdf.org/sp#",
    ssmRegion: "http://purl.uniprot.org/signatureSequenceMatch/",
    stato: "http://purl.obolibrary.org/obo/STATO_",
    taxon: "http://purl.uniprot.org/taxonomy/",
    tissue: "http://purl.uniprot.org/tissues/",
    uniparc: "http://purl.uniprot.org/uniparc/",
    uniprot: "http://purl.uniprot.org/uniprot/",
    up: "http://purl.uniprot.org/core/",
    voag: "http://voag.linkedmodel.org/schema/voag#",
    void: "http://rdfs.org/ns/void#",
    xsd: "http://www.w3.org/2001/XMLSchema#",
    genex: "http://purl.org/genex#",
  },
  queries: {
    subjectCompletion: `{% include "prefix_declarations" %}

PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX up: <http://purl.uniprot.org/core/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT ?qlue_ls_entity (SAMPLE(?label) as ?qlue_ls_label) WHERE {
  ?qlue_ls_entity rdf:type ?type ; rdfs:label ?label .
  {% if search_term_uncompressed %}
  FILTER (REGEX(STR(?qlue_ls_entity), "^{{ search_term_uncompressed }}"))
  {% elif search_term %}
  FILTER REGEX(?label, "^{{ search_term }}")
  {% endif %}
}
GROUP BY ?qlue_ls_entity
ORDER BY DESC(COUNT(?qlue_ls_entity))
LIMIT {{ limit }} OFFSET {{ offset }}`,
    predicateCompletion: `{% include "prefix_declarations" %}

SELECT ?qlue_ls_entity ?qlue_ls_score WHERE {
  { SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?qlue_ls_score) WHERE
    {
      {{local_context}}
    }
    GROUP BY ?qlue_ls_entity }
  {% if search_term_uncompressed %}
  FILTER (REGEX(STR(?qlue_ls_entity), "^{{ search_term_uncompressed }}"))
  {% elif search_term %}
  FILTER REGEX(STR(?qlue_ls_entity), "{{ search_term }}", "i")
  {% endif %}
} ORDER BY DESC(?qlue_ls_score)
LIMIT {{ limit }} OFFSET {{ offset }}`,
    objectCompletion: `{% include "prefix_declarations" %}
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX up: <http://purl.uniprot.org/core/>
SELECT ?qlue_ls_entity (MIN(?name) AS ?qlue_ls_label) (MIN(?alias) AS ?qlue_ls_alias) (MAX(?count) AS ?qlue_ls_count) WHERE {
  {
    { SELECT ?qlue_ls_entity ?name ?alias ?count WHERE {
      { SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?count) WHERE {
        {{local_context}}
      } GROUP BY ?qlue_ls_entity }
      ?qlue_ls_entity rdfs:label ?name BIND(?name AS ?alias)
      {% if search_term_uncompressed %}
      FILTER (REGEX(STR(?qlue_ls_entity), "^{{ search_term_uncompressed }}"))
      {% elif search_term %}
      FILTER REGEX(STR(?alias), "^{{ search_term }}")
      {% endif %}
    } }
  } UNION {
    { SELECT ?qlue_ls_entity ?name ?alias ?count WHERE {
      { SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?count) WHERE {
        {{local_context}}
      } GROUP BY ?qlue_ls_entity }
      ?qlue_ls_entity up:scientificName ?name BIND(?name AS ?alias)
      {% if search_term_uncompressed %}
      FILTER (REGEX(STR(?qlue_ls_entity), "^{{ search_term_uncompressed }}"))
      {% elif search_term %}
      FILTER REGEX(STR(?alias), "^{{ search_term }}")
      {% endif %}
    } }
  } UNION {
    { SELECT ?qlue_ls_entity ?name ?alias ?count WHERE {
      { SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?count) WHERE {

        {{local_context}}
      } GROUP BY ?qlue_ls_entity }
      BIND(?qlue_ls_entity AS ?name) BIND(?qlue_ls_entity AS ?alias)
      {% if search_term_uncompressed %}
      FILTER (REGEX(STR(?qlue_ls_entity), "^{{ search_term_uncompressed }}"))
      {% elif search_term %}
      FILTER REGEX(STR(?alias), "^{{ search_term }}")
      {% endif %}
    } }
  }
} GROUP BY ?qlue_ls_entity ORDER BY DESC(?qlue_ls_count)
LIMIT {{ limit }} OFFSET {{ offset }}`,
    predicateCompletionContextSensitive: `{% include "prefix_declarations" %}
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
{% if subject is not variable %}

SELECT ?qlue_ls_entity (SAMPLE(?qlue_ls_label_or_null) AS ?qlue_ls_label) ?qlue_ls_count WHERE {
  {
    SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?qlue_ls_count) WHERE {
      {{ local_context }}
    }
    GROUP BY ?qlue_ls_entity
  }
  OPTIONAL { ?qlue_ls_entity rdfs:label ?qlue_ls_label_or_null }
  BIND (COALESCE(?qlue_ls_label_or_null, ?qlue_ls_entity) AS ?label)
  {% if search_term_uncompressed %}
  FILTER (REGEX(STR(?qlue_ls_entity), "^{{ search_term_uncompressed }}"))
  {% elif search_term %}
  FILTER REGEX(STR(?label), "{{ search_term }}", "i")
  {% endif %}
}
GROUP BY ?qlue_ls_entity ?qlue_ls_count
ORDER BY DESC(?qlue_ls_count)

{% else %}

SELECT ?qlue_ls_entity (SAMPLE(?qlue_ls_label_or_null) AS ?qlue_ls_label) ?qlue_ls_count WHERE {
  {% if not context %}
  {
    SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?qlue_ls_count) WHERE {
      {{ local_context }}
    }
    GROUP BY ?qlue_ls_entity
  }
  {% else %}
  {
    SELECT ?qlue_ls_entity (COUNT(DISTINCT {{ subject }}) AS ?qlue_ls_count) WHERE {
      {{ context }} {{ local_context }}
    }
    GROUP BY ?qlue_ls_entity
  }
  {% endif %}
  OPTIONAL { ?qlue_ls_entity rdfs:label ?qlue_ls_label_or_null }
  BIND (COALESCE(?qlue_ls_label_or_null, ?qlue_ls_entity) AS ?label)
  {% if search_term_uncompressed %}
  FILTER (REGEX(STR(?qlue_ls_entity), "^{{ search_term_uncompressed }}"))
  {% elif search_term %}
  FILTER REGEX(STR(?label), "{{ search_term }}", "i")
  {% endif %}
}
GROUP BY ?qlue_ls_entity ?qlue_ls_count
ORDER BY DESC(?qlue_ls_count)

{% endif %}
LIMIT {{ limit }} OFFSET {{ offset }}`,
    objectCompletionContextSensitive: `{% include "prefix_declarations" %}
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?qlue_ls_entity ?qlue_ls_label ?qlue_ls_count WHERE {
  {
    SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?qlue_ls_count) WHERE {
      {{ context }} {{ local_context }} .
    }
    GROUP BY ?qlue_ls_entity
  }
  OPTIONAL {
    ?qlue_ls_entity rdf:type [ rdfs:label ?qlue_ls_label_or_null ] .
  }
  OPTIONAL { ?qlue_ls_entity rdfs:label ?qlue_ls_label_or_null }
  BIND (COALESCE(?qlue_ls_label_or_null, ?qlue_ls_entity) AS ?qlue_ls_label)
  {% if search_term_uncompressed %}
  FILTER (REGEX(STR(?qlue_ls_entity), "^{{ search_term_uncompressed }}"))
  {% elif search_term %}
  FILTER REGEX(STR(?qlue_ls_label), "^{{ search_term }}")
  {% endif %}
}
ORDER BY DESC(?qlue_ls_count)
LIMIT {{ limit }} OFFSET {{ offset }}`,

    // subjectCompletion:
    //   '{% for prefix in prefixes %}\nPREFIX {{prefix.0}}: <{{prefix.1}}>\n{% endfor %}\n\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX up: <http://purl.uniprot.org/core/>\nPREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\nSELECT ?qlue_ls_entity (SAMPLE(?label) as ?qlue_ls_label) WHERE {\n  ?qlue_ls_entity rdf:type up:Protein ; rdfs:label ?label .\n  {% if search_term %}\n  FILTER REGEX(?label, "^{{ search_term }}")\n  {% endif %}\n}\nGROUP BY ?qlue_ls_entity\nORDER BY DESC(COUNT(?qlue_ls_entity))\nLIMIT {{ limit }} OFFSET {{ offset }}',
    // predicateCompletion:
    //   '{% for prefix in prefixes %}\nPREFIX {{prefix.0}}: <{{prefix.1}}>\n{% endfor %}\n\nSELECT ?qlue_ls_entity  WHERE {\n  { SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?count) WHERE\n    { {{context}} }\n    GROUP BY ?qlue_ls_entity }\n  {% if search_term %}\n  FILTER REGEX(STR(?qlue_ls_entity), "{{ search_term }}", "i")\n  {% endif %}\n} ORDER BY DESC(?qlue_ls_count)\nLIMIT {{ limit }} OFFSET {{ offset }}',
    // objectCompletion:
    //   '{% for prefix in prefixes %}\nPREFIX {{prefix.0}}: <{{prefix.1}}>\n{% endfor %}\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nSELECT ?qlue_ls_entity (MIN(?name) AS ?qlue_ls_label) (MIN(?alias) AS ?qlue_ls_alias) (MAX(?count) AS ?qlue_ls_count) WHERE {\n  {\n    { SELECT ?qlue_ls_entity ?name ?alias ?count WHERE {\n      { SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?count) WHERE {\n        {{context}}\n      } GROUP BY ?qlue_ls_entity }\n      ?qlue_ls_entity rdfs:label ?name BIND(?name AS ?alias)\n      {% if search_term %}\n      FILTER REGEX(STR(?alias), "^{{ search_term }}")\n      {% endif %}\n    } }\n  } UNION {\n   { SELECT ?qlue_ls_entity ?name ?alias ?count WHERE {\n      { SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?count) WHERE {\n        {{context}}\n      } GROUP BY ?qlue_ls_entity }\n      ?qlue_ls_entity up:scientificName ?name BIND(?name AS ?alias)\n      {% if search_term %}\n      FILTER REGEX(STR(?alias), "^{{ search_term }}")\n      {% endif %}\n    } }\n  } UNION {\n    { SELECT ?qlue_ls_entity ?name ?alias ?count WHERE {\n      { SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?count) WHERE {\n        {{context}}\n      } GROUP BY ?qlue_ls_entity }\n      BIND(?qlue_ls_entity AS ?name) BIND(?qlue_ls_entity AS ?alias)\n      {% if search_term %}\n      FILTER REGEX(STR(?alias), "^{{ search_term }}")\n      {% endif %}\n    } }\n  }\n} GROUP BY ?qlue_ls_entity ORDER BY DESC(?qlue_ls_count)\nLIMIT {{ limit }} OFFSET {{ offset }}',
    // predicateCompletionContextSensitive:
    //   '{% for prefix in prefixes %}\nPREFIX {{prefix.0}}: <{{prefix.1}}>\n{% endfor %}\n\nSELECT ?qlue_ls_entity  WHERE {\n  { SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?count) WHERE\n    { {{context}} }\n    GROUP BY ?qlue_ls_entity }\n  {% if search_term %}\n  FILTER REGEX(STR(?qlue_ls_entity), "{{ search_term }}", "i")\n  {% endif %}\n} ORDER BY DESC(?qlue_ls_count)\nLIMIT {{ limit }} OFFSET {{ offset }}',
    // objectCompletionContextSensitive:
    //   '{% for prefix in prefixes %}\nPREFIX {{prefix.0}}: <{{prefix.1}}>\n{% endfor %}\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nSELECT ?qlue_ls_entity (MIN(?name) AS ?qlue_ls_label) (MIN(?alias) AS ?qlue_ls_alias) (MAX(?count) AS ?qlue_ls_count) WHERE {\n  {\n    { SELECT ?qlue_ls_entity ?name ?alias ?count WHERE {\n      { SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?count) WHERE {\n        {{context}}\n      } GROUP BY ?qlue_ls_entity }\n      ?qlue_ls_entity rdfs:label ?name BIND(?name AS ?alias)\n      {% if search_term %}\n      FILTER REGEX(STR(?alias), "^{{ search_term }}")\n      {% endif %}\n    } }\n  } UNION {\n   { SELECT ?qlue_ls_entity ?name ?alias ?count WHERE {\n      { SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?count) WHERE {\n        {{context}}\n      } GROUP BY ?qlue_ls_entity }\n      ?qlue_ls_entity up:scientificName ?name BIND(?name AS ?alias)\n      {% if search_term %}\n      FILTER REGEX(STR(?alias), "^{{ search_term }}")\n      {% endif %}\n    } }\n  } UNION {\n    { SELECT ?qlue_ls_entity ?name ?alias ?count WHERE {\n      { SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?count) WHERE {\n        {{context}}\n      } GROUP BY ?qlue_ls_entity }\n      BIND(?qlue_ls_entity AS ?name) BIND(?qlue_ls_entity AS ?alias)\n      {% if search_term %}\n      FILTER REGEX(STR(?alias), "^{{ search_term }}")\n      {% endif %}\n    } }\n  }\n} GROUP BY ?qlue_ls_entity ORDER BY DESC(?qlue_ls_count)\nLIMIT {{ limit }} OFFSET {{ offset }}',
  },
};

// export const backends: BackendConf[] = yaml.parse(backend_configurations);

// export const backends: BackendConf[] = [
//   {
//     ...baseBackend,
//     default: true,
//     backend: {
//       name: "UniProt Qlever",
//       slug: "uniprot-qlever",
//       url: "https://qlever.cs.uni-freiburg.de/api/uniprot",
//       healthCheckUrl: "https://qlever.cs.uni-freiburg.de/api/uniprot/ping",
//     },
//   },
//   {
//     ...baseBackend,
//     backend: {
//       name: "UniProt",
//       slug: "uniprot",
//       url: "https://sparql.uniprot.org/sparql/",
//       healthCheckUrl: "https://qlever.cs.uni-freiburg.de/api/uniprot/ping",
//     },
//   },
//   {
//     ...baseBackend,
//     backend: {
//       name: "Bgee",
//       slug: "bgee",
//       url: "https://www.bgee.org/sparql/",
//       healthCheckUrl: "https://qlever.cs.uni-freiburg.de/api/uniprot/ping",
//     },
//   },
//   {
//     ...baseBackend,
//     backend: {
//       name: "OMA",
//       slug: "oma",
//       url: "https://sparql.omabrowser.org/sparql/",
//       healthCheckUrl: "https://qlever.cs.uni-freiburg.de/api/uniprot/ping",
//     },
//   },
// ];

// export interface EndpointMetadata {
//   // prefixMap: PrefixMap;
//   // queries: Queries;
//   backend: BackendConf;
//   lastFetched: number; // Timestamp
//   version: string; // For cache invalidation
// }

// export interface EndpointMetadataStorage {
//   [endpoint: string]: EndpointMetadata;
// }

// /**
//  * Manages metadata (prefix maps and query examples) for SPARQL endpoints
//  */
// export class EndpointMetadataManager {
//   private storage: YStorage;
//   private storageKey = "endpointMetadata";
//   private cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
//   private metadataCache: EndpointMetadataStorage = {};

//   constructor() {
//     this.storage = new YStorage("yasgui");
//     this.loadFromStorage();
//   }

//   /**
//    * Load metadata from localStorage
//    */
//   private loadFromStorage(): void {
//     try {
//       const stored = this.storage.get<EndpointMetadataStorage>(this.storageKey);
//       if (stored) {
//         this.metadataCache = stored;
//       }
//     } catch (error) {
//       console.warn("Failed to load endpoint metadata from storage:", error);
//       this.metadataCache = {};
//     }
//   }

//   /**
//    * Save metadata to localStorage
//    */
//   private saveToStorage(): void {
//     try {
//       this.storage.set(
//         this.storageKey,
//         this.metadataCache,
//         this.cacheExpiry / 1000, // Convert to seconds
//         () => {
//           console.warn("LocalStorage quota exceeded for endpoint metadata");
//         }
//       );
//     } catch (error) {
//       console.warn("Failed to save endpoint metadata to storage:", error);
//     }
//   }

//   /**
//    * Check if metadata exists and is not expired for the given endpoint
//    */
//   public hasValidMetadata(endpoint: string): boolean {
//     const metadata = this.metadataCache[endpoint];
//     if (!metadata) return false;
//     const now = Date.now();
//     return (now - metadata.lastFetched) < this.cacheExpiry;
//   }

//   /**
//    * Get cached metadata for an endpoint
//    */
//   public getMetadata(endpoint: string): EndpointMetadata | null {
//     if (this.hasValidMetadata(endpoint)) {
//       return this.metadataCache[endpoint];
//     }
//     return null;
//   }

//   /**
//    * Fetch prefix map from SPARQL endpoint using SPARQL query
//    */
//   private async fetchPrefixMap(endpoint: string): Promise<PrefixMap> {
//     // Get prefixes from the SPARQL endpoint using SHACL
//     const prefixes: {[key: string]: string} = {};
//     try {
//       const queryResults = await this.executeSparqlQuery(
//         endpoint,
//         `PREFIX sh: <http://www.w3.org/ns/shacl#>
//         SELECT DISTINCT ?prefix ?namespace
//         WHERE { [] sh:namespace ?namespace ; sh:prefix ?prefix}
//         ORDER BY ?prefix`,
//       );
//       const bindings = (await queryResults).results.bindings;
//       // Track used namespaces to avoid duplicates
//       const usedNamespaces = new Set<string>();
//       bindings.forEach((b: any) => {
//         const prefix = b.prefix.value;
//         const namespace = b.namespace.value;
//         // Only add if namespace hasn't been used and prefix doesn't already exist
//         if (!usedNamespaces.has(namespace) && !prefixes[prefix]) {
//           prefixes[prefix] = namespace;
//           usedNamespaces.add(namespace);
//         }
//       });
//     } catch (error: any) {
//       console.log(`Error retrieving Prefixes from ${endpoint}:`, error.message || error);
//     }
//     if (Object.keys(prefixes).length === 0) {
//       return {
//           rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
//           rdfs: "http://www.w3.org/2000/01/rdf-schema#",
//           owl: "http://www.w3.org/2002/07/owl#",
//           xsd: "http://www.w3.org/2001/XMLSchema#",
//           skos: "http://www.w3.org/2004/02/skos/core#",
//           foaf: "http://xmlns.com/foaf/0.1/",
//           dc: "http://purl.org/dc/elements/1.1/",
//           dcterms: "http://purl.org/dc/terms/"
//       }
//     }
//     return prefixes;
//   }

// //   /**
// //    * Fetch example queries for an endpoint
// //    */
// //   private async fetchExampleQueries(endpoint: string): Promise<CompletionQueries> {
// //     // For now, return some basic example queries
// //     // In the future, this could query the endpoint for example queries stored in the triplestore
// //     return {
// //       basicSelect: `SELECT ?subject ?predicate ?object WHERE {
// //   ?subject ?predicate ?object .
// // } LIMIT 10`,
// //       countTriples: `SELECT (COUNT(*) AS ?count) WHERE {
// //   ?s ?p ?o .
// // }`,
// //       classesCount: `SELECT ?class (COUNT(?instance) AS ?count) WHERE {
// //   ?instance a ?class .
// // }
// // GROUP BY ?class
// // ORDER BY DESC(?count)
// // LIMIT 20`,
// //       predicatesCount: `SELECT ?predicate (COUNT(*) AS ?count) WHERE {
// //   ?s ?predicate ?o .
// // }
// // GROUP BY ?predicate
// // ORDER BY DESC(?count)
// // LIMIT 20`
// //     };
// //   }

// /**
//    * Fetch prefix map from SPARQL endpoint using SPARQL query
//    */
//   private async fetchPrefixMap(endpoint: string): Promise<PrefixMap> {
//     // Get prefixes from the SPARQL endpoint using SHACL
//     const prefixes: {[key: string]: string} = {};
//     try {
//       const queryResults = await this.executeSparqlQuery(
//         endpoint,
//         `PREFIX sh: <http://www.w3.org/ns/shacl#>
//         SELECT DISTINCT ?prefix ?namespace
//         WHERE { [] sh:namespace ?namespace ; sh:prefix ?prefix}
//         ORDER BY ?prefix`,
//       );
//       const bindings = (await queryResults).results.bindings;
//       // Track used namespaces to avoid duplicates
//       const usedNamespaces = new Set<string>();
//       bindings.forEach((b: any) => {
//         const prefix = b.prefix.value;
//         const namespace = b.namespace.value;
//         // Only add if namespace hasn't been used and prefix doesn't already exist
//         if (!usedNamespaces.has(namespace) && !prefixes[prefix]) {
//           prefixes[prefix] = namespace;
//           usedNamespaces.add(namespace);
//         }
//       });
//     } catch (error: any) {
//       console.log(`Error retrieving Prefixes from ${endpoint}:`, error.message || error);
//     }
//     if (Object.keys(prefixes).length === 0) {
//       return {
//           rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
//           rdfs: "http://www.w3.org/2000/01/rdf-schema#",
//           owl: "http://www.w3.org/2002/07/owl#",
//           xsd: "http://www.w3.org/2001/XMLSchema#",
//           skos: "http://www.w3.org/2004/02/skos/core#",
//           foaf: "http://xmlns.com/foaf/0.1/",
//           dc: "http://purl.org/dc/elements/1.1/",
//           dcterms: "http://purl.org/dc/terms/"
//       }
//     }
//     return prefixes;
//   }

//   /**
//    * Execute a SPARQL query against an endpoint
//    */
//   private async executeSparqlQuery(endpoint: string, query: string): Promise<any> {
//     const url = new URL(endpoint);
//     url.searchParams.set('query', query);
//     const response = await fetch(url.toString(), {
//       method: 'GET',
//       signal: AbortSignal.timeout(5000),
//       headers: {
//         'Accept': 'application/sparql-results+json'
//       }
//     });
//     if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//     return await response.json();
//   }

//   /**
//    * Fetch metadata for an endpoint if not cached or expired
//    */
//   public async fetchMetadata(endpoint: string): Promise<EndpointMetadata> {
//     // Check if we have valid cached metadata and force is not requested
//     // if (!force && this.hasValidMetadata(endpoint)) {
//     //   return this.metadataCache[endpoint];
//     // }
//     console.log(`Fetching metadata for endpoint: ${endpoint}`);
//     try {
//       // // Fetch both prefix map and example queries in parallel
//       // const [prefixMap, queries] = await Promise.all([
//       //   this.fetchPrefixMap(endpoint),
//       //   this.fetchExampleQueries(endpoint)
//       // ]);
//       const prefixMap = await this.fetchPrefixMap(endpoint);

//       const metadata: EndpointMetadata = {
//         backend: this.createBackendConf(endpoint, {prefixMap}),
//         lastFetched: Date.now(),
//         version: "1.0"
//       };
//       // Store in cache and persist to storage
//       console.log(`Fetched`, metadata);
//       this.metadataCache[endpoint] = metadata;
//       this.saveToStorage();
//       return metadata;
//     } catch (error) {
//       console.error(`Failed to fetch metadata for endpoint ${endpoint}:`, error);
//       const fallbackMetadata: EndpointMetadata = {
//         backend: this.createBackendConf(endpoint),
//         lastFetched: Date.now(),
//         version: "1.0"
//       };
//       // Still cache the fallback to avoid repeated failed requests
//       this.metadataCache[endpoint] = fallbackMetadata;
//       this.saveToStorage();
//       return fallbackMetadata;
//     }
//   }

//   /**
//    * Clear all cached metadata
//    */
//   public clearCache(): void {
//     this.metadataCache = {};
//     this.storage.remove(this.storageKey);
//   }

//   /**
//    * Clear metadata for a specific endpoint
//    */
//   public clearEndpointMetadata(endpoint: string): void {
//     delete this.metadataCache[endpoint];
//     this.saveToStorage();
//   }

//   /**
//    * Get all cached endpoints
//    */
//   public getCachedEndpoints(): string[] {
//     return Object.keys(this.metadataCache);
//   }

//   // /**
//   //  * Convert metadata to BackendConf format for compatibility with existing system
//   //  */
//   // public toBackendConf(endpoint: string, metadata?: EndpointMetadata): BackendConf | null {
//   //   const meta = metadata || this.getMetadata(endpoint);
//   //   if (!meta) return null;

//   //   return {
//   //     backend: {
//   //       name: this.extractEndpointName(endpoint),
//   //       slug: this.generateSlug(endpoint),
//   //       url: endpoint
//   //     },
//   //     prefixMap: meta.prefixMap,
//   //     // queries: meta.queries,
//   //     default: false
//   //   };
//   // }

//   /**
//    * Extract a human-readable name from an endpoint URL
//    */
//   private extractEndpointName(endpoint: string): string {
//     try {
//       const url = new URL(endpoint);
//       const hostname = url.hostname;

//       // Remove www. prefix and common subdomains
//       const cleanHostname = hostname.replace(/^(www\.|sparql\.|query\.)/, '');

//       // Capitalize first letter
//       return cleanHostname.charAt(0).toUpperCase() + cleanHostname.slice(1);
//     } catch {
//       return "SPARQL Endpoint";
//     }
//   }

//   /**
//    * Generate a slug from an endpoint URL
//    */
//   private generateSlug(endpoint: string): string {
//     try {
//       const url = new URL(endpoint);
//       const hostname = url.hostname;
//       return hostname.replace(/[^a-z0-9]/gi, '_').toLowerCase();
//     } catch {
//       return "sparql_endpoint";
//     }
//   }

//   /**
//    * Sets up backend configuration for an endpoint using metadata or defaults
//    * @param endpoint The SPARQL endpoint URL
//    * @param yasqe The YASQE instance to update
//    * @param updateLanguageClientBackend Function to update the language client backend
//    */
//   public async setupEndpointBackend(
//     endpoint: string,
//     updateLanguageClientBackend: (backendConf: any) => void
//   ): Promise<void> {
//     try {
//       // Check if we have cached metadata for this endpoint
//       let backendConf;
//       const cachedMetadata = this.getMetadata(endpoint);

//       if (cachedMetadata) {
//         // Use cached metadata
//         backendConf = cachedMetadata.backend;
//       } else {
//         // Fetch metadata in parallel (non-blocking)
//         this.fetchMetadata(endpoint).then((metadata) => {
//           if (metadata.backend) {
//             updateLanguageClientBackend(metadata.backend);
//           }
//         }).catch((err) => {
//           console.warn("Failed to fetch endpoint metadata:", err);
//         });
//         // Create default backend configuration
//         backendConf = this.createBackendConf(endpoint);
//       }

//       // Update the language client with the backend configuration
//       if (backendConf) {
//         updateLanguageClientBackend(backendConf);
//       }
//     } catch (error) {
//       console.error("Error setting up endpoint backend:", error);
//       // Fallback: create minimal default backend
//       const fallbackBackend = this.createBackendConf(endpoint);
//       if (fallbackBackend) updateLanguageClientBackend(fallbackBackend);
//     }
//   }

//   /**
//    * Creates a backend configuration, optionally with minimal fallback prefixes
//    * @param endpoint The SPARQL endpoint URL
//    * @param minimal If true, uses only basic RDF prefixes as fallback
//    */
//   public createBackendConf(endpoint: string, options: {prefixMap?: any} = {}): BackendConf {
//     // Use minimal prefixes if requested, otherwise use baseBackend prefixes
//     return {
//       backend: {
//         name: this.extractEndpointName(endpoint),
//         slug: this.generateSlug(endpoint),
//         url: endpoint,
//         healthCheckUrl: endpoint,
//       },
//       prefixMap: options.prefixMap ? options.prefixMap : baseBackend.prefixMap,
//       queries: baseBackend.queries,
//       default: false
//     };
//   }
// }

// // Export singleton instance
// export const endpointMetadataManager = new EndpointMetadataManager();
