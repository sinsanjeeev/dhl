import React from "react";
import * as actions from "../../store/actions/index";
import * as actionTypes from "../../store/actions/actionTypes";
import { connect } from "react-redux";
import axios from "../../api";
import L from "leaflet";
import HeatmapOverlay from "../../../node_modules/leaflet/dist/leaflet-heatmap";
import 'leaflet-plugin-trackplayback';
import 'leaflet-plugin-trackplayback/dist/control.trackplayback';
import 'leaflet-plugin-trackplayback/dist/control.playback.css';
import 'leaflet.polyline.snakeanim';
import 'leaflet-contextmenu';
import 'leaflet-contextmenu/dist/leaflet.contextmenu.css';
import w1 from "../../images/ORDnew.PNG";
import w2 from "../../images/SmartDraw-min.png";
import * as iconProvider from "../IconProvider";

import {
  Loading
} from "carbon-components-react";

import _ from "lodash";
import { element } from "prop-types";
require("leaflet.markercluster");
//const socket = require('socket.io-client')('https://global-dhl-423761-0a85938276edbbcfb58a5c4bf680f8e3-0000.us-south.containers.appdomain.cloud/forkliftsocket', {
const socket = require('socket.io-client')('/forkliftsocket', {
  'path': '/forkliftio/socket.io'
});

let map = null;
let mrk = null;
let markInterval = null;
let locationMapLoaded = false;
let epcMarkr = [];
let assetLayer = [];
let assetsCache = {};
let assetToLayerMap = {};
let gZoneLayers = { 'location': [], 'area': [], 'subarea': [] }
let heatmapLayer = null;
let playBackLayer = null;
let heatMapRendered = false;
let playBackRendered = false;
let singleMarkerMode = false;
let lastPlayBackItem = [];
let image = null;
let sysProps = null;
let shipmentsLoaded = false;
let layoutLoaded = false;
const fillColors = { 'Receiving': 'green', 'Screening': 'blue', 'Putaway': 'pink', 'Consolidation': 'orange', 'Refrigeration Area': '	#FF0000' }

let thisObject = null;

var mcg = L.markerClusterGroup({
  chunkedLoading: true,
  //singleMarkerMode: true,
  spiderfyOnMaxZoom: false
});

var asset_mcg = L.markerClusterGroup({
  chunkedLoading: true,
  spiderfyOnMaxZoom: false
});

