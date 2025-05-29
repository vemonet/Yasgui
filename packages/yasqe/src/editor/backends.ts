export interface Backend {
  name: string;
  slug: string;
  url: string;
  healthCheckUrl?: string;
}

export interface PrefixMap {
  [key: string]: string;
}

export interface Queries {
  [key: string]: string;
}

export interface BackendConf {
  backend: Backend;
  prefixMap: PrefixMap;
  queries: Queries;
  default: boolean;
}

// export const backends: BackendConf[] = yaml.parse(backend_configurations);

export const backends: BackendConf[] = [
  {
    backend: {
      name: "UniProt",
      slug: "uniprot",
      url: "https://qlever.cs.uni-freiburg.de/api/uniprot",
      healthCheckUrl: "https://qlever.cs.uni-freiburg.de/api/uniprot/ping",
    },
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
    },
    default: true,
    queries: {
      subjectCompletion:
        '{% for prefix in prefixes %}\nPREFIX {{prefix.0}}: <{{prefix.1}}>\n{% endfor %}\n\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX up: <http://purl.uniprot.org/core/>\nPREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\nSELECT ?qlue_ls_entity (SAMPLE(?label) as ?qlue_ls_label) WHERE {\n  ?qlue_ls_entity rdf:type up:Protein ; rdfs:label ?label .\n  {% if search_term %}\n  FILTER REGEX(?label, "^{{ search_term }}")\n  {% endif %}\n}\nGROUP BY ?qlue_ls_entity\nORDER BY DESC(COUNT(?qlue_ls_entity))\nLIMIT {{ limit }} OFFSET {{ offset }}',
      predicateCompletion:
        '{% for prefix in prefixes %}\nPREFIX {{prefix.0}}: <{{prefix.1}}>\n{% endfor %}\n\nSELECT ?qlue_ls_entity  WHERE {\n  { SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?count) WHERE\n    { {{context}} }\n    GROUP BY ?qlue_ls_entity }\n  {% if search_term %}\n  FILTER REGEX(STR(?qlue_ls_entity), "{{ search_term }}", "i")\n  {% endif %}\n} ORDER BY DESC(?qlue_ls_count)\nLIMIT {{ limit }} OFFSET {{ offset }}',
      objectCompletion:
        '{% for prefix in prefixes %}\nPREFIX {{prefix.0}}: <{{prefix.1}}>\n{% endfor %}\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nSELECT ?qlue_ls_entity (MIN(?name) AS ?qlue_ls_label) (MIN(?alias) AS ?qlue_ls_alias) (MAX(?count) AS ?qlue_ls_count) WHERE {\n  {\n    { SELECT ?qlue_ls_entity ?name ?alias ?count WHERE {\n      { SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?count) WHERE {\n        {{context}}\n      } GROUP BY ?qlue_ls_entity }\n      ?qlue_ls_entity rdfs:label ?name BIND(?name AS ?alias)\n      {% if search_term %}\n      FILTER REGEX(STR(?alias), "^{{ search_term }}")\n      {% endif %}\n    } }\n  } UNION {\n   { SELECT ?qlue_ls_entity ?name ?alias ?count WHERE {\n      { SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?count) WHERE {\n        {{context}}\n      } GROUP BY ?qlue_ls_entity }\n      ?qlue_ls_entity up:scientificName ?name BIND(?name AS ?alias)\n      {% if search_term %}\n      FILTER REGEX(STR(?alias), "^{{ search_term }}")\n      {% endif %}\n    } }\n  } UNION {\n    { SELECT ?qlue_ls_entity ?name ?alias ?count WHERE {\n      { SELECT ?qlue_ls_entity (COUNT(?qlue_ls_entity) AS ?count) WHERE {\n        {{context}}\n      } GROUP BY ?qlue_ls_entity }\n      BIND(?qlue_ls_entity AS ?name) BIND(?qlue_ls_entity AS ?alias)\n      {% if search_term %}\n      FILTER REGEX(STR(?alias), "^{{ search_term }}")\n      {% endif %}\n    } }\n  }\n} GROUP BY ?qlue_ls_entity ORDER BY DESC(?qlue_ls_count)\nLIMIT {{ limit }} OFFSET {{ offset }}',
    },
  },
];
