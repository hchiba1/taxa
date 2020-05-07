function init() {
    show_selected_genomes();
}

$(function() {

    $(document).on('click', '.add_genome', function() {
	var this_row = $(this).parent().parent();
	// Selected item
	var codename = this_row.find('td:nth-child(2)').text();
	var orgname = this_row.find('td:nth-child(3)').text();

	if (localStorage.getItem(codename)) { 
	    // Delete the item
	    localStorage.removeItem(codename);
	    $(this).children('img').attr('src', 'img/plus.png');
	} else {         
	    // Add the item
	    localStorage.setItem(codename, orgname);
	    $(this).children('img').attr('src', 'img/minus.png');
	}

	show_selected_genomes();
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
	    var orgname = each_row.find('td:nth-child(3)').text();

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

	show_selected_genomes();
    });

});

function show_selected_genomes() {

  var total = 0;
  var html = '<thead><tr>' +
	'<th align="center"><button type="button" class="add_genome_all" title="Select all">' +
	'<img src="img/minus.png" border="0" height="15" width="15"></button></th>' +
	'<th>ID</th>' +
	'<th>Name</th>' +
	'</tr><thead>';
  var button = '<button type="button" class="add_genome" title="Select">'+
	'<img src="img/'+ 'minus' +'.png" border="0" height="15" width="15"></button>';
  for (var i=0; i<localStorage.length; i++) {
	var key = localStorage.key(i);
	var val = localStorage.getItem(key);
	html += '<tr>';
	html += '<td align="center">' + button + '</td>';
    html += '<td>' + key + '</td><td><i>' + val + '</i></td>';
	html += '</tr>';
	total++;
  }
  html += '';
  
  $('#details').html(html)
  $("#counter_div").html('<font size="2"><br>You selected <b>' + total + '</b> proteomes <br><br></font>');
}