var j = 0;
class WarehouseLayout extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      str: "",
      showProgress: false
    };
    thisObject = this;
    this.renderHeatMap = this.renderHeatMap.bind(this);
    this.playBack = this.playBack.bind(this);
    this.renderSpecificEPC = this.renderSpecificEPC.bind(this);
    this.renderSpecificAsset = this.renderSpecificAsset.bind(this);
    this.addAssetsToMap = this.addAssetsToMap.bind(this);
  }

  componentDidMount() {
    this.props.onInitSiteCoordinate();
    //this.props.onInitLocationLayoutCoordinate(1);
    //this.props.onInitAllEPC(1);
    //this.props.onInitAllAssets(1);
    this.props.setMapLayersRefreshCallback(refreshLayers);
    this.props.setHeatMapRenderCallback(this.renderHeatMap);
    this.props.setPlayBackCallback(this.playBack);
    this.props.setShowSpecificShipmentDetailCallback(this.renderSpecificEPC);
    this.props.setShowSpecificAssetDetailCallback(this.renderSpecificAsset);
    this.props.setAddAssetsToMapCallback(this.addAssetsToMap);
  }
  componentDidUpdate = prevProp => {
    let centerArr = [];
    if (_.isNil(this.props.coordinateObj.siteselected))
      locationMapLoaded = false;

    if (
      !_.isNil(this.props.coordinateObj.site) &&
      _.isNil(this.props.coordinateObj.siteselected) &&
      this.props.trackingObj.locationMapSelected === false
    ) {
      centerArr = [15.006666, -87.901662];
      this.loadBaseMapWithInitZoomLevel(2, centerArr);
      if (!_.isNil(markInterval)) clearInterval(markInterval);
      if (!_.isNil(mrk) && !_.isNil(map)) map.removeLayer(mrk);
    }
    if (
      !_.isNil(this.props.coordinateObj.site) &&
      !_.isNil(this.props.coordinateObj.siteselected) &&
      this.props.coordinateObj.siteselected !=
      prevProp.coordinateObj.siteselected &&
      this.props.trackingObj.locationMapSelected === false
    ) {
      this.props.coordinateObj.site.forEach((item, index) => {
        if (this.props.coordinateObj.siteselected === item.city) {
          centerArr = item.site_coordinate.xy;
        }
      });

      this.loadBaseMapWithZoomLevel(16, centerArr);
      if (!_.isNil(mrk) && !_.isNil(map)) {
        map.removeLayer(mrk);
        clearInterval(markInterval);
      }
    }
    if (
      this.props.trackingObj.selectedtracking === "asset" &&
      this.props.trackingObj.locationMapSelected === true
    ) {
      if (!_.isNil(mrk) && !_.isNil(map)) map.removeLayer(mrk);
      clearInterval(markInterval);
      markInterval = setInterval(this.loadForkLiftIcon, 500);
      //this.removeEpcMarkere();
    } else {
      if (!_.isNil(mrk) && !_.isNil(map)) map.removeLayer(mrk);
      //this.removeEpcMarkere();
      clearInterval(markInterval);
    }

    if (
      this.props.trackingObj.locationMapSelected === true &&
      this.props.trackingObj.selectedtracking === "epc"
    ) {
      if (!_.isNil(this.props.epcObj.epc)) {
        clearInterval(markInterval);
        if (shipmentsLoaded === false) {
          shipmentsLoaded = true;
          this.addShipmentEpcMarker(this.props.epcObj.epc);
        }
      }
      if (!_.isNil(thisObject.props.coordinateObj.locationcoordinate)) {
        if (layoutLoaded === false) {
          layoutLoaded = true;
          addLayoutToMap();
        }
      }
    }
  };

  loadBaseMapWithInitZoomLevel = (zoom, centerArray) => {
    locationMapLoaded = false;
    var center = centerArray;

    // Create the map
    if (!_.isNil(map)) map.remove();

    map = L.map("map").setView(center, zoom);

    // Set up the OSM layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        'Data © <a href="http://osm.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    }).addTo(map);

    // add a marker in the given location
    let arr = this.props.coordinateObj.site;
    if (!_.isNil(arr)) {
      arr.forEach((item, index) => {
        L.marker(item.site_coordinate.xy, { title: item.city, siteid: item.site_id })
          .on("click", this.markerOnClick)
          .addTo(map);
      });
    }
  };

  loadBaseMapWithZoomLevel = (zoom, centerArray) => {
    var center = centerArray;

    // Create the map
    if (!_.isNil(map)) map.remove();

    map = L.map("map").setView(center, 4);

    // Set up the OSM layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        'Data © <a href="http://osm.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    }).addTo(map);
    map.flyTo(center, zoom, {
      animate: true,
      duration: 2
    });
    // add a marker in the given location
    let arr = this.props.coordinateObj.site;
    if (!_.isNil(arr)) {
      arr.forEach((item, index) => {
        L.marker(item.site_coordinate.xy, { title: item.city, siteid: item.site_id })
          .bindPopup(item.city)
          .bindTooltip(item.city)
          .on("click", this.markerOnClick)
          .addTo(map);
      });
    }
  };
  markerOnClick = e => {
    try {
      const siteid = e.target.options.siteid;
      this.currentSiteName = e.target.options.title;
      this.props.fetchSysProps(siteid);
      this.props.onInitAllEPC(siteid);
      this.props.onInitAllAssets(siteid);
      this.loadSysProps(e);
      this.props.onInitLocationLayoutCoordinate(siteid);
      this.setState({ showProgress: true })
    } catch (e) {
      this.currentSiteName = this.props.coordinateObj.siteselected;
    }
  }
  loadSysProps = e => {
    if (Object.keys(this.props.system.props).length !== 0) {
      sysProps = this.props.system.props;
      this.showSiteMap();
    } else {
      const url = '/sysprops/site/' + e.target.options.siteid;
      axios.get(url).then((res) => {
        let properties = {}
        res.data.forEach((property) => {
          properties[property.name] = property;
        })
        sysProps = properties;
        this.showSiteMap(e);
      }).catch((err) => {
      });
    }
  }
  showSiteMap = (e) => {
    this.removeEpcMarkere();
    locationMapLoaded = true;
    var bounds = [
      [0, 0],
      [500, 700]
    ];
    map.remove();
    map = L.map("map", {
      contextmenu: true,
      //zoomControl: true,
      crs: L.CRS.Simple,
      // maxZoom: 18
      minZoom: 0,
      maxZoom: 10,
      zoomSnap: 0,
      zoomDelta: 0.2
    });
    var ZoomViewer = this.createMapControls();

    map.createPane('imagePane');
    map.getPane('imagePane').style.zIndex = 0;
    image = new L.ImageOverlay(w1, bounds, { pane: 'imagePane' }).addTo(map);
    this.addCustomPanes();
    map.fitBounds([
      [0, 0],
      [500, 700]
    ]);
    new ZoomViewer().addTo(map);
    map.setZoom(this.getInitialZoomSetting());
    /** add layout to the map */
    addLayoutToMap()
    if (this.props.trackingObj.locationMapSelected === false)
      this.props.onInitLocationMapSelected(true);

    if (_.isNil(this.props.coordinateObj.siteselected)) {
      let arrsite = this.props.coordinateObj.site;
      if (!_.isNil(arrsite) && arrsite.length > 0) {
        arrsite.forEach((item, ind) => {
          if (
            item.site_coordinate.xy[0] === e.latlng.lat &&
            item.site_coordinate.xy[1] === e.latlng.lng
          ) {
            this.props.onInitSelectedSite(item.city);
          }
        });
      }
    }
    try {
      document.getElementById("shipmentLayerToggleButton").addEventListener("click", this.toggleShipments, false);
      document.getElementById("assetLayerToggleButton").addEventListener("click", this.toggleAssetLayer, false);
    } catch (e) {
      console.log(e.message);
    }
    //this.addShipmentEpcMarker(this.props.epcObj.epc);
    //this.addAssetsToMap(this.props.assets.assets, this.props.filters.assetFilters);
  };

  createMapControls = () => {
    return L.Control.extend({
      onAdd: function () {
        var container = L.DomUtil.create("div");
        var gauge = L.DomUtil.create("div");
        var resetButton = L.DomUtil.create("input");
        resetButton.id = "resetMapButtonId"
        resetButton.type = "button";
        resetButton.style.width = "100%";
        resetButton.style.display = "block";
        resetButton.title = "Reset Map";
        resetButton.value = "Reset Map";
        resetButton.onclick = thisObject.resetMap;
        container.style.width = "100px";
        container.style.background = "rgba(255,255,255,0.5)";
        container.style.textAlign = "left";
        map.on("zoomstart zoom zoomend moveend", function (ev) {
          const zoomLevel = map.getZoom();
          const sysProp = thisObject.getZoomLevelToLayoutMapping()
          let zoomState = zoomLevel < parseFloat(sysProp.location.max) ? 'location' :
            (zoomLevel >= parseFloat(sysProp.area.min) && zoomLevel < parseFloat(sysProp.area.max)) ? 'area' : 'subarea';
          if (thisObject.props.trackingObj.zoomLevel !== zoomState) {
            thisObject.props.onZoomLevelChange(zoomState);
          }
          const zoomLevelString = zoomLevel.toString();
          gauge.innerHTML = "Zoom level: " + ((zoomLevelString.indexOf('.') === -1) ? zoomLevel : zoomLevelString.substring(0, zoomLevelString.indexOf('.') + 3));
          refreshLayers(ev);
        });

        map.on('click', function (ev) { console.debug(ev) });
        container.appendChild(gauge);
        container.appendChild(resetButton);

        var toggleButtons = L.DomUtil.create('div');
        toggleButtons.innerHTML = `
        <div class="leaflet-control-layers leaflet-control-layers-expanded" style="display:none" >
          <form>
            <input class="leaflet-control-layers-overlays" id="shipmentLayerToggleButton" 
               checked type="checkbox">
              Shipments
            </input>
            <input class="leaflet-control-layers-overlays" id="assetLayerToggleButton" 
              type="checkbox">
              Assets
          </input>
          </form>
        </div>`;
        container.appendChild(toggleButtons);
        /*** */
        var legendPutaway = L.DomUtil.create("div");
        legendPutaway.innerHTML = "Putaway";
        legendPutaway.style.background = 'rgb(255,192,203,0.4)'/*'pink'*/;
        var legendReceving = L.DomUtil.create("div");
        legendReceving.innerHTML = "Receiving";
        legendReceving.style.background = 'rgb(0,128,0,0.4)'/*'green'*/;
        var legendScreening = L.DomUtil.create("div");
        legendScreening.innerHTML = "Screening";
        legendScreening.style.background = 'rgb(0,0,255,0.4)'/*'blue'*/;
        var legendConsolidation = L.DomUtil.create("div");
        legendConsolidation.innerHTML = "Consolidation";
        legendConsolidation.style.background = 'rgb(255,165,0,0.4)'/*'orange'*/;
        var legendRA = L.DomUtil.create("div");
        legendRA.innerHTML = "Refrigeration Area";
        legendRA.style.background = 'rgb(255,0,0,0.4)'/*'red'*/;
        container.appendChild(legendReceving);
        container.appendChild(legendScreening);
        container.appendChild(legendPutaway);
        container.appendChild(legendConsolidation);
        container.appendChild(legendRA);
        /** */
        return container;
      }
    });
  }
  toggleShipments = (e) => {
    if (e.target.checked) {
      if (playBackRendered) {
        this.clearPlayBack();
      } else if (heatMapRendered) {
        this.clearHeatMap();
      } else this.addShipments();
    }
    else this.removeEpcMarkere();
  }
  toggleAssetLayer = (e) => {
    if (e.target.checked) {
      if (heatMapRendered) {
        if (heatmapLayer != null && heatmapLayer != undefined) map.removeLayer(heatmapLayer);
        heatmapLayer = null;
        heatMapRendered = false;
      }
      if (playBackRendered) {
        if (playBackLayer != null) {
          map.removeLayer(playBackLayer);
          playBackLayer = null;
        }
        playBackRendered = false;
      }
      this.addAssetsToMap(this.props.assets.assets, this.props.filters.assetFilters);
    }
    else this.removeAssetsFromMap();
  }


  addCustomPanes = () => {
    map.createPane('locationViewPane');
    map.getPane('locationViewPane').style.zIndex = 300;
    map.getPane('locationViewPane').style.display = 'none';
    map.createPane('areaViewPane');
    map.getPane('areaViewPane').style.zIndex = 300;
    map.getPane('areaViewPane').style.display = 'none';
    map.createPane('subareaViewPane');
    map.getPane('subareaViewPane').style.zIndex = 300;
    map.getPane('subareaViewPane').style.display = 'none';
    map.createPane('shipmentViewPane');
    map.getPane('shipmentViewPane').style.zIndex = 400;
  }
  addShipmentEpcMarker = epcArrOrig => {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.epcObjectInQueue = epcArrOrig;
    this.timer = setTimeout(this.addShipments, 150);
  }
  addShipments = epcArrOrig => {
    //console.debug('addShipments====>ENTRY');
    if (!document.getElementById("shipmentLayerToggleButton").checked) return;
    if (epcArrOrig === null || epcArrOrig === undefined) {
      if (this.epcObjectInQueue === null || this.epcObjectInQueue === undefined) return;
      epcArrOrig = this.epcObjectInQueue;
    }
    shipmentsLoaded = true; this.setState({ showProgress: false })
    //if (heatMapRendered === true || playBackRendered === true) return;
    let epcArr = [];
    let filter = this.props.filters.shipmentFilters;
    let layout = null;
    try {
      for (var key in thisObject.props.coordinateObj.locationcoordinate) {
        if (thisObject.props.coordinateObj.locationcoordinate[key].city === thisObject.currentSiteName) {
          layout = thisObject.props.coordinateObj.locationcoordinate[key];
        }
      }
    } catch (e) { console.debug('Exception in warehouse layout (addShipmentEpcMarker) : ' + e.message) }

    try {
      epcArrOrig.forEach((item, index) => {
        let rfid = item.epc;
        let refNo = item.reference_number.indexOf('_') !== -1 ? item.reference_number.substring(0, item.reference_number.indexOf('_')) : item.reference_number;
        let qty = item.reference_number.indexOf('_') !== -1 ? item.reference_number.substring(item.reference_number.indexOf('_') + 1) : 0;
        let locName = item.dhl_site_location.location_name;
        let assetId = item.device_id;
        let timeStamp = (item.warehouse_in_time !== null) ? item.warehouse_in_time : item.rfid_timestamp;
        let age = Math.round(((new Date().getTime()) - (new Date(timeStamp).getTime())) / (60 * 60 * 1000), 2);
        let icon = this.getEPCIcon(refNo, age);
        let considerData = false;
        if (filter == null || filter == undefined || filter.indexOf(locName) !== -1) {
          considerData = true;
        }
        if (considerData) {
          epcArr.push({ epc: rfid, refNo: refNo, qty: qty, assetId: assetId, location_name: locName, time: timeStamp, age: age, icon: icon, locationxy: { xy: [item.locationxy.xy[0], item.locationxy.xy[1]] } })
        }
      });
      if (!_.isNil(epcArr)) {
        if (epcArr.length > 0) {
          mcg = L.markerClusterGroup({
            chunkedLoading: true,
            //singleMarkerMode: true,
            spiderfyOnMaxZoom: true,
            maxClusterRadius: this.getClusterRadiusSetting(),
            //pane : 'shipmentViewPane',
            iconCreateFunction: function (cluster) { return createIcon(cluster) }
          });
          map.addLayer(mcg);
          epcArr.forEach((item, index) => {

            let epcmark = L.marker(item.locationxy.xy,
              (item.icon === null) ? {
                refNo: item.refNo,
                contextmenu: true,
                contextmenuItems: [{
                  text: 'Playback',
                  callback: this.contextMenuCallBack
                }],
                //pane : 'shipmentViewPane'
              } : {
                  refNo: item.refNo,
                  contextmenu: true,
                  contextmenuItems: [{
                    text: 'Playback',
                    callback: this.contextMenuCallBack
                  }],
                  icon: item.icon,
                  //pane : 'shipmentViewPane'
                }).
              bindTooltip(createPreviewCard(item)).
              bindPopup(createPreviewCard(item))
            mcg.addLayer(epcmark);
            epcMarkr.push(epcmark);
          });
        }
      }
    } catch (e) {
      console.debug('Exception while renddering epc markers => ' + e.message)
    }
  };

  getEPCIcon = (refNo, age) => {
    let icon = null;
    try {
      if (this.props.system.props.length === 0 || this.props.system.props.epc_alert_thresholds_onHand === null ||
        this.props.system.props.epc_alert_thresholds_longDuration === null) {
        return icon;
      }
      /****sys props */
      const lfProp = this.props.system.props.epc_alert_thresholds_land_freight.properties;
      const ofProp = this.props.system.props.epc_alert_thresholds_ocean_freight.properties;
      const landFreightMedium = lfProp.medium.min !== null ? (lfProp.medium.min * 24) : 48;
      const landFreightSevere = lfProp.severe.min !== null ? (lfProp.severe.min * 24) : 72;
      const oceanFreightMedium = ofProp.medium.min !== null ? (ofProp.medium.min * 24) : 120;
      const oceanFreightSevere = ofProp.severe.min !== null ? (ofProp.severe.min * 24) : 168;
      /*** sys props */
      if (refNo.startsWith('DH')) {
        icon = (age >= landFreightSevere) ? iconProvider.fetchShipmentIcon('SEVERE') : (age >= landFreightMedium ? iconProvider.fetchShipmentIcon('MEDIUM') : null)
      } else if (refNo.startsWith('DO')) {
        icon = (age >= oceanFreightSevere) ? iconProvider.fetchShipmentIcon('SEVERE') : (age >= oceanFreightMedium ? iconProvider.fetchShipmentIcon('MEDIUM') : null)
      }
    } catch (e) {
      console.debug('Exception in getEPCIcon => ' + e.message);
    }
    return icon;
  }

  renderSpecificEPC = (epc) => {
    //console.debug('=====> coming to renderSpecificEPC')
    singleMarkerMode = true;
    try {
      map.setView(epc[0].locationxy.xy, 1)
    } catch (e) {
      console.log('Exception in renderSpecificEPC => ' + e.message);
    }
    setTimeout(() => {
      try {
        thisObject.removeEpcMarkere();
        thisObject.addShipmentEpcMarker(epc);
      } catch (e) {
        console.log('Exception in renderSpecificEPC => ' + e.message);
      }
    }, 1500)
  }

  addAssetsToMap = (assets, filter) => {
    if (document.getElementById("assetLayerToggleButton") === null || document.getElementById("assetLayerToggleButton") === undefined || !document.getElementById("assetLayerToggleButton").checked) return;
    //if (heatMapRendered == true || playBackRendered == true) return;
    this.removeAssetsFromMap();
    let assetArr = [];
    let deviceStatus = this.props.assets.status;
    assets.forEach((item, index) => {
      let considerData = false;
      if (filter == null || filter == undefined) {
        considerData = true;
      } else {
        try {
          if (filter.status.indexOf(deviceStatus[item.device_id].mode) !== -1) {
            considerData = true;
          }
        } catch (e) {
          //console.debug('Exception while checkig the device status => ', e.message);
        }
      }
      if (considerData) {
        assetArr.push({
          assetId: item.device_id,
          time: (assetsCache[item.device_id] !== null && assetsCache[item.device_id] !== undefined) ? assetsCache[item.device_id].timestamp : item.device_timestamp,
          locationxy: { xy: (assetsCache[item.device_id] !== null && assetsCache[item.device_id] !== undefined) ? assetsCache[item.device_id].xy : item.locationxy.xy }
        })
      }
    });
    try {
      if (!_.isNil(assetArr)) {
        if (assetArr.length > 0) {
          asset_mcg = L.markerClusterGroup({
            chunkedLoading: true,
            spiderfyOnMaxZoom: false,
            maxClusterRadius: this.getClusterRadiusSetting()
          });
          map.addLayer(asset_mcg);
          assetArr.forEach((item, index) => {
            let asset = L.marker(item.locationxy.xy, { icon: iconProvider.fetchForkliftIcon(deviceStatus[item.assetId].mode) }).
              bindTooltip(createAssetPreviewCard(item)).
              bindPopup(createAssetPreviewCard(item))
            asset_mcg.addLayer(asset);
            assetLayer.push(asset);
            assetToLayerMap[item.assetId] = asset;
          });
        }
      }
    } catch (e) {
      console.debug('Exception while adding assets to map =>' + e.message);
    }
  };

  renderSpecificAsset = (asset) => {
    try {
      thisObject.removeAssetsFromMap();
      if (asset !== null) thisObject.addAssetsToMap([asset]);
    } catch (e) {
      console.log('Exception in renderSpecificAsset => ' + e.message);
    }
  }

  resetMap = () => {
    //console.debug('Warehouse layout => resetMap =>ENTRY');
    if (playBackRendered) {
      if (playBackLayer != null) {
        map.removeLayer(playBackLayer);
        playBackLayer = null;
      }
      playBackRendered = false;
    }
    if (heatMapRendered) {
      if (heatmapLayer != null) {
        map.removeLayer(heatmapLayer);
        heatmapLayer = null;
      }
      heatMapRendered = false;
    }
    if (singleMarkerMode) {
      this.removeEpcMarkere();
      singleMarkerMode = false;
    }
    this.showSiteMap();
    this.addShipmentEpcMarker(this.props.epcObj.epc);
  }
  removeEpcMarkere = () => {
    //console.debug('warehouse layout => removeEpcMarkere => ENTRY');
    if (epcMarkr.length > 0) {
      epcMarkr.forEach((item, index) => {
        mcg.removeLayer(item);
      });
      epcMarkr = [];
    }
  };
  removeAssetsFromMap = () => {
    if (assetLayer.length > 0) {
      assetLayer.forEach((item, index) => {
        asset_mcg.removeLayer(item);
      });
      assetLayer = [];
      assetToLayerMap = {};
    }
  };
  randomNumber = (min, max) => {
    return Math.random() * (max - min) + min;
  };

  renderHeatMap = (evt) => {
    if (evt == 0) {
      this.clearHeatMap(); return;
    }
    if (heatMapRendered == false) heatMapRendered = true;
    if (heatmapLayer != null && heatmapLayer != undefined) map.removeLayer(heatmapLayer);
    document.getElementById("shipmentLayerToggleButton").checked = false;
    document.getElementById("shipmentLayerToggleButton").dispatchEvent(new Event('change'));
    this.removeEpcMarkere();
    document.getElementById("assetLayerToggleButton").checked = false;
    document.getElementById("assetLayerToggleButton").dispatchEvent(new Event('change'));
    this.removeAssetsFromMap();

    var testData = {
      max: 8,
      data: []
    };
    let data = [];
    let selectedHours = document.getElementById('slider-input-for-slider').value;
    let currentTime = new Date().getTime();
    let endTime = currentTime - selectedHours * 60 * 60 * 1000;

    this.props.epcObj.epc.forEach((item, index) => {
      let epcTime = (item.warehouse_in_time !== null) ? new Date(item.warehouse_in_time).getTime() : new Date(item.rfid_timestamp).getTime();
      if (epcTime <= endTime) {
        testData.data.push({ lat: item.locationxy.xy[0], lng: item.locationxy.xy[1], count: 1 })
      }
    });

    var cfg = {
      "radius": this.getHeatmapRadiusSetting(),
      "maxOpacity": .8,
      "scaleRadius": true,
      "useLocalExtrema": true,
      latField: 'lat',
      lngField: 'lng',
      valueField: 'count'
    };
    heatmapLayer = new HeatmapOverlay(cfg);
    heatmapLayer.addTo(map);
    heatmapLayer.setData(testData);
  };
  clearHeatMap = (evt) => {
    if (heatMapRendered) {
      if (heatmapLayer != null && heatmapLayer != undefined) map.removeLayer(heatmapLayer);
      heatmapLayer = null;
      heatMapRendered = false;
      document.getElementById("shipmentLayerToggleButton").checked = true;
      document.getElementById("shipmentLayerToggleButton").dispatchEvent(new Event('change'));
      this.addShipmentEpcMarker(this.props.epcObj.epc);
    }
  };

  contextMenuCallBack = (evt) => {
    const refNo = evt.relatedTarget.options.refNo;
    let url = '/epc/movement/epcid/' + refNo;
    axios.get(url).then((res) => {
      if (res.data.length !== 0) {
        map.fitBounds([
          [0, 0],
          [500, 700]
        ]);
        this.playBack(res.data);
      }
    }).catch((err) => {
      console.log(err.message);
    });
  }
  playBack = (evt) => {
    if (evt == 0) {
      this.clearPlayBack(); return;
    }
    if (playBackRendered == false) playBackRendered = true;
    document.getElementById("shipmentLayerToggleButton").checked = false;
    document.getElementById("shipmentLayerToggleButton").dispatchEvent(new Event('change'));
    this.removeEpcMarkere();
    document.getElementById("assetLayerToggleButton").checked = false;
    document.getElementById("assetLayerToggleButton").dispatchEvent(new Event('change'));
    this.removeAssetsFromMap();
    this.clearHeatMap();
    let speed = (map.getZoom() < 0.5 ? 50 : Math.round(map.getZoom() * 200));
    if (playBackLayer != null) map.removeLayer(playBackLayer);

    let playbackList = [];
    if (evt.length != 0) {
      lastPlayBackItem = evt;
      evt.forEach((item, index) => {
        var coords = item.locationxy_coordinate.xy;
        var loc = item.dhl_site_location.location_name;
        playbackList.unshift({
          'refNo': item.reference_number.indexOf('_') !== -1 ? item.reference_number.substring(0, item.reference_number.indexOf('_')) : item.reference_number,
          qty: item.reference_number.indexOf('_') !== -1 ? item.reference_number.substring(item.reference_number.indexOf('_') + 1) : 0,
          pixelY: coords[0], pixelX: coords[1], location_name: loc, age: 'NA', time: item.rfid_timestamp, assetId: item.device_id
        });
      })
    }
    if (playbackList.length == 1) {
      var one = undefined;
      if (playbackList[0].exceptional) {
        one = L.marker([playbackList[0].pixelY, playbackList[0].pixelX], { icon: iconProvider.fetchShipmentIcon('SEVERE') }).addTo(map);
        //one.bindPopup(playbackList[0].timeInZone);
        one.bindTooltip(createPreviewCard(playbackList[0]))
      } else {
        one = L.marker([playbackList[0].pixelY, playbackList[0].pixelX]).addTo(map);
        //one.bindPopup(playbackList[0].timeInZone);
        one.bindTooltip(createPreviewCard(playbackList[0]))
      }
    } else if ((playbackList.length % 2) == 1) {
      var one = undefined;
      var route = L.layerGroup();
      playBackLayer = route;
      for (var i = playbackList.length - 1; i >= 0; i--) {
        if (playbackList[i].exceptional) {
          one = L.marker([playbackList[i].pixelY, playbackList[i].pixelX], { icon: iconProvider.fetchShipmentIcon('SEVERE') }).addTo(route);
          //one.bindPopup(playbackList[i].timeInZone);
          one.bindTooltip(createPreviewCard(playbackList[i]))
        } else {
          one = L.marker([playbackList[i].pixelY, playbackList[i].pixelX]).addTo(route);
          //one.bindPopup(playbackList[i].timeInZone);
          one.bindTooltip(createPreviewCard(playbackList[i]))
        }
        if (i > 0) {
          L.polyline([[playbackList[i].pixelY, playbackList[i].pixelX], [playbackList[i - 1].pixelY, playbackList[i - 1].pixelX]], { snakingSpeed: speed }).addTo(route);
        }
      }
      route.addTo(map).snakeIn();
    } else if ((playbackList.length % 2) == 0) {
      var one = undefined;
      var route = L.layerGroup();
      playBackLayer = route;
      for (var i = playbackList.length - 1; i >= 0; i--) {
        if (playbackList[i].exceptional) {
          one = L.marker([playbackList[i].pixelY, playbackList[i].pixelX], { icon: iconProvider.fetchShipmentIcon('SEVERE') }).addTo(route);
          //one.bindPopup(playbackList[i].timeInZone);
          one.bindTooltip(createPreviewCard(playbackList[i]))
        } else {
          one = L.marker([playbackList[i].pixelY, playbackList[i].pixelX]).addTo(route);
          //one.bindPopup(playbackList[i].timeInZone);
          one.bindTooltip(createPreviewCard(playbackList[i]))
        }

        if (i > 0) {
          L.polyline([[playbackList[i].pixelY, playbackList[i].pixelX], [playbackList[i - 1].pixelY, playbackList[i - 1].pixelX]], { snakingSpeed: speed }).addTo(route);
        }

      }
      route.addTo(map).snakeIn();
    }
  }
  clearPlayBack = (evt) => {
    if (playBackRendered) {
      if (playBackLayer != null) {
        map.removeLayer(playBackLayer);
        playBackLayer = null;
      }
      playBackRendered = false;
      document.getElementById("shipmentLayerToggleButton").checked = true;
      document.getElementById("shipmentLayerToggleButton").dispatchEvent(new Event('change'));
      this.addShipmentEpcMarker(this.props.epcObj.epc);
    }
  }
  getInitialZoomSetting = () => {
    try {
      return this.props.system.props.initial_zoom_level.properties.value;
    } catch (e) {
      try {
        return sysProps.initial_zoom_level.properties.value;
      } catch (e) {
        return 0.4;
      }
    }
  };
  getClusterRadiusSetting = () => {
    try {
      return this.props.system.props.cluster_radius.properties.value;
    } catch (e) {
      try {
        return sysProps.cluster_radius.properties.value;
      } catch (e) {
        return 25;
      }
    }
  };
  getHeatmapRadiusSetting = () => {
    try {
      return parseInt(this.props.system.props.heatmap_radius.properties.value);
    } catch (e) {
      try {
        return parseInt(sysProps.heatmap_radius.properties.value);
      } catch (e) {
        return 25;
      }
    }
  };
  getZoomLevelToLayoutMapping = () => {
    try {
      return this.props.system.props.zoom_level_to_layout_mapping.properties;
    } catch (e) {
      try {
        return sysProps.zoom_level_to_layout_mapping.properties;
      } catch (e) {
        return {
          location: { min: 0, max: 0.5 },
          area: { min: 0.5, max: 1 },
          subarea: { min: 1, max: 10 }
        };
      }
    }
  };
  render() {
    return (
      <div>
        <div id="map" style={{ width: '100%' }}></div>
        <div>
          <Loading
            active={this.state.showProgress}
            style={{ margin: 'auto' }}
            className="some-class"
            description="Active loading indicator"
            small={false}
            withOverlay={true}
          />
        </div>
      </div>
    );
  }
}
const refreshLayers = (evt) => {
  //console.debug('Warehouse layout => refreshLayers => ENTRY' + evt);
  try {
    if (evt.type === 'moveend') {
      refreshLayoutOnMap();
      findVisibleZones();
    }
    if (evt.type === 'selectionChanged') {
      thisObject.removeEpcMarkere();
      thisObject.addShipmentEpcMarker(thisObject.props.epcObj.epc);
    }
  } catch (e) {
    console.debug('Exception while refreshing layers => ', e.message)
  }
}

