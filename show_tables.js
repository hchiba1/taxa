var haystack = [];

function init() {
    var genome_type = 'CompleteGenome';
    if($('#draft').prop('checked')) {
    	genome_type = 'Genome';
    }

    haystack = [];
    $.ajaxSetup({ async: false });
    $.getJSON('sparql_search.php?genome_type=' + genome_type, function(data) {
    	for (key in data) {
    	    haystack.push(key);
    	}
    });

    var taxon_name = $('#tags').val();
    if (taxon_name) {
	show_contents(taxon_name);
    }
    $('#tags').focus();

}

$(function() {
    $("#tags").autocomplete({
	source: function(request, response) {
	    response(
		$.grep(haystack, function(value){
		    var regexp = new RegExp('\\b' + request.term, 'i');
		    return value.match(regexp);
		})
	    );
	},
	autoFocus: true,
	delay: 100,
	minLength: 1,
	select: function(e, ui) {
	    if (ui.item) { 	
		show_contents(ui.item['label']);
	    }
	}
    });

    // Type slash to focus on the text box
    $(document).keyup(function(e) {
	if ($(':focus').attr('id') != 'tags' && e.keyCode == 191) {
	    $('#tags').focus();
	    $('#tags').select();
	}
    });

    $(document).keyup(function(e) {
	if ($(':focus').attr('id') == 'tags' && e.keyCode == 13) {
	    var taxon_name = $('#tags').val();
	    if (taxon_name) {
		show_contents(taxon_name);
	    }
	}
    });

    // Select a taxon name
    $('#taxonomy_div').on('mouseover', '.taxon_clickable', function(e) {
        $(this).css("background-color","#e3e3e3");
        // $(this).siblings().css("background-color","#f5f5f5");
        $(this).siblings().css("background-color","#f0f0f0");
    });
    $('#taxonomy_div').on('mouseout', '.taxon_clickable', function(e) {
        $(this).css("background-color","#fff");
        $(this).siblings().css("background-color","#fff");
    });
    $('#taxonomy_div').on('click', '.taxon_clickable', function(e) {
    	var taxon_name = $(this).text();
	if (taxon_name) {
    	    $('#tags').val(taxon_name);
    	    show_contents(taxon_name);
	}
    });

    // Select a taxonomic rank
    $('#taxonomy_div').on('mouseover', '.rank_clickable', function(e) {
        // $(this).parent().find('td').css("background-color","#f5f5f5");
        $(this).parent().find('td').css("background-color","#f0f0f0");
        $(this).parent().find('td:nth-child(2)').css("background-color","#e3e3e3");
    });
    $('#taxonomy_div').on('mouseout', '.rank_clickable', function(e) {
        $(this).parent().find('td').css("background-color","#fff");
    });
    $('#taxonomy_div').on('click', '.rank_clickable', function(e) {
	var taxon_name = $(this).parent().find('td:nth-child(2)').text();
	if (taxon_name) {
    	    $('#tags').val(taxon_name);
    	    show_contents(taxon_name);
	    $('#tags').focus();
	}
    });

    $('#details').on('mouseover', '.genome_name', function(e) {
        $(this).parent().find('td').css("background-color","#f0f0f0");
        // $(this).css("background-color","#e6e6e6");
        $(this).css("background-color","#e3e3e3");
    });
    $('#details').on('mouseout', '.genome_name', function(e) {
        $(this).parent().find('td').css("background-color","#fff");
    });

    // Manipulate the genome "cart"
    $(document).on('click', '.add_genome', function() {
	var this_row = $(this).parent().parent();
	// Selected item
	var codename = this_row.find('td:nth-child(2)').text();
	var orgname = this_row.find('td:nth-child(5)').text();

	if (localStorage.getItem(codename)) { 
	    // Delete the item
	    localStorage.removeItem(codename);
	    $(this).children('img').attr('src', 'img/plus.png');
	} else {         
	    // Add the item
	    localStorage.setItem(codename, orgname);
	    $(this).children('img').attr('src', 'img/minus.png');
	}

	// Draw table
        show_selected_genome();
    });

    $(document).on('click', '.add_genome_all', function() {
	// Swith the icon
	if ($(this).children('img').attr('src') == 'img/plus.png') {
	    $(this).children('img').attr('src','img/minus.png');
	    var selected = 1;
	} else {
	    $(this).children('img').attr('src','img/plus.png');
	    var selected = 0;
	}
	
        for (var i=0; i<$('.add_genome').length; i++) {
	    var each_icon = $('.add_genome').eq(i);
	    var each_row = each_icon.parent().parent();
	    // Eech item
	    var codename = each_row.find('td:nth-child(2)').text();
	    var orgname = each_row.find('td:nth-child(5)').text();

            if (selected) {
		// Add the item
                if (! localStorage.getItem(codename)) {
		    localStorage.setItem(codename, orgname);
		}
		// Swith the icon
                each_icon.children('img').attr('src','img/minus.png');
            } else {
		// Delete the item
                if (localStorage.getItem(codename)) {
		    localStorage.removeItem(codename);
		}
		// Swith the icon
                each_icon.children('img').attr('src','img/plus.png');
            }
	}

	// Draw table
        show_selected_genome();
    });

});

