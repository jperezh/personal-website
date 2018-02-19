(function ($) {
    window.DGS.OnLoad.getInstance().register(function () {

      

      
        $('.component.center-locator').each(function(){

            var consoleOn = false;

            var $thisSpot = $('.component.center-locator'),
                $errorContainer = $('.no-results-message'),
                $errorContainerTech = $('.technical-error-message'),
                theLang = $('html').attr('lang'),
                map,
                infoWindows = [],
                infoWindowID = 0,
                baseUrl = '/webservices/centerlocator.svc',
                markersArray = [],
                noScrollWheel = false,
                userLocation = {
                    ip: false,
                    lat: 0,
                    lng: 0,
                    unit: 'KM'
                },
                mc,
                mapStyle = {},
                centers = null,
                setting = null,
                url = oldLat = oldLng = '',
                panBy = -200,
                usrLatitude = "null",
                usrLongitude = "null",
                hasGeoLocation = false,
                searchPointMarker = null,
                geoMarker = null,
                mapWithLocationLoaded = false,
                partner = $thisSpot.data('partner'),
                $filter = $('.marker-filter', $thisSpot),
                $filterCenters = $('.filter-center', $filter),
                $filterPartners = $('.filter-partner', $filter),
                $mobileInfoWindow = $('.mobile-infowindow', $thisSpot);

            var defaultSettings = {
                markers: {
                    defaultMarker: '~/media/retail/main/locator/oticon-marker.png',
                    selectedMarker: '~/media/retail/main/locator/oticon-marker-aktiv.png',
                    partnerMarker: '~/media/retail/main/locator/oticon-marker.png',
                    geoMarker: '~/media/retail/main/locator/your_location_marker_center_stroked.png',
                    searchMarker: '~/media/retail/main/locator/oticon-marker-home.png'
                },
                clusters: {
                    clusterSize1: '~/media/retail/main/mockup/m1.png',
                    clusterSize2: '~/media/retail/main/mockup/m2.png',
                    clusterSize3: '~/media/retail/main/mockup/m3.png',
                    clusterSize4: '~/media/retail/main/mockup/m4.png',
                    clusterSize5: '~/media/retail/main/mockup/m5.png'
                },
                googlemap: [
                    {
                        featureType: 'road.highway',
                        elementType: 'geometry',
                        stylers: [
                            { color: '#FFFFFF' },
                            { weight: 1 }
                        ]
                    }, {
                        featureType: 'road.highway',
                        elementType: 'labels',
                        stylers: [
                            { visibility: 'off' }
                        ]
                    }
                ]
            };

            function usrPosError(err){
                if (consoleOn) console.log('ERROR(' + err.code + '): ' + err.message);
            }

            function getLocation() {

                hasGeoLocation = false;

                if (navigator.geolocation) {
                    var location_timeout = setTimeout(function(){usrPosError({code: '0', message: 'Geolocation timout'})}, 10000);

                    navigator.geolocation.getCurrentPosition(function(position) {
                        clearTimeout(location_timeout);

                        setUsrPosition(position);
                    }, function(error) {
                        clearTimeout(location_timeout);
                        usrPosError(error);
                    });
                } else {
                    usrPosError({code: '0', message: 'Geolocation not suported'});
                }
            }
            function setUsrPosition(position) {
                usrLatitude = position.coords.latitude;
                usrLongitude = position.coords.longitude;
                if (consoleOn) {
                    console.log("HTML5 user location set to " + usrLatitude + ", " + usrLongitude);
                }
                hasGeoLocation = usrLatitude != "null" || usrLongitude != "null";


                var pos = new google.maps.LatLng(usrLatitude, usrLongitude);

                if (consoleOn) console.log("hasGeoLocation");
                if (consoleOn) console.log("pos " + pos);

                if (geoMarker != null) {
                    //adjust geoMarker position
                    geoMarker.setPosition(pos);
                } else {
                    //display geoMarker
                    geoMarker = new google.maps.Marker({
                        title: window.locationLabel,
                        icon: defaultSettings.markers.geoMarker,
                        position: pos,
                        map: map
                    });
                }

                setTimeout(function () {
                    if (!mapWithLocationLoaded) {
                        //try again to get centers
                        getCentersWithLatLong();
                    }
                }, 0);

                //show the location buttons and add on click events
                $('.zoom.control > .locate, .geo-locator', $thisSpot).show();
                $('.zoom.control > .locate, .geo-locator', $thisSpot).on('click', function () {
                    if (consoleOn) console.log("going to user location");

                    var pos = new google.maps.LatLng(usrLatitude, usrLongitude);
                    map.setCenter(pos);

                });

            }

            function getSettings() {

                url = baseUrl + '/GetCenters/' + getMarket() + '/' + usrLatitude + '/' + usrLongitude + '/' + theLang + '/' + partner;

                $.ajax({
                    url: url,
                    type: 'GET',
                    dataType: 'json',
                    success: function (data, textStatus, xhr) {
                        if (consoleOn) console.log("success getSettings");


                        if (data.Setting.MapConfiguration != '') {
                            userLocation.unit = data.Setting.Unit;
                            var mapSet = JSON.parse(data.Setting.MapConfiguration);
                            defaultSettings = $.extend({}, defaultSettings, mapSet);
                            mapStyle = {
                                gridSize: data.Setting.ClusterGridSize, maxZoom: data.Setting.ClusterMaxZoom,
                                styles: [{
                                    textColor: 'white',
                                    height: 30,
                                    url: encodeURI(defaultSettings.clusters.clusterSize1),
                                    width: 30
                                }, {
                                    height: 40,
                                    textColor: 'white',
                                    url: encodeURI(defaultSettings.clusters.clusterSize2),
                                    width: 40
                                }, {
                                    height: 50,
                                    textColor: 'white',
                                    url: encodeURI(defaultSettings.clusters.clusterSize3),
                                    width: 50
                                }, {
                                    height: 70,
                                    textColor: 'white',
                                    url: encodeURI(defaultSettings.clusters.clusterSize4),
                                    width: 70
                                }, {
                                    height: 90,
                                    textColor: 'white',
                                    url: encodeURI(defaultSettings.clusters.clusterSize5),
                                    width: 90
                                }]
                            }
                        }

                        centers = data.Centers;
                        setting = data.Setting;

                        if(!setting.ShowMap || !centers.length) {
                            hideComponent();
                        }

                    },
                    error: function (xhr, textStatus, errorThrown) {
                        if (consoleOn) console.log("failed getSettings");
                        hideComponent();
                    }
                });

            }

            function getMarket() {
                return $thisSpot.data('configuration');
            }

            function initializeMap(){

                getSettings();

                setTimeout(function () {

                    drawMap();

                    //try to get user location
                    getLocation();

                    setTimeout(function () {

                        populateMap();

                    }, 700);

                    $('.zoom.control > .zoom-in, .zoom.control > .zoom-out', $thisSpot).on('click', function () {
                        var zno = 16;

                        if ($(this).hasClass('zoom-in')) zno = Math.round(map.getZoom() + 1);
                        else zno = Math.round(map.getZoom() - 1);
                        map.setZoom(zno);

                        if (infoWindowID != 0) {
                            var center = infoWindows[0].getPosition();
                            map.setCenter(center);
                            map.panBy(0, panBy);
                        }

                    });

                    $('.filter-center, .filter-partner', $thisSpot).click(function () {

                        if ($(this).hasClass('off')) {
                            $(this).removeClass('off');
                            filterMarkers(this.id, false)
                        }
                        else {
                            $(this).addClass('off');
                            filterMarkers(this.id, true)
                        }

                    });

                    $('.search button', $thisSpot).on('click', function (e) {
                        e.preventDefault();
                        resetList();
                    });

                    $('#search-field', $thisSpot).keypress(function (e) {
                        if (e.which == 13) {
                            e.preventDefault();
                            resetList();
                        }
                    });

                    $('#search-field', $thisSpot).focus(function () {

                        var animationPoint = 0;

                        if ($('#header').hasClass('burger-switch')){
                            //mobile
                            animationPoint = $('.component.center-locator').offset().top - $('#header').outerHeight();

                        } else {
                            animationPoint = $('.component.center-locator').offset().top - $('#header').outerHeight() + $('.component.link.phone-header').outerHeight()
                        }

                        $('html, body').animate({
                            scrollTop: animationPoint
                        }, 500);
                    });

                }, 500);

            }

            function resetList() {
                var query = $('.search-field', $thisSpot).val();
                if (query != '' && query != null & query != undefined) {
                    clearInfoWindow();
                    GetCentersBySearch(query);
                }
            }

            function resetMarkers(id) {
                for (var a = 0; a < markersArray.length; a++) {
                    if (markersArray[a].isPartner) {
                        markersArray[a].setIcon(defaultSettings.markers.partnerMarker);
                    }
                    else {
                        markersArray[a].setIcon(defaultSettings.markers.defaultMarker);
                    }
                    if (markersArray[a].id == id) markersArray[a].setIcon(defaultSettings.markers.selectedMarker);
                }
                setDetails(id);
            }

            function clearInfoWindow() {
                for (var i = 0; i < infoWindows.length; i++) {
                    infoWindows[i].close();
                    infoWindows = [];
                }
            }

            function clearInfoWindowMobile() {
                $mobileInfoWindow.css('height', 0);
            }

            function setDetails(guid) {

                if (guid != 0) {
                    url = baseUrl + '/getcenterdata/' + getMarket() + '/' + guid + '/' + setting.Bounds.Centerpoint.Latitude +'/' + setting.Bounds.Centerpoint.Longitude + '/' + theLang;
                    + '/' + theLang;

                    $.ajax({
                        url: url,
                        type: 'GET',
                        dataType: 'json',
                        success: function (data, textStatus, xhr) {
                            if (consoleOn) console.log("success getcenterdata");

                            $errorContainer.hide();
                            $errorContainerTech.hide();

                            len = data.PartnerDetails.length;
                            if (len > 155) {
                                data.PartnerDetails=data.PartnerDetails.substr(0, 150) + '...';
                              }
                               
                          
                            var singleCenterTemplate = $("#single-center-template").html();

                            var centerDiv = singleCenterTemplate.format(data.Title, data.Address, data.City, data.Region, data.PostalCode, data.Phonenumber, data.ItemName, data.Latitude, data.Longitude, data.DistanceToPoint, data.RegionFolder, data.PartnerDetails);

                            if ($thisSpot.hasClass('mobile-view')) {

                                //mobile info window
                                $mobileInfoWindow.html(centerDiv);
                                if (data.IsPartner) $mobileInfoWindow.addClass('partner');
                                else $mobileInfoWindow.removeClass('partner');
                                setTimeout(function(){$mobileInfoWindow.addClass('open');}, 30);

                                $('.centre-cta.button', $mobileInfoWindow).on('click', function (e) {
                                    e.preventDefault();
                                    window.open("https://maps.google.com?daddr=" + data.Latitude + "," + data.Longitude, "_blank", "toolbar=no, scrollbars=no, resizable=yes, top=0, left=0, width=100%");

                                });

                            } else {
                                //just for desktop
                                clearInfoWindow();
                                var tempPos = new google.maps.LatLng(data.Latitude, data.Longitude);
                                var infoWindow = new google.maps.InfoWindow({map: map});
                                infoWindow.setPosition(tempPos);
                                infoWindow.setContent(centerDiv);
                                infoWindows.push(infoWindow);
                                infoWindowID = data.Guid;
                                google.maps.event.addListener(infoWindow, 'closeclick', function (e) {
                                    resetMarkers(0);
                                    clearInfoWindow();
                                });


                                google.maps.event.addListener(infoWindow, 'domready', function () {
                                    var iwOuter = $('.gm-style-iw');
                                    var iwBackground = iwOuter.prev();

                                    if (data.IsPartner) $('.gm-style', $thisSpot).addClass('partner');
                                    else $('.gm-style', $thisSpot).removeClass('partner');

                                    iwBackground.css('top', '-10px');
                                    iwBackground.children(':nth-child(1)').css({'display': 'none'});
                                    iwBackground.children(':nth-child(3)').css({'display': 'none'});
                                    $('.centre-cta.button').on('click', function (e) {
                                        e.preventDefault();
                                        window.open("https://maps.google.com?daddr=" + $(this).attr('id'), "_blank", "toolbar=no, scrollbars=no, resizable=yes, top=0, left=0, width=100%");

                                    });

                                    bellmetrics();

                                });

                            }
                        },
                        error: function (xhr, textStatus, errorThrown) {
                            if (consoleOn) console.log("failed search");
                            displayErrorTech();
                        }
                    });
                }
                
            }

            

            function addFilterMarkers () {
                if(setting.HasPartner == true ){
                    $filter.show();

                    //add markers
                    $filterCenters.prepend('<img src="' + defaultSettings.markers.defaultMarker + '">');
                    $filterPartners.prepend('<img src="' + defaultSettings.markers.partnerMarker + '">');
                }

            }

            function drawMarkers (){

                if (!markersArray.length) {
                    if (consoleOn) console.log("drawMarkers");

                    if (centers.length) {

                        for (var i = 0; i < centers.length; i++) {
                            var center = centers[i];
                            addMarker(center.Latitude, center.Longitude, center.Name, center.Guid, center.IsPartner);
                        }

                        if (mc != undefined && mc != null) mc.clearMarkers();
                        mc = new MarkerClusterer(map, markersArray, mapStyle);

                    }
                }

            }

            function addMarker(latitude, longitude, name, guid, isPartner) {
                if (consoleOn) console.log("adding marker " + name);
                var pos = new google.maps.LatLng(latitude, longitude);
                var marker = new google.maps.Marker({
                    position: pos,
                    map: map,
                    title: name,
                    icon: (isPartner == true ? defaultSettings.markers.partnerMarker : defaultSettings.markers.defaultMarker),
                    id: guid
                });
                marker.isPartner = isPartner;
                //marker.markerCategory = category;
                markersArray.push(marker);

                google.maps.event.addListener(marker, 'click', function () {
                    var center = this.getPosition();
                    //resetResult($(this));
                    resetMarkers($(this).attr('id'));
                    clearInfoWindow();

                    map.setCenter(center);

                    if(Modernizr.mq('(min-width: 1024px)')){
                        map.panBy(0, panBy);
                    }

                });

                google.maps.event.addListener(marker, 'visible_changed', function(){
                    if ( marker.getVisible() ) {
                        mc.addMarker(marker, true);
                    } else {
                        mc.removeMarker(marker, true);
                    }
                });
            }

            // shows all markers of a particular category
            function filterMarkers(category, hide) {
                for (var i = 0; i < markersArray.length; i++) {
                    if ((markersArray[i].isPartner && category == "partner") || (!markersArray[i].isPartner && category == "center")){
                        if (hide) {
                            markersArray[i].setVisible(false);
                        } else {
                            markersArray[i].setVisible(true);
                        }

                    }
                }

                //mc.setIgnoreHidden(true);
                mc.repaint();
                if (hide) clearInfoWindow();
            }


            function hideComponent (){
                //used in webservices unavailable
                $thisSpot.hide();
            }

            function populateMap() {


                if (setting.ShowMap && centers.length) {
                    if ( hasGeoLocation ) mapWithLocationLoaded = true;
                    setMapBounds();
                    drawMarkers();
                    addFilterMarkers();

                } else {
                    hideComponent();
                }


            }

            function getCentersWithLatLong() {

                setTimeout(function () {

                    url = baseUrl + '/GetCenters/' + getMarket() + '/' + usrLatitude + '/' + usrLongitude + '/' + theLang + '/' + partner;

                    $.ajax({
                        url: url,
                        type: 'GET',
                        dataType: 'json',
                        success: function (data, textStatus, xhr) {
                            if (consoleOn) console.log("success getCenters");

                            setting = data.Setting;

                            if (setting.ShowMap && centers.length) {
                                if ( hasGeoLocation ) mapWithLocationLoaded = true;
                                setMapBounds();
                                drawMarkers();

                            } else {
                                hideComponent();
                            }

                        },
                        error: function (xhr, textStatus, errorThrown) {
                            if (consoleOn) console.log("failed getCenters");
                            hideComponent();
                        }
                    });

                }, 200);
            }


            function GetCentersBySearch(query) {

                    url = baseUrl + '/GetCentersBySearch/' + getMarket() + '/' + query + '/' + usrLatitude + '/' + usrLongitude + '/' +  theLang;

                $.ajax({
                    url: url,
                    type: 'GET',
                    dataType: 'json',
                    success: function (data, textStatus, xhr) {
                        if (consoleOn) console.log("success search");

                        $errorContainer.hide();
                        $errorContainerTech.hide();

                        centers = data.Centers;
                        setting = data.Setting;

                        if (setting) {

                            if (setting.Status == "OK") {
                                if (consoleOn) console.log("success search 1");
                                setMapBounds();

                            } else {
                                if (consoleOn) console.log("regular error");
                                displayError();
                            }

                        } else {
                            if (consoleOn) console.log("tech error");
                            displayErrorTech();

                        }

                        setSearchPoint();

                    },
                    error: function (xhr, textStatus, errorThrown) {
                        if (consoleOn) console.log("failed search");
                        displayErrorTech();
                    }
                });
            }

            function displayError(){
                $errorContainer.show();
            }

            function displayErrorTech(){
                $errorContainerTech.show();
            }

            function setMapBounds() {
                if (consoleOn) console.log("setMapBounds");

                var swb1 = setting.Bounds.SouthWest.Latitude,
                    swb2 = setting.Bounds.SouthWest.Longitude,
                    neb1 = setting.Bounds.NorthEast.Latitude,
                    neb2 = setting.Bounds.NorthEast.Longitude,
                    southWest = new google.maps.LatLng(swb1, swb2),
                    northEast = new google.maps.LatLng(neb1, neb2),
                    bounds = new google.maps.LatLngBounds(southWest, northEast);

                if (consoleOn) console.log("bounds " + bounds);

                    map.fitBounds(bounds);
            }

            function setSearchPoint(){

                if (searchPointMarker) searchPointMarker.setMap(null);

                if (setting.SearchResultLocation.Latitude !== "0" && setting.SearchResultLocation.Longitude !== "0") {
                    if (consoleOn) console.log("setSearchPoint");
                    if (consoleOn) console.log("lat: " +  setting.SearchResultLocation.Latitude);
                    if (consoleOn) console.log("long: " +  setting.SearchResultLocation.Longitude);

                    //display geoMarker
                    var pos = new google.maps.LatLng(setting.SearchResultLocation.Latitude, setting.SearchResultLocation.Longitude);
                    if (consoleOn) console.log("pos: " +  pos);

                    searchPointMarker = new google.maps.Marker({
                        icon: defaultSettings.markers.searchMarker,
                        position: pos,
                        map: map
                    });
                }
            }


            function drawMap() {

                if (map == undefined) {
                    if (consoleOn) console.log("map first load");

                    if (Modernizr.mq("(min-width: 1024px)")) {
                        if (Modernizr.mq("(min-width: 1800px)")) {
                            var mapHeight = $(window).height() - $('#map-canvas').offset().top + 80;
                        }
                        else{
                            var mapHeight = $(window).height() - $('#map-canvas').offset().top - 80;
                        }                                            
                        if (mapHeight > 460) $('#map-canvas').css("height", mapHeight);
                    }

                    //initial values
                    var mapOptions = {
                        draggable: true,
                        panControl: true,
                        scrollwheel: false,
                        zoomControl: false,
                        /*center: pos,*/
                        disableDefaultUI: true,
                        clickableIcons: false
                    };
                    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
                    map.set('styles', defaultSettings.googlemap);
                }
            }


            function bellmetrics (){

                //Bellmetric script rewriting phone numbers
                if (typeof _bellmetric !== 'undefined') {
                    if (_bellmetric && _bellmetric.push) {

                        setTimeout(function () {
                            _bellmetric.push(['refresh']);
                            setTimeout(function () {
                                $(".center-phone a").fadeTo("fast", 1);
                            }, 30);
                        }, 10);
                    }
                }
            }


            //if (document.location.hostname == "localhost" || document.location.hostname == "retail.local.cas.dgs.com") baseUrl = 'http://retail.test.cas.dgs.com/webservices/centerlocator.svc';

            if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) noScrollWheel = true;

            if (noScrollWheel || Modernizr.mq("(max-width: 1023px)")) {
                $thisSpot.addClass('mobile-view');
            }

            if (typeof google === 'object' && typeof google.maps === 'object') {

                setTimeout(function () {

                    initializeMap();
                }, 200);

            }
        
        });
        
      

    });

   
})(jQuery);