const refreshLayoutOnMap = () => {
  const sysProp = thisObject.getZoomLevelToLayoutMapping();
  if (map.getZoom() < parseFloat(sysProp.location.max) && map.getPane('locationViewPane').style.display === 'none') {
    map.getPane('areaViewPane').style.display = 'none'
    map.getPane('subareaViewPane').style.display = 'none'
    map.getPane('locationViewPane').style.display = 'block'
    gZoneLayers.location.forEach((layer) => { layer.openTooltip() })
  } else if (map.getZoom() >= parseFloat(sysProp.area.min) && map.getZoom() < parseFloat(sysProp.area.max) && map.getPane('areaViewPane').style.display === 'none') {
    map.getPane('locationViewPane').style.display = 'none'
    map.getPane('subareaViewPane').style.display = 'none'
    map.getPane('areaViewPane').style.display = 'block'
    gZoneLayers.area.forEach((layer) => { layer.openTooltip() })
  } else if (map.getZoom() >= parseFloat(sysProp.subarea.min) && map.getPane('subareaViewPane').style.display === 'none') {
    map.getPane('locationViewPane').style.display = 'none'
    map.getPane('areaViewPane').style.display = 'none'
    map.getPane('subareaViewPane').style.display = 'block'
    gZoneLayers.subarea.forEach((layer) => { layer.openTooltip() })
  }
}