function show_contents(taxon_name) {

    var lang = ((navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage || navigator.browserLanguage).substr(0,2);
    // var lang = 'en';
    var genome_type = 'CompleteGenome';
    if($('#draft').prop('checked')) {
	genome_type = 'Genome';
    }

    // Get tax ID
    var taxid;
    var rank;
    $.getJSON('sparql_search.php?sci_name=' + taxon_name + '&genome_type_to_search=' + genome_type, function(data) {
	data['results']['bindings'][0]['taxon']['value'].match(/(\d+)$/);
	taxid = RegExp.$1;
	rank = data['results']['bindings'][0]['rank']['value'].replace(/.*\//, '');
    });

    // Hide initial contents
    $('#initial_input_label').text('');

    // Show logo and label
    $('#further_input_label').html('Search Taxon: ');

    // Clear tables
    $('#dbpedia_div').html('');
    $('#genome_comparison_div').html('');
    $('#specific_genes_div').html('');
    $('#counter_div').html('');
    $('#details').attr('border', '0');
    $('#details').html('');

    // Show main taxon name
    var html = '<h3><i>' + taxon_name + '</i>';
    html += ' (Taxonomy ID: ' + taxid + ')';
    html += '</h3>';
    $('#main_taxon_name_div').html(html);
    
    // Show tables
    setTimeout(function(){    
	  var count = show_hierarchy(taxid, genome_type, lang);
	  var sub_html = '<font size="2"><b>';
	  sub_html += '&emsp;Found ' + count;
	  if (count == 1) {
	    sub_html += ' proteome';
	  } else {
	    sub_html += ' proteomes';
	  }
	  if (genome_type != "CompleteGenome") {
	    sub_html += ' including draft'
	  }
	  sub_html += '</b>';
	  sub_html += '<br>';
	  sub_html += '<br></font>';
	  $('#sub_title_div').html(sub_html);
    }, 0);

  setTimeout(function(){    
    show_dbpedia(taxon_name, taxid, lang);
  }, 0);

  setTimeout(function(){    
    show_genome_comparison(taxid);
  }, 0);

  setTimeout(function(){    
    show_specific_genes(taxid);
  }, 0);

  setTimeout(function(){    
	show_genome_list(rank, taxon_name, taxid, genome_type);
	$('#details').attr('border', '1');
  }, 0);

  show_selected_genome();
}

function dbpedia_name(taxon_name) {

    if (taxon_name == 'Chania'
	|| taxon_name == 'Nitrososphaeria'
	|| taxon_name == 'Candidatus Korarchaeum cryptofilum') {
	return;
    } else if (taxon_name == 'Proteus') {
	return { name: 'Proteus_(bacterium)', uri: '<http://dbpedia.org/resource/Proteus_(bacterium)>' };
    }

    var dbpedia_name = taxon_name
	    .replace(/\s/g, '_')
	    .replace(/^Candidatus_/, '')
	    .replace(/\//g, '_')
	    .replace(/'/g, '')
	    .replace(/\(/g, '_').replace(/\)/g, '_')
	    .replace(/\[/g, '').replace(/\]/g, '');

    return { name: dbpedia_name, uri: 'dbpedia:' + dbpedia_name };
}

function show_hierarchy(taxid, genome_type, lang) {

    var table_upper = [];
    var list = ''; 
    $.getJSON('sparql_search.php?taxid_to_get_upper=' + taxid + '&genome_type_to_search=' + genome_type, function(data) {
	var data_p = data['results']['bindings'];
	for (var i=0; i<data_p.length; i++) {
	    table_upper[i] = data_p[i];
	    var dbpedia = dbpedia_name(data_p[i]['label']['value']);
	    if (dbpedia) {
		table_upper[i]['dbpedia'] = dbpedia.name;
		list += '( ' + dbpedia.uri + ' )';
	    }
	}
    });

    var table_lower = [];
    $.getJSON('sparql_search.php?taxid_to_get_lower=' + taxid + '&genome_type_to_search=' + genome_type, function(data) {
    	var data_p = data['results']['bindings'];
    	for (var i=0; i<data_p.length; i++) {
    	    table_lower[i] = data_p[i];
	    var dbpedia = dbpedia_name(data_p[i]['label']['value']);
	    if (dbpedia) {
    		table_lower[i]['dbpedia'] = dbpedia.name;
    		list += '( ' + dbpedia.uri + ' )';
	    }
    	}
    });

    var table_sister = [];
    $.getJSON('sparql_search.php?taxid_to_get_sisters=' + taxid + '&genome_type_to_search=' + genome_type, function(data) {
      var data_p = data['results']['bindings'];
      for (var i=0; i<data_p.length; i++) {
    	table_sister[i] = data_p[i];
	    var dbpedia = dbpedia_name(data_p[i]['label']['value']);
	    if (dbpedia) {
    	  table_sister[i]['dbpedia'] = dbpedia.name;
    	  list += '( ' + dbpedia.uri + ' )';
	    }
      }
    });

    // Use DBpedia to translate
    var dbpedia_labe_en = {};
    var dbpedia_labe_local = {};
    $.getJSON('sparql_search.php?tax_list_to_get_local=' + list + '&local_lang=' + lang, function(data) {
    	var data_p = data['results']['bindings'];
    	for (var i=0; i<data_p.length; i++) {
	    var dbpedia_uri = data_p[i]['dbpedia_resource']['value'];
	    if (data_p[i]['label_en']) {
		dbpedia_labe_en[dbpedia_uri] = data_p[i]['label_en']['value'];
	    }
	    if (data_p[i]['label_local'] && lang != "en") {
		dbpedia_labe_local[dbpedia_uri] = data_p[i]['label_local']['value'];
	    }
    	}
    });

    // Show tables
    var html = '<table id="taxonomy" class="hierarchy" border="1">';
    html += '<tr><th colspan="3">Taxonomic hierarchy</th>';
    html += '<th align="center"><font size="2"><i>N</i></font></th></tr>';
    for (var i=0; i<table_upper.length; i++) {
	var rank = table_upper[i]['rank']['value'].replace(/.*\//, '');
      var label = table_upper[i]['label']['value'];
      var wiki = '';
	  if (table_upper[i]['dbpedia']) {
	    var dbpedia_uri = 'http://dbpedia.org/resource/' + table_upper[i]['dbpedia'];
	    if (dbpedia_labe_en[dbpedia_uri]) {
		  wiki += '<a target="_blank" href="http://en.wikipedia.org/wiki/' + dbpedia_name(dbpedia_labe_en[dbpedia_uri]).name + '">*</a> ';
	    }
	    if (dbpedia_labe_local[dbpedia_uri] && lang != "en") {
		  var label_local = dbpedia_labe_local[dbpedia_uri];
		  wiki += '<a target="_blank" href="http://' + lang + '.wikipedia.org/wiki/' + label_local + '">' + label_local + '</a>';
	    }
	  }
	  label = '<td class="taxon_clickable" nowrap><i>' + label + '</i></td>';
	  html += '<tr><td class="rank_clickable" nowrap>' +
	    rank + '</td>' + label + '<td nowrap><font size="2">' + wiki + '</font></td>' +
	    '<td align="right"><font size="2">'+ table_upper[i]['count']['value'] +'</font></td></tr>';
    }

    var main_count = 0;
    for (var i=0; i<table_sister.length; i++) {
      var rank = table_sister[i]['rank']['value'].replace(/.*\//, '');
      var sister_taxid = table_sister[i]['taxon']['value'].replace(/.*\//, '');
      var label = table_sister[i]['label']['value'];
      var sister_count = table_sister[i]['count']['value'];
      var wiki = '';
	  if (table_sister[i]['dbpedia']) {
    	var dbpedia_uri = 'http://dbpedia.org/resource/' + table_sister[i]['dbpedia'];
    	if (dbpedia_labe_en[dbpedia_uri]) {
    	  wiki += '<a target="_blank" href="http://en.wikipedia.org/wiki/' + dbpedia_name(dbpedia_labe_en[dbpedia_uri]).name + '">*</a> ';
    	}
    	if (dbpedia_labe_local[dbpedia_uri] && lang != "en") {
    	  var label_local = dbpedia_labe_local[dbpedia_uri];
    	  wiki += '<a target="_blank" href="http://' + lang + '.wikipedia.org/wiki/' + label_local + '">' + label_local + '</a>';
    	}
	  }
	  var rank_orig = rank;
	  if (sister_taxid == taxid) {
	    rank = '<b>' + rank + '</b>';
	  }
	  var mark = '';
	  if (sister_taxid == taxid) {
	    mark = '-&ensp;';
	  } else {
	    mark = '+ ';
	  }
	  if (rank_orig == "Superkingdom") {
	  } else {
	    mark = '&ensp;' + mark;
	  }
	// if (rank_orig == "Species") {
	//     // mark = '&emsp;&ensp;';
	//     mark = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
	// }

	  if (sister_taxid == taxid) {
    	label = '<td nowrap><i><b>' + label + '</b></i></td>';
	    html += '<tr bgcolor="#E3E3E3"><td nowrap>';
	  } else {
	    label = '<td class="taxon_clickable" nowrap><i>' + label + '</i></td>';
    	html += '<tr><td class="rank_clickable" nowrap>';
	  }
	  html += mark + rank + '</td>' + label + '<td nowrap><font size="2">' + wiki + '</font></td>' + 
	    '<td align="right"><font size="2">' + sister_count + '</font></td>' + '</tr>';

	  if (sister_taxid == taxid) {
	    main_count = sister_count;
	    for (var j=0; j<table_lower.length; j++) {
    		var rank = table_lower[j]['rank']['value'].replace(/.*\//, '');
    		var label = table_lower[j]['label']['value'];
    		var lower_count = table_lower[j]['count']['value'];
    		var wiki = '';
		if (table_lower[j]['dbpedia']) {
    		    var dbpedia_uri = 'http://dbpedia.org/resource/' + table_lower[j]['dbpedia'];
    		    if (dbpedia_labe_en[dbpedia_uri]) {
    			wiki += '<a target="_blank" href="http://en.wikipedia.org/wiki/' + dbpedia_name(dbpedia_labe_en[dbpedia_uri]).name + '">*</a> ';
    		    }
    		    if (dbpedia_labe_local[dbpedia_uri] && lang != "en") {
    			var label_local = dbpedia_labe_local[dbpedia_uri];
    			wiki += '<a target="_blank" href="http://' + lang + '.wikipedia.org/wiki/' + label_local + '">' + label_local + '</a>';
    		    }
		}
		// if (rank == "Species" && rank_orig == "Genus") {
		    rank = '&emsp;&emsp;&emsp;' + rank;
		// } else if (rank == "Superkingdom") {
		//     rank = '+ ' + rank;
		// } else {
		//     rank = '&emsp;&emsp;+ ' + rank;
		// }
		label = '<td class="taxon_clickable" nowrap><i>' + label + '</i></td>';
    		html += '<tr><td class="rank_clickable" nowrap>' +
		    rank + '</td>' + label + '<td nowrap><font size="2">' + wiki + '</font></td>' + 
    		    '<td align="right"><font size="2">' + lower_count + '</font></td></tr>';
	    }
	}
	
    }

    html += '</table>'
    $('#taxonomy_div').html(html);

    return main_count;
}

function show_dbpedia(taxon_name, taxid, local_lang) {

    var dbpedia = dbpedia_name(taxon_name);
    if (! dbpedia) {
	return;
    }
    
    $.getJSON('sparql_search.php?dbpedia_entry=' + dbpedia.uri + '&local_lang=' + local_lang, function(data) {
	var data_p = data['results']['bindings'];
	var img = '';
	var abst = '';
	var abst_local = '';
	var label_local = '';
	var wiki = '';
	for (var i=0; i<data_p.length; i++) {
	    if (!wiki) {
		wiki = data_p[i]['wiki']['value'];
	    }
	    if (!img && data_p[i]['image']) {
		img = data_p[i]['image']['value'];
	    }
	    if (!abst && data_p[i]['abst']['xml:lang'] == 'en') {
		abst = data_p[i]['abst']['value'];
		var max_len = 800;
		if (abst.length > max_len) {
		    abst = abst.substr(0,max_len).replace(/\S+$/, '') + ' ...';
		}
	    }
	    if (!abst_local && data_p[i]['abst']['xml:lang'] == local_lang) {
		abst_local = data_p[i]['abst']['value'];
	    }
	    if (!label_local && data_p[i]['label']['xml:lang'] == local_lang) {
		label_local = data_p[i]['label']['value'];
	    }
	}
	var html = '';
	if (wiki) {
	    html += '<table id="dbpedia" border="1">';
	    html += '<tr><td>';
	    if (img) {
		html += '<a target="_blank" href="'+img+'"><img src="' + img + '?height=160" height="160"></a>';
	    } else {
		html += '<font size="2">No image</font>'
	    }
	    html += '</td><td><font size="2">';
	    html += abst;
	    html += '<br>';
	    html += '<a target="_blank" href="' + wiki + '">'+ wiki + '</a>';
	    if (local_lang != 'en') {
		html += '<br>';
		html += abst_local;
		html += '<br>';
		html += '<a target="_blank" href="http://' + local_lang + '.wikipedia.org/wiki/' + label_local + '">' + label_local + '</a>';
	    }
	    html += '</font></td>';
	    html += '<td>';
	    html += '<font size="2">Obtained from <a href="http://dbpedia.org">DBpedia</a></font>';
	    html += '<br><br>';
	    html += '<a href="http://creativecommons.org/licenses/by-sa/3.0/"><img src="img/cc-by-sa.png" width="62" height="22"></a>';
	    html += '</td>';
	    html += '</tr>';
	    html += '</table>';
	    $('#dbpedia_div').html(html)
	}
    });
}

function show_genome_comparison(taxid) {

    var mbgd_page = '/htbin/cluster_map?show_summary=on&map_type=cluster_size&tabid=';

    var count_compared = 0;
    $.getJSON('sparql_search.php?taxid_to_get_dataset=' + taxid, function(data) {
	var data_p = data['results']['bindings'];
	for (var i=0; i<data_p.length; i++) {
    	    count_compared = data_p[i]['count']['value'];
	}
	if (count_compared) {
	    var image = '';
	    $.get('/images/cmprloc/tax' + taxid + '.findcore.cmprloc.png', function(data){
		image = '<iframe width="100%" height=300 frameborder=0 ' +
		    'src="http://mbgd.genome.ad.jp/stanza/showcmprloc.php?tabid=tax' + taxid + '">Cannnot see iframe on this browser</iframe><br>';
	    });
	    var html = '<font size="2">';
	    if (image) {
		html += '&ensp;<b>Comparison of genomes</b>';
		html += '&ensp;(<a target="_blank" href="' + mbgd_page + 'tax' + taxid + '">selected ' + count_compared + ' representative genomes</a>)';
		html += image;
	    } else {
	    	html += '<br>';
	    	html += '&ensp;<b>Genome comparison</b><br>';
	    	html += '&ensp;<a target="_blank" href="' + mbgd_page + 'tax' + taxid + '">compare ' + count_compared + ' representative genomes</a>';
		html += '<br><br>';
	    }
	    html += '</font>';
	    $('#genome_comparison_div').html(html)
	}
    });
}

function show_specific_genes(taxid) {

    $.getJSON('sparql_search.php?taxon_to_default_orgs=' + taxid, function(data) {
      var data_p = data['results']['bindings'];
	  var count_default = 0;
      for (var i=0; i<data_p.length; i++) {
    	count_default = data_p[i]['count']['value'];
      }
	if (count_default > 0) {
	    var html = '';
	    var mbgd_page = '/htbin/cluster_map?show_summary=on&map_type=cluster_size&tabid=';
	    html += '<font size="2">';
	    html += '&ensp;<b>Taxon specific genes</b>';
	    html += '&ensp;(<a target="_blank" href="' + mbgd_page + 'default' + '">comparing ' + count_default;
	    if (count_default == 1) {
		html += ' genome';
	    } else {
		html += ' genomes';
	    }
	    html += ' in this Taxon vs Others</a>)';
	    html += '<iframe width="100%" frameborder=0 marginheight="0" marginwidth="0" src="http://mbgd.genome.ad.jp:8101/stanza/taxon_to_specific_genes_in_dataset?' + 
		'ortholog_dataset=default' + '&tax_id=' + taxid + '">Cannnot see iframe on this browser</iframe>';
	    html += '</font>';
	    $('#specific_genes_div').html(html)
	}
    });
}

function show_genome_list(rank, taxon_name, taxid, genome_type) {

  var count = 0;

  $.getJSON('sparql_search.php?taxon_to_search_genomes=' + taxid + '&genome_type_to_search=' + genome_type, function(data) {
	  var data_p = data['results']['bindings'];
	  count = data_p.length;
      
	  var count_html = '<br><font size="2"><b>';
	  count_html += '<i>' + taxon_name + '</i>: ';
	  count_html += count;
	  if (count == 1) {
	    count_html += ' proteome';
	  } else {
	    count_html += ' proteomes';
	  }
	  count_html += '</b>';
	  count_html += '<br><br>';
	  count_html += "</font>";

	  $('#counter_div').html(count_html);

      var list_html = '<thead><tr>' + '<th align="center"><button type="button" class="add_genome_all" title="Select all">'+
	    '<img src="img/plus.png" border="0" height="15" width="15"></button></th>' +
	    '<th>Proteome ID</th>' +
	    '<th>Assembly ID</th>' +
	    '<th>Tax ID</th>' +
	    '<th>Code</th>' +
	    '<th>Species Name</th>' +
	    '<th>Proteins</th>' +
	    '<th>Isoforms</th>' +
	    '<th>CPD <a href="https://uniprot.org/help/assessing_proteomes" target="_blank">*</a></th>' +
	    '<th class="thin">avg.</th>' +
	    '<th class="thin">stdev</th>' +
	    '<th>BUSCO <a href="https://uniprot.org/help/assessing_proteomes" target="_blank">*</a></th>' +
	    '<th class="thin">single</th>' +
	    '<th class="thin">dupli.</th>' +
	    '<th class="thin">frag.</th>' +
	    '<th class="thin">miss.</th>' +
	    // '<th align="center">Release date</th><th>Reference</th>' +
	    '</tr></thead>';
	  for (var i=0; i<count; i++) {
	    var up_id = data_p[i]['proteome']['value'].replace(/.*\//, '');
	    var mbgd_code = data_p[i]['code']['value'];
	    var organism_name = data_p[i]['organism']['value'];
	    data_p[i]['taxid']['value'].match(/(\d+)$/);
	    var genome_taxid = RegExp.$1;
        var busco_complete = '';
        if (data_p[i]['busco_complete']) {
          busco_complete = data_p[i]['busco_complete']['value'];
        }
        var busco_single = '';
        if (data_p[i]['busco_single']) {
          busco_single = data_p[i]['busco_single']['value'];
        }
        var busco_multi = '';
        if (data_p[i]['busco_multi']) {
          busco_multi = data_p[i]['busco_multi']['value'];
        }
        var busco_fragmented = '';
        if (data_p[i]['busco_fragmented']) {
          busco_fragmented = data_p[i]['busco_fragmented']['value'];
        }
        var busco_missing = '';
        if (data_p[i]['busco_missing']) {
          busco_missing = data_p[i]['busco_missing']['value'];
        }
        var assembly = '';
        var assembly_url = '';
        if (data_p[i]['assembly']) {
          assembly = data_p[i]['assembly']['value'];
          assembly_url = 'https://ncbi.nlm.nih.gov/assembly/' + assembly;
        }
	    var sign = "plus";
	    if (localStorage.getItem(mbgd_code)) {
		  sign = "minus";
	    }
	    var button = '<button type="button" class="add_genome" title="Select">'+
	    	'<img src="img/'+ sign +'.png" border="0" height="15" width="15"></button>';
	    list_html += '<tr>';
	    list_html += '<td align="center">' + button + '</td>';
	    list_html += '<td><a href="' + data_p[i]['proteome']['value'] + '" target="_blank">' + up_id + '</a></td>';
	    list_html += `<td><a href="${assembly_url}" target="_blank">${assembly}</a></td>`;
	    list_html += '<td>' + genome_taxid + '</td>';
	    list_html += '<td>' + mbgd_code + '</td>';
	    list_html += '<td class="genome_name"><i>' + organism_name + '</i></td>';
	    list_html += '<td align="right">' + data_p[i]['proteins']['value'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</td>';
	    list_html += '<td align="right">' + data_p[i]['isoforms']['value'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</td>';
	    list_html += '<td align="right">' + data_p[i]['cpd_label']['value'] + '</td>';
	    list_html += '<td align="right">' + data_p[i]['cpd_average']['value'] + '</td>';
	    list_html += '<td align="right">' + data_p[i]['cpd_stddev']['value'].toString().replace(/\..*/, '') + '</td>';
	    list_html += '<td align="right">' + busco_complete + '</td>';
	    list_html += '<td align="right">' + busco_single + '</td>';
	    list_html += '<td align="right">' + busco_multi + '</td>';
	    list_html += '<td align="right">' + busco_fragmented + '</td>';
	    list_html += '<td align="right">' + busco_missing + '</td>';
	    // data_p[i]['date']['value'].match(/^([\d\-]+)/);
	    // var date = RegExp.$1;
	    // list_html += '<td align="center">'+date+'</td><td>';
	    // if (data_p[i]['pubmed']) {
		// data_p[i]['pubmed']['value'].match(/(\d+)$/);
		// var pmid = RegExp.$1;
		// list_html += '<a href="' + data_p[i]['pubmed']['value'] + '" target="_blank">pmid:' + pmid + '</a>';
	    // }
	    list_html += '</td></tr>';
	}
	$('#details').html(list_html)
	$(function() {
	  $.tablesorter.addParser({
		id: "fancyNumber",
		is: function(s) {
		  return /^[0-9]?[0-9,\.]*$/.test(s);
		},
		format: function(s) {
		  return $.tablesorter.formatFloat(s.replace(/,/g, ''));
		},
		type: "numeric"
	  });
	  $('#details').tablesorter(
		{
		  headers: {
			0: {sorter:false},
			6: {sorter:'fancyNumber'},
			7: {sorter:'fancyNumber'},
		  }
		}
	  );
	});
  });

  return count;
}

function show_selected_genome() {

    var total = 0;
    for (var i=0; i<localStorage.length; i++) {
    	total++;
    }

    if (total == 0) {
	  $("#selected_genome").html('');
      $("#selected_genome").css("background-color", "transparent");
    } else {
	  var html = '<tr><td id="selected_genome_num"><font size="2">You selected <b>' + total + '</b> proteomes</font></td>' +
        '<td><a href="selected_genomes.html" target="_blank" class="btn">Check</a></td></tr>';
	  $("#selected_genome").html(html);
      $("#selected_genome").css("background-color", "#d6d6d6");
    }
}
