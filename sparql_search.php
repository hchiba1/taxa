<?php
header("Access-Control-Allow-Origin: *");
header("Content-type:text/javascript");
mb_language("japanese");
mb_internal_encoding("UTF-8");
mb_http_output("UTF-8");

/* $ortho_endpoint = 'https://orth.dbcls.jp/sparql?query='; */
/* $ortho_endpoint = 'https://sparql-proxy.orth.dbcls.jp/sparql?query='; */
$ortho_endpoint = 'http://localhost:9005/sparql?query=';

/* $dbpedia_endpoint = 'http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query='; */
$dbpedia_endpoint = 'http://localhost:9009/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=';

function curlRequest($url){
    if (!function_exists('curl_init')){ 
	    die('Curl is not installed!');
    }
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('accept:application/sparql-results+json'));
    $json = curl_exec($ch);
    curl_close($ch);
    return $json;
}

if (isset($_GET['genome_type'])) { /* Get taxa as candidates */
    $query = '
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX up: <http://purl.uniprot.org/core/>
PREFIX upTax: <http://purl.uniprot.org/taxonomy/>
PREFIX ortho: <https://orth.dbcls.jp/rdf/ontology#>

SELECT ?depth ?name (?taxon AS ?taxid) ?count
WHERE {
  {
    SELECT ?taxon (COUNT(?proteome) AS ?count)
    WHERE {
      ?proteome a up:Proteome;
      up:organism ?up_taxid ;
      rdfs:label ?org_label .
      ?up_taxid rdfs:subClassOf? ?taxon .
    }
  }
  ?taxon up:scientificName ?name ;
  up:rank ?rank .
  ?rank ortho:taxRankDepth ?depth .
}
ORDER BY DESC(?count) ?depth ?name
    ';
    $jsonarray = json_decode(curlRequest($ortho_endpoint . urlencode($query)), true);
    $array=array(); 
    for($i=0; $i< count($jsonarray['results']['bindings']); $i++) {
	    $name = $jsonarray['results']['bindings'][$i]['name']['value'];
	    $array[$name] = 1;
    }
    echo json_encode($array, true);


} else if (isset($_GET["sci_name"])) { /* Scientific name to taxID */
    $query = '
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX up: <http://purl.uniprot.org/core/>
PREFIX ortho: <https://orth.dbcls.jp/rdf/ontology#>

SELECT ?rank ?taxon (COUNT(?organism) AS ?count)
WHERE {
  ?organism a up:Proteome ;
      up:organism ?up_taxid .
  ?up_taxid rdfs:subClassOf? ?taxon .
  ?taxon up:scientificName "' . $_GET["sci_name"] . '" ;
      up:rank ?rank .
  ?rank ortho:taxRankDepth ?depth .
}
ORDER BY ?count
  ';
    echo curlRequest($ortho_endpoint . urlencode($query));


} else if (isset($_GET["taxid_to_get_dataset"])) {
    $query = '
PREFIX mbgd: <http://purl.jp/bio/11/mbgd#>
PREFIX mbgdr: <http://mbgd.genome.ad.jp/rdf/resource/>
SELECT ?count
WHERE {
    mbgdr:tax' . $_GET["taxid_to_get_dataset"] . ' mbgd:organismCount ?count .
}
    ';
    echo curlRequest($ortho_endpoint . urlencode($query));


} else if (isset($_GET["taxid_to_get_upper"])) { /* Taxonomic hierarchy */
    $query = '
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX up: <http://purl.uniprot.org/core/>
PREFIX upTax: <http://purl.uniprot.org/taxonomy/>
PREFIX taxid: <http://identifiers.org/taxonomy/>
PREFIX ortho: <https://orth.dbcls.jp/rdf/ontology#>

SELECT ?depth ?rank ?label ?taxon (COUNT(?proteome) AS ?count)
WHERE {
  ?taxon rdfs:seeAlso ?up_taxon .
  upTax:' . $_GET["taxid_to_get_upper"] . ' rdfs:subClassOf ?up_taxon .
  ?up_taxon up:rank ?rank ;
      up:scientificName ?label .
  ?rank ortho:taxRankDepth ?depth .
  ?proteome a up:Proteome ;
      rdfs:label ?organism ;
      up:organism ?up_taxid .
  ?up_taxid rdfs:subClassOf ?up_taxon .
}
ORDER BY ?depth
  ';
    echo curlRequest($ortho_endpoint . urlencode($query));


} else if (isset($_GET["taxid_to_get_lower"])) { /* Taxonomic hierarchy */
    if ($_GET["genome_type_to_search"] == "CompleteGenome") {
	    $property = "parentTaxonComplete";
    } else {
	    $property = "parentTaxonDraft";
    }
    $query = '
PREFIX up: <http://purl.uniprot.org/core/>
PREFIX upTax: <http://purl.uniprot.org/taxonomy/>
PREFIX ortho: <https://orth.dbcls.jp/rdf/ontology#>

SELECT ?rank ?label ?count
WHERE {
  ?taxon ortho:parentTaxon upTax:' . $_GET["taxid_to_get_lower"] . ' ;
      up:scientificName ?label ;
	  up:rank ?rank .
  ?rank ortho:taxRankDepth ?depth .
  {
    SELECT (COUNT(DISTINCT ?organism) AS ?count) ?taxon
    WHERE {
      ?organism up:organism ?taxid ;
          rdfs:label ?org_label ;
          a up:Proteome .
      ?taxid rdfs:subClassOf? ?taxon .
    }
  }
}
ORDER BY ?depth ?label
    ';
    echo curlRequest($ortho_endpoint . urlencode($query));


} else if (isset($_GET["taxid_to_get_sisters"])) { /* Taxonomic hierarchy */
    if ($_GET["genome_type_to_search"] == "CompleteGenome") {
	    $property = "parentTaxonComplete";
    } else {
	    $property = "parentTaxonDraft";
    }
    $query = '
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX up: <http://purl.uniprot.org/core/>
PREFIX upTax: <http://purl.uniprot.org/taxonomy/>
PREFIX ortho: <https://orth.dbcls.jp/rdf/ontology#>

SELECT ?rank ?label ?taxon ?count
WHERE {
  upTax:' . $_GET["taxid_to_get_sisters"] . ' ortho:parentTaxon ?parent .
  ?taxon ortho:parentTaxon ?parent .
  ?taxon up:scientificName ?label ;
      up:rank ?rank .
  ?rank ortho:taxRankDepth ?depth .
  {
    SELECT (COUNT(DISTINCT ?organism) AS ?count) ?taxon
    WHERE {
      ?organism up:organism ?up_taxid ;
          rdfs:label ?org_label ;
          a up:Proteome .
      ?up_taxid rdfs:subClassOf ?taxon .
    }
  }
}
ORDER BY ?depth ?label
  ';
    echo curlRequest($ortho_endpoint . urlencode($query));


} else if (isset($_GET["tax_list_to_get_local"])) { /* Translate to local language */
    $query = '
PREFIX dbpedia: <http://dbpedia.org/resource/>
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?dbpedia_resource ?label_local ?label_en
WHERE {
    VALUES (?dbpedia_resource) { ' . $_GET["tax_list_to_get_local"] . ' }
    OPTIONAL {
        ?dbpedia_resource dbo:wikiPageRedirects?/rdfs:label ?label_local .
        FILTER(lang(?label_local) = "' . $_GET["local_lang"] . '")
    }
    OPTIONAL {
        ?dbpedia_resource rdfs:label ?label_en .
        FILTER(lang(?label_en) = "en")
    }
}
        ';
    echo curlRequest($dbpedia_endpoint . urlencode($query));


} else if (isset($_GET["taxon_to_default_orgs"])) { /* Get default organisms in taxon */
    $query = '
PREFIX taxid: <http://identifiers.org/taxonomy/>
PREFIX mbgd: <http://purl.jp/bio/11/mbgd#>
PREFIX mbgdr: <http://mbgd.genome.ad.jp/rdf/resource/>
SELECT (COUNT(?genome) AS ?count)
WHERE {
    mbgdr:default mbgd:organism ?genome .
    ?genome mbgd:inTaxon taxid:' . $_GET["taxon_to_default_orgs"] . ' .
}
    ';
    echo curlRequest($ortho_endpoint . urlencode($query));


} else if (isset($_GET["dbpedia_entry"])) { /* DBpedia information */
    $local_lang_list = '("en")';
    if ($_GET["local_lang"] && $_GET["local_lang"] != 'en') {
	    $local_lang_list = '("en") ("' . $_GET["local_lang"] . '")';
    }
    $query = '
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX dbpedia: <http://dbpedia.org/resource/>
SELECT ?label ?abst ?wiki ?image
WHERE {
    ' . $_GET["dbpedia_entry"] . ' dbo:wikiPageRedirects? ?dbpedia_entry .
    ?dbpedia_entry rdfs:label ?label ;
                   dbo:abstract ?abst ;
                   <http://xmlns.com/foaf/0.1/isPrimaryTopicOf> ?wiki . 
    OPTIONAL { 
        ?dbpedia_entry <http://xmlns.com/foaf/0.1/depiction> ?image .
    }
    BIND(lang(?label) AS ?lang)
    VALUES (?lang) {  ' . $local_lang_list . ' }
    BIND(lang(?abst) AS ?abst_lang)
    VALUES (?abst_lang) { ' . $local_lang_list . ' }
}
    ';
    echo curlRequest($dbpedia_endpoint . urlencode($query));


} else if (isset($_GET["taxon_to_search_genomes"])) { /* Search genomes under the taxon */
    $query = '
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX up: <http://purl.uniprot.org/core/>
PREFIX upTax: <http://purl.uniprot.org/taxonomy/>
PREFIX busco: <htttp://busco.ezlab.org/schema#>
SELECT DISTINCT ?taxid ?code ?organism ?proteins ?cpd_average ?busco_complete ?id ?proteome
WHERE {
  ?proteome a up:Proteome ;
      dct:identifier ?id ;
      rdfs:label ?organism ;
      up:proteins ?proteins ;
      up:oscode ?code ;
      up:organism ?taxid .
  ?taxid rdfs:subClassOf? upTax:' . $_GET["taxon_to_search_genomes"] . ' .
  BIND(URI(CONCAT(?proteome, "#cpd-average")) AS ?cpd_average_uri)
  ?cpd_average_uri rdf:value ?cpd_average .
  BIND(URI(CONCAT(?proteome, "#busco")) AS ?busco)
  ?busco busco:complete ?busco_complete .
}
ORDER BY ?organism
  ';
    echo curlRequest($ortho_endpoint . urlencode($query));
}

?>