const findVisibleZones = () => {
  if (thisObject.visibleZoneUpdateTimer !== null) {
    clearTimeout(thisObject.visibleZoneUpdateTimer);
  }
  thisObject.visibleZoneUpdateTimer = setTimeout(updateVisibleZones, 150);
}

const addLayoutToMap = () => {
  let layout = null;
  findVisibleZones();
  try {
    for (var key in thisObject.props.coordinateObj.locationcoordinate) {
      if (thisObject.props.coordinateObj.locationcoordinate[key].city === thisObject.currentSiteName) {
        layout = thisObject.props.coordinateObj.locationcoordinate[key];
      }
    }
    if (layout === null || layout === undefined) return;
    layoutLoaded = true;
    for (var locationName in layout.locations) {
      //create layout at location level
      addZone(locationName, layout.locations[locationName], layout, 'locationViewPane')
      if (Object.keys(layout.locations[locationName].areas).length !== 0) {
        for (var areaName in layout.locations[locationName].areas) {
          //create layout at area level
          addZone(areaName, layout.locations[locationName].areas[areaName], layout, 'areaViewPane')
          if (Object.keys(layout.locations[locationName].areas[areaName].sub_areas).length !== 0) {
            for (var subareaName in layout.locations[locationName].areas[areaName].sub_areas) {
              //create layout at subarea level
              addZone(subareaName, layout.locations[locationName].areas[areaName].sub_areas[subareaName], layout, 'subareaViewPane')
            }
          } else {
            addZone(areaName, layout.locations[locationName].areas[areaName], layout, 'subareaViewPane')
          }
        }
      } else {
        addZone(locationName, layout.locations[locationName], layout, 'areaViewPane')
        addZone(locationName, layout.locations[locationName], layout, 'subareaViewPane')
      }
    }
    refreshLayoutOnMap();
  } catch (e) {
    console.log('Exception while adding layout to map. ' + e.message);
  }
}

