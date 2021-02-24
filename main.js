    const mbAttr = 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    mbUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

    const grayscale   = L.tileLayer(mbUrl, {id: 'mapbox/light-v9',
                        tileSize: 512, zoomOffset: -1, attribution: mbAttr}),
                        streets  = L.tileLayer(mbUrl, {id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, attribution: mbAttr});

    const JSON_Endpoint_URL = 'https://spreadsheets.google.com/feeds/list/1f77rdBIc3Klf8pcyMDdrP6Dpy0QZNut65HhxUpkhirA/5/public/full?alt=json';
    //JSON_Endpoint_URL_Real_one;

    var deliveries = L.layerGroup([]);
    const overlays = {
            "Deliveries": deliveries,
    };

    const baseLayers = {
        "Grayscale": grayscale,
        "Streets": streets
    };
    const map = L.map('map', {
            center: [20.5937, 78.9629],
            zoom: 4,
            layers: [grayscale, streets]
    });
    // L.control.layers(baseLayers, overlays).addTo(map);

    google.load("visualization", "1", {packages:["corechart"]});
    
    /////////////Ajax Requests////////////
    $(document).ready(function() {
        // Fetch the initial table
        refreshTable();
        refreshMap();
        refreshChart();
    
        // Fetch every 1 second
        setInterval(refreshTable, 1000);
        setInterval(refreshMap, 5000);
        setInterval(refreshChart, 5000);
    });
    
    function refreshTable(){
        
        // var trHTML = '';	    
        
        $.getJSON(JSON_Endpoint_URL, function(data) {
        	
            var trHTML = '';

            for (var i = 0; data.feed.entry != null && i < data.feed.entry.length; ++i) {
                var myData_map, myData_order;

                trHTML += '<tr><td>' + data.feed.entry[i].gsx$orderid.$t + 
                            '</td><td>' + data.feed.entry[i].gsx$item.$t + 
                            '</td><td>' + data.feed.entry[i].gsx$priority.$t + 
                            '</td><td>' + data.feed.entry[i].gsx$quantity.$t + 
                            '</td><td>' + data.feed.entry[i].gsx$city.$t + 
                            '</td><td>' + data.feed.entry[i].gsx$ordertime.$t +
                            '</td><td>' + data.feed.entry[i].gsx$orderdispatched.$t+ 
                            '</td><td>' + data.feed.entry[i].gsx$ordershipped.$t + 
                            '</td><td>' + data.feed.entry[i].gsx$timetaken.$t + 
                            '</td></tr>';

            }

            console.log(trHTML);
            $('#tableContent').html(trHTML);
            var trHTML = '';

        });	 
    }	

    function refreshMap(){
        var container = L.DomUtil.get('map');

      	if(container != null){
            container._leaflet_id = null;
        }
         
        // var map = L.map('map').setView([20.5937, 78.9629], 4);
        var jsonDataObject =[];
        
        $.getJSON(JSON_Endpoint_URL, function(data) {
            for (var i = 0; data.feed.entry != null && i < data.feed.entry.length; ++i) {

                var json_data = {
                    "City": data.feed.entry[i].gsx$city.$t,
                    "OderID" : data.feed.entry[i].gsx$orderid.$t,
                    "Item" : data.feed.entry[i].gsx$item.$t,
                    "Latitude": parseFloat(data.feed.entry[i].gsx$latitude.$t),
                    "Longitude": parseFloat(data.feed.entry[i].gsx$longitude.$t),
                    "Dispatch": String.toString(data.feed.entry[i].gsx$orderdispatched.$t),
                    "Shipped": String.toString(data.feed.entry[i].gsx$orderdispatched.$t),
                    "Order": String.toString(data.feed.entry[i].gsx$orderdispatched.$t),

                };
                jsonDataObject.push(json_data);
            }
        
            
            function onClick_Marker(e) {
                var marker = e.target;
                popup = L.popup()
                .setLatLng(marker.getLatLng())
                .setContent("Order ID: " + marker.myJsonData.OderID + " || Item: " +   marker.myJsonData.Item)
                .openOn(map);
            }   
            markers = [];
            const green = '#00ff00';
            const red = '#0000ff';
            const yellow = '#ffff00';
            const markerHtmlStyle = (color) => {
                return `
                background-color: ${color};
                width: 1.5rem;
                height: 1.5rem;
                display: block;
                left: -0.5rem;
                top: -0.5rem;
                position: relative;
                border-radius: 3rem 3rem 0;
                transform: rotate(45deg);
                border: 1px solid #FFFFFF`
            }

            const getIcon = (color) => {
                return L.divIcon({
                    className: "custom-pin",
                    iconAnchor: [0, 24],
                    labelAnchor: [-6, 0],
                    popupAnchor: [0, -36],
                    html: `<span style="${markerHtmlStyle(color)}" />`
                });
            }

            const chooseColor = (jObj) => {
                iconStyle = getIcon(red);
                if(jObj.Dispatch != "") iconStyle = getIcon(yellow);
                if(IDBObjectStore.Shipped != "") iconStyle = getIcon(green);
                return iconStyle;
            }

            for (var j = 0; j < jsonDataObject.length; j++) {
                var marker = L.marker(L.latLng(parseFloat(jsonDataObject[j].Latitude), parseFloat(jsonDataObject[j].Longitude)),
                            {icon: chooseColor(jsonDataObject[j])}); // TODO: Pass color as need - depending on the priority
                marker.bindPopup(jsonDataObject[j].City, {
                        autoClose: false
                });
                marker.on('click', onClick_Marker)
                // Attach the corresponding JSON data to your marker:
                marker.myJsonData =jsonDataObject[j];
                markers.push(marker);
            }      
            deliveries = L.featureGroup(markers);
            var group = deliveries.addTo(map);
        });
    }
    function refreshChart(){
    var jsonDataObject =[];
    var graph_arr = [['Order ID', 'Time Taken', { role: 'style' }, { role: 'annotation' }]];
    var bar_color = [];
    var annotations = [];

    $.getJSON(JSON_Endpoint_URL, function(data) {
      for (var i = 0; i < data.feed.entry.length; ++i) {
        var json_data = {
          "OderID" : data.feed.entry[i].gsx$orderid.$t,
          "TimeTaken": parseFloat(data.feed.entry[i].gsx$timetaken.$t),
          "Priority": data.feed.entry[i].gsx$priority.$t
          };
          jsonDataObject.push(json_data);
      };
      // Setting color and annotation for the coloumns of graph according to priority of items
      for(var j in jsonDataObject){
        if(jsonDataObject[j].Priority == 'HP'){
          var color =  `#FF0000`;
          var ann = "High Priority";
          }
        else if(jsonDataObject[j].Priority == 'MP'){
          var color =  `#FFFF00`;
          var ann = "Medium Priority";
          }
        else if(jsonDataObject[j].Priority == 'LP'){
          var color =  `#00FF00`;
          var ann = "Low Priority";
          }
        bar_color.push( `fill-color: ${color};stroke-color: #000; stroke-width: 2; column-radius: 1em; fill-opacity: 0.85;`);
        annotations.push(ann);
      }

      // Converting Json Object to JavaScript Array
      for(var j in jsonDataObject){
          graph_arr.push([jsonDataObject[j].OderID,jsonDataObject[j].TimeTaken, bar_color[j], annotations[j]]);
      }
      var graphArray_Final = google.visualization.arrayToDataTable(graph_arr);
    
      var data = new google.visualization.DataView(graphArray_Final); 

      var options = {
        title: 'Time Taken for items to be Shipped',
        hAxis: { title: 'Order ID'},
        vAxis: { title: 'Time Taken (s)'},
        legend: { position: "none" },
        bar: {groupWidth: '10%'}
      };
      var chart = new google.visualization.ColumnChart(document.getElementById('column_chart'));
      chart.draw(data, options);
    });	 
  }