const insideBoundary = (item) => {
  let withInBoundary = false;
  try {
    item.latlon.forEach((coordinate, index) => {
      if (map.getBounds().contains(coordinate)) {
        withInBoundary = true;
      }
    })
  } catch (e) {
    console.debug(e.message)
  }
  return withInBoundary;
}

const updateVisibleZones = () => {
  //console.log('Warehouse layout => updateVisibleZones => ENTRY');
  let layout = null;
  let newVisibleZones = { locations: [], areas: [], subareas: [] }
  const sysProp = thisObject.getZoomLevelToLayoutMapping();
  try {
    for (var key in thisObject.props.coordinateObj.locationcoordinate) {
      if (thisObject.props.coordinateObj.locationcoordinate[key].city === thisObject.currentSiteName) {
        layout = thisObject.props.coordinateObj.locationcoordinate[key];
      }
    }
    for (var locationName in layout.locations) {
      if (insideBoundary(layout.locations[locationName]) === true) {
        newVisibleZones.locations.push(locationName);
      }
      if (Object.keys(layout.locations[locationName].areas).length !== 0 && map.getZoom() >= parseFloat(sysProp.area.min)) {
        for (var areaName in layout.locations[locationName].areas) {
          if ((map.getZoom() < parseFloat(sysProp.area.max) || Object.keys(layout.locations[locationName].areas[areaName].sub_areas).length === 0)
            && insideBoundary(layout.locations[locationName].areas[areaName]) === true) {
            newVisibleZones.areas.push(areaName);
            if (newVisibleZones.locations.indexOf(locationName) == -1) newVisibleZones.locations.push(locationName);
          }
          if (Object.keys(layout.locations[locationName].areas[areaName].sub_areas).length !== 0 && map.getZoom() >= parseFloat(sysProp.subarea.min)) {
            for (var subareaName in layout.locations[locationName].areas[areaName].sub_areas) {
              if (insideBoundary(layout.locations[locationName].areas[areaName].sub_areas[subareaName]) === true) {
                newVisibleZones.subareas.push(subareaName);
                if (newVisibleZones.areas.indexOf(areaName) == -1) newVisibleZones.areas.push(areaName);
                if (newVisibleZones.locations.indexOf(locationName) == -1) newVisibleZones.locations.push(locationName);
              }
            }
          }
        }
      }
    }
    if (JSON.stringify(newVisibleZones) !== JSON.stringify(thisObject.props.layoutZones.visibleZones)) {
      thisObject.props.onVisibleZonesChange(newVisibleZones);
    }
  } catch (e) {
    console.debug('Exception while updating visible zones => ', e.message);
  }
};

const addZone = (locationName, zoneObj, layout, customPane) => {
  let zoneLayer = null;
  zoneLayer = L.polygon(zoneObj.latlon, {
    color: "red",
    weight: 0.6,
    'z-index': 2,
    fillColor: fillColors[(zoneObj.type === 'location') ? locationName :
      (zoneObj.type === 'area') ? layout.hierarchy[locationName] : layout.hierarchy[layout.hierarchy[locationName]]
    ],
    fillOpacity: 0.4,
    pane: customPane
  });
  if (
    locationName.includes("Stage 05 South") ||
    locationName.includes("Stage 06 South") ||
    locationName.includes("Stage 07 South") ||
    locationName.includes("Stage 08 South") ||
    locationName.includes("North")
  ) {
    zoneLayer
      .bindTooltip(locationName, {
        permanent: true,
        direction: "center",
        className: "my-labels-vertical",
        pane: customPane
      })
  } else {
    zoneLayer
      .bindTooltip(locationName, {
        permanent: true,
        direction: "center",
        className: "my-labels",
        pane: customPane
      })
  }
  if (zoneLayer != null) {
    var layers = L.layerGroup([zoneLayer]);
    layers.eachLayer(function (layer) {
      layer.addTo(map);
      customPane === 'locationViewPane' ? gZoneLayers.location.push(layer) : (
        customPane === 'areaViewPane' ? gZoneLayers.area.push(layer) : gZoneLayers.subarea.push(layer)
      );
    });
  }
}

const createPreviewCard = (item) => {
  return "<div style='background:#ffcc00; padding:5px; font:inherit; margin:-5px; border-radius:5px'>" +
    "<table><tbody>" +
    "<tr><td>Ref No</td><td style='padding-left:5px;padding-right:5px'>:</td><td>" + item.refNo.substring(1, item.refNo.length) + "</td></tr>" +
    "<tr><td>Piece number</td><td style='padding-left:5px;padding-right:5px'>:</td><td>" + item.qty + "</td></tr>" +
    "<tr><td>Asset ID</td><td style='padding-left:5px;padding-right:5px'>:</td><td>" + item.assetId + "</td></tr>" +
    "<tr><td>Location</td><td style='padding-left:5px;padding-right:5px'>:</td><td>" + item.location_name + "</td></tr>" +
    "<tr><td>Age (Hrs)</td><td style='padding-left:5px;padding-right:5px'>:</td><td>" + item.age + "</td></tr>" +
    "<tr><td>Time</td><td style='padding-left:5px;padding-right:5px'>:</td><td>" + item.time.substring(0, item.time.length - 5) + "</td></tr>" +
    "</tbody></table></div>";
}

const createAssetPreviewCard = (item) => {
  return "<div style='background:#ffcc00; padding:5px; font:inherit; margin:-5px; border-radius:5px'>" +
    "<table><tbody>" +
    "<tr><td>Asset ID</td><td style='padding-left:5px;padding-right:5px'>:</td><td>" + item.assetId + "</td></tr>" +
    "<tr><td>Time</td><td style='padding-left:5px;padding-right:5px'>:</td><td>" + item.time.substring(0, item.time.length - 5) + "</td></tr>" +
    (thisObject.props.assets.status !== null && thisObject.props.assets.status[item.assetId] !== null ?
      "<tr><td>Device Mode</td><td style='padding-left:5px;padding-right:5px'>:</td><td>" + thisObject.props.assets.status[item.assetId].mode + "</td></tr>" : '') +
    "</tbody></table></div>";
}

socket.on('my_response', function (data) {
  try {
    let deviceData = JSON.parse(data);
    const deviceId = deviceData.ConeID;
    const newPosition = convertXandYIntoPixelCoordinates(deviceData);
    assetsCache[deviceId] = { xy: newPosition, epc: deviceData.EPC, timestamp: deviceData.timestamp }
    const mapLayer = assetToLayerMap[deviceId];
    if (mapLayer !== null && mapLayer !== undefined) {
      mapLayer.setLatLng(newPosition);
    }
  } catch (e) {
    console.debug('Exception while modifying the forklift location => ' + e.message);
  }
});

const createIcon = (cluster) => {
  var childCount = cluster.getChildCount();
  var c = ' marker-cluster-';
  if (childCount < 10) {
    c += 'small';
  }
  else if (childCount < 100) {
    c += 'medium';
  }
  else {
    c += 'large';
  }
  return new L.DivIcon({
    html: '<div><span>' + childCount + '</span></div>',
    className: 'marker-cluster' + c, iconSize: new L.Point(40, 40)
  });
}

const convertXandYIntoPixelCoordinates = (deviceData) => {
  var pixelInitializerX = 44.5;
  var pixelInitializerY = 45;
  var initializer = 15.24; // diff between the pillars

  var percentageChangeX = (deviceData.forkliftLocation.X) / initializer;
  var percentageChangeY = (deviceData.forkliftLocation.Y) / initializer;

  var newPositionX = pixelInitializerX * percentageChangeX;
  var newPositionY = pixelInitializerY * percentageChangeY;
  return [newPositionY, newPositionX];
}
const mapStateToProps = state => {
  return {
    coordinateObj: state.warehouseLayout,
    trackingObj: state.tracking,
    epcObj: state.epsState,
    assets: state.assetState,
    layoutZones: state.layoutZones,
    filters: state.filters,
    system: state.system
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onInitLocationLayoutCoordinate: (siteid) =>
      dispatch(actions.initLocationLayoutCoordinate(siteid)),
    onInitSiteCoordinate: () => dispatch(actions.initSiteLayoutCoordinate()),
    onInitAllEPC: (siteid) => dispatch(actions.initAllEPC(siteid)),
    onInitAllAssets: (siteid) => dispatch(actions.initAllAssets(siteid)),
    onInitLocationMapSelected: flag =>
      dispatch({
        type: actionTypes.ADD_SELECTED_LOCATION_MAP,
        selectedlocationmap: flag
      }),
    onInitSelectedSite: site =>
      dispatch({ type: actionTypes.ADD_SELCTED_SITE, siteselected: site }),
    onZoomLevelChange: zoomLevel =>
      dispatch({ type: actionTypes.MAP_ZOOM_CHANGE, currentZoomLevel: zoomLevel }),
    setMapLayersRefreshCallback: callBack =>
      dispatch({ type: actionTypes.MAP_REFRESH_LAYERS, callBackFunction: callBack }),
    setHeatMapRenderCallback: callBack =>
      dispatch({ type: actionTypes.MAP_RENDER_HEATMAP, callBackFunction: callBack }),
    setPlayBackCallback: callBack =>
      dispatch({ type: actionTypes.MAP_PLAY_BACK, callBackFunction: callBack }),
    setShowSpecificShipmentDetailCallback: callBack =>
      dispatch({ type: actionTypes.MAP_SHOW_SINGLE_EPC, callBackFunction: callBack }),
    setShowSpecificAssetDetailCallback: callBack =>
      dispatch({ type: actionTypes.MAP_SHOW_SINGLE_ASSET, callBackFunction: callBack }),
    onVisibleZonesChange: visibleZones =>
      dispatch({ type: actionTypes.MAP_VISIBLE_ZONE_CHANGE, visibleZones: visibleZones }),
    fetchSysProps: siteid => dispatch(actions.fetchSysProps(siteid)),
    setAddAssetsToMapCallback: callBack =>
      dispatch({ type: actionTypes.MAP_SHOW_ASSETS, callBackFunction: callBack })
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(WarehouseLayout);
