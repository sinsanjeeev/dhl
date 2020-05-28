import React from "react";
import * as actions from "../../store/actions/index";
import * as actionTypes from "../../store/actions/actionTypes";
import { connect } from "react-redux";
import arrow_move from "../../images/arrows_drag_vert.svg";
import close_but from "../../images/arrows_circle_remove.png";

import L from "leaflet";
import HeatmapOverlay from "../../../node_modules/leaflet/dist/leaflet-heatmap";
import 'leaflet-plugin-trackplayback';
import 'leaflet-plugin-trackplayback/dist/control.trackplayback';
import 'leaflet-plugin-trackplayback/dist/control.playback.css';
import 'leaflet.polyline.snakeanim';
import w1 from "../../images/ORDnew.PNG";
import w2 from "../../images/SmartDraw-min.png";
import forkLiftIcon from "../../images/forklift.png";
import gZoneContainers from "../../data/zoneContainers";
import epcDataFromFile from "../../data/epcData";
import Collapsible from 'react-collapsible';
import './_Collapsible.scss';

import {

} from "carbon-components-react";

import _ from "lodash";
import { element } from "prop-types";
require("leaflet.markercluster");
let map = null;
let mrk = null;
let markInterval = null;
let locationMapLoaded = false;
let epcMarkr = [];
let gZoneLayers = [];
let gLogicalZoneNames = ['Receiving','Consolidation','Screening','Refrigeration Area','Putaway'];
let gZoneContainerNames = ['Eaton','Cat(1)','Cat(2)','OI','OE','Bulk F','Dell(2)','Dan Foss','Sandvik','Stage South','Ocean Log desk','Over sized','3M',
                          'Lane','Bulk E','Apple','Dell(1)','Moto','Siemens','Stage North','Stage A North'];

let gAllZones = [];
let transformation = {receiving:{xbase:0, ybase:0, x:0,y:0,r:1},screening:{xbase:0, ybase:0, x:0,y:0,r:1},putaway:{xbase:0, ybase:0, x:0,y:0,r:1},consolidation:{xbase:0, ybase:0, x:0,y:0,r:1}};
let heatmapLayer = null;
let playBackLayer = null;
let heatMapRendered = false;
let playBackRendered = false;
let image = null;
const redIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const orangeIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

  
let thisObject = null;
var greenIcon = L.icon({
  iconUrl: forkLiftIcon,
  //shadowUrl: 'leaf-shadow.png',

  iconSize: [20, 20] // size of the icon
  //shadowSize:   [50, 64], // size of the shadow
  //iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
  //shadowAnchor: [4, 62],  // the same for the shadow
  //popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});
var mcg = L.markerClusterGroup({
  chunkedLoading: true,
  //singleMarkerMode: true,
  spiderfyOnMaxZoom: false
});
var arr = [
  [209, 314],
  [209, 320],
  [209, 350],
  [209, 370],
  [209, 390],
  [209, 410],
  [209, 420],
  [209, 440],
  [209, 460],
  [209, 480],
  [209, 500],
  [209, 520],
  [209, 540],
  [209, 560],
  [209, 580],
  [209, 600],
  [209, 620],
  [209, 640],
  [209, 660],
  [220, 660],
  [240, 660],
  [260, 660],
  [280, 660],
  [300, 660],
  [320, 660],
  [340, 660],
  [350, 660],
  [350, 640],
  [350, 620],
  [350, 600],
  [350, 580],
  [350, 560],
  [350, 540],
  [350, 520],
  [350, 500],
  [350, 480],
  [350, 460],
  [350, 440],
  [350, 420],
  [350, 400],
  [350, 380],
  [350, 360],
  [350, 340],
  [350, 320],
  [350, 300],
  [350, 280],
  [350, 260],
  [350, 240],
  [350, 220],
  [340, 220],
  [320, 220],
  [300, 220],
  [280, 220],
  [260, 220],
  [260, 200],
  [260, 180],
  [260, 160],
  [260, 140],
  [260, 130],
  [240, 130],
  [220, 130],
  [200, 130]
];
var j = 0;
class WarehouseLayout extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      str: "",
      showShipmentFilter:false,
      showFilterByArea: false,
      showFilterBySubArea: false,
      visibleAreas : [],
      heatMapStartTime : null,
      heatMapEndTime : null
    };
    thisObject = this;
    //this.refreshLayers = refreshLayers.bind(this);
  }

  componentDidMount() {
    this.props.onInitLocationLayoutCoordinate();
    this.props.onInitSiteCoordinate();
    this.props.onInitAllEPC();
    this.props.setMapLayersRefreshCallback(refreshLayers);
  }
  componentDidUpdate = prevProp => {
    console.log("********************" + this.props.coordinateObj.site);
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
      this.removeEpcMarkere();
    } else {
      if (!_.isNil(mrk) && !_.isNil(map)) map.removeLayer(mrk);
      this.removeEpcMarkere();
      clearInterval(markInterval);
    }

    if (
      this.props.trackingObj.locationMapSelected === true &&
      this.props.trackingObj.selectedtracking === "epc"
    ) {
      if (!_.isNil(this.props.epcObj.epc)) {
        clearInterval(markInterval);
        this.addShipmentEpcMarker(this.props.epcObj.epc);
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
        L.marker(item.site_coordinate.xy, { title: item.city })
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
        L.marker(item.site_coordinate.xy, { title: item.city })
          .bindPopup(item.city)
          .bindTooltip(item.city)
          .on("click", this.markerOnClick)
          .addTo(map);
      });
    }
  };
  markerOnClick = e => {
    this.removeEpcMarkere();
    locationMapLoaded = true;

    //console.log(e.latlng);
    console.log(this.props.coordinateObj.locationcoordinate);
    let arr = this.props.coordinateObj.locationcoordinate;
    gAllZones = [...arr];
    var bounds = [
      [0, 0],
      [500, 700]
    ];
    map.remove();
    map = L.map("map", {
      //zoomControl: true,
      crs: L.CRS.Simple,
      // maxZoom: 18
      minZoom: 0,
      maxZoom: 10,
      zoomSnap: 0,
      zoomDelta: 0.2
    });
    var ZoomViewer = L.Control.extend({
      onAdd: function() {
        var container = L.DomUtil.create("div");
        var gauge = L.DomUtil.create("div");
        var resetButton = L.DomUtil.create("input");
        resetButton.type = "button";
        resetButton.style.width = "100%";
        resetButton.title="Reset Map";
        resetButton.value="Reset Map";
        resetButton.onclick=thisObject.resetMap;
        container.style.width = "100px";
        container.style.background = "rgba(255,255,255,0.5)";
        container.style.textAlign = "left";
        map.on("zoomstart zoom zoomend moveend", function(ev) {
          gauge.innerHTML = "Zoom level: " + Math.round(map.getZoom()*100)/100;
          thisObject.props.onZoomLevelChange(map.getZoom());

          //refreshLayers(ev);
        });
        container.appendChild(gauge);
        container.appendChild(resetButton);
        return container;
      }
    });

    map.createPane('imagePane');
    map.getPane('imagePane').style.zIndex = 0;
    image = new L.ImageOverlay(w1,bounds, {pane: 'imagePane'}).addTo(map);
    
    map.fitBounds([
      [0, 0],
      [500, 700]
    ]);
    if (!_.isNil(arr)) {
      addZonesToMap(gAllZones,gLogicalZoneNames)
    }
    new ZoomViewer().addTo(map);
    map.setZoom(0.2);
    
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
  };

  addShipmentEpcMarker = epcArrOrig => {
    if(heatMapRendered == true || playBackRendered == true)return;
    let epcArr = [];
    epcArrOrig.forEach((item, index) => {
      let rfid = item.epc
      let locName = item.dhl_site_location.location_name;
      let timeStamp = item.rfid_timestamp;
      let age = Math.round( ( (new Date().getTime()) - (new Date(timeStamp).getTime()) ) / (60*60*1000), 2);
      epcArr.push({epc:rfid,location_name:locName, time : timeStamp, age : age, locationxy:{xy:[item.locationxy.xy[0], item.locationxy.xy[1]]}})
    });
    if (!_.isNil(epcArr)) {
      if (epcArr.length > 0) {
        mcg = L.markerClusterGroup({
          chunkedLoading: true,
          //singleMarkerMode: true,
          spiderfyOnMaxZoom: false,
          maxClusterRadius:25
        });
        map.addLayer(mcg);
        epcArr.forEach((item, index) => {
          let epcmark = L.marker(item.locationxy.xy, (item.age <= 24 ? {} : (item.age < 72 ? {icon: orangeIcon}:{icon: redIcon}))).bindTooltip("<div style='background:#ffcc00'><p>ID : "+item.epc+"</p><p>Location : "+item.location_name+"</p><p>Age : "+item.age+"</p><p>Time : "+item.time+"</p></div>");
          mcg.addLayer(epcmark);
          epcMarkr.push(epcmark);
        });
      }
    }
  };
  resetMap = () => {
    if(playBackRendered){
      if(playBackLayer != null){
        map.removeLayer(playBackLayer);
        playBackLayer = null;
      }
      playBackRendered = false;
    }
    if(heatMapRendered){
      if(heatmapLayer != null){
        map.removeLayer(heatmapLayer);
        heatmapLayer = null;
      }
      heatMapRendered = false;
    } 
    this.markerOnClick();
  }
  removeEpcMarkere = () => {
    if (epcMarkr.length > 0) {
      epcMarkr.forEach((item, index) => {
        mcg.removeLayer(item);
      });
      epcMarkr = [];
    }
  };

  loadForkLiftIcon = () => {
    if (!_.isNil(mrk)) map.removeLayer(mrk);

    if (j > 61) {
      j = 0;
    }
    mrk = L.marker([arr[j][0], arr[j][1]], { icon: greenIcon }).addTo(map);
    j++;
  };
  randomNumber = (min, max) => {
    return Math.random() * (max - min) + min;
  };

  heatMapStartTimeChange = (evt) => {
    const value = evt.target ? evt.target.value : evt[0];
    this.setState({ heatMapStartTime: new Date(value).getTime() });
    console.debug(this.state.heatMapStartTime)
  };
  heatMapEndTimeChange = (evt) => {
    const value = evt.target ? evt.target.value : evt[0];
    this.setState({ heatMapEndTime: new Date(value).getTime() });
    console.debug(this.state.heatMapEndTime)
  };
  renderHeatMap = (evt) => {
    if(heatMapRendered == false)heatMapRendered = true;
    if(heatmapLayer != null && heatmapLayer != undefined)map.removeLayer(heatmapLayer);
    this.removeEpcMarkere();
    var testData = {
      max: 8,
      data: []
    };
    let data = [];
    let selectedHours = document.getElementById('slider-input-for-slider').value;
    let currentTime = new Date().getTime();
    let endTime = currentTime - selectedHours*60*60*1000;
    
    this.props.epcObj.epc.forEach((item, index) => {
      let epcTime = new Date(item.rfid_timestamp).getTime();
      if(epcTime <= endTime){
        testData.data.push({lat: item.locationxy.xy[0], lng:item.locationxy.xy[1], count: 1})
      }
    });
    
    var cfg = {
      "radius": 15,
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
    if(heatMapRendered){
      if(heatmapLayer != null && heatmapLayer != undefined)map.removeLayer(heatmapLayer);
      heatmapLayer = null;
      heatMapRendered = false;
      this.addShipmentEpcMarker(this.props.epcObj.epc);
    }
  };
  
  playBack = (evt)=> {
    if(playBackRendered == false)playBackRendered = true;
    this.removeEpcMarkere();
    this.clearHeatMap();
    let speed = (map.getZoom() < 0.5 ? 50 : Math.round(map.getZoom()*200));
    if(playBackLayer != null)map.removeLayer(playBackLayer);
    let playbackList = [
                        {pixelY:455,pixelX:288,location_name:'Consolidation',timeInZone:'2019-08-06 04:45:25'},
                        {pixelY:258,pixelX:124,location_name:'Putaway',timeInZone:'2019-08-06 02:48:25'},
                        {pixelY:100,pixelX:470,location_name:'Screening',timeInZone:'2019-08-06 02:42:37'},
                        {pixelY:67,pixelX:221,location_name:'Receiving',timeInZone:'2019-08-06 01:51:12'}
                      ];
    if (playbackList.length == 1) {
      var one = undefined;
      if (playbackList[0].exceptional){
      one  = L.marker([playbackList[0].pixelY, playbackList[0].pixelX], {icon: redIcon}).addTo(map);
      one.bindPopup(playbackList[0].timeInZone);
      } else{
      one = L.marker([playbackList[0].pixelY, playbackList[0].pixelX]).addTo(map);
      one.bindPopup(playbackList[0].timeInZone);
    }
    } else if ((playbackList.length % 2) == 1) {
      var one = undefined;
      var route = L.layerGroup();
      playBackLayer = route;
      for(var i=playbackList.length - 1; i >= 0 ; i--) {
        if (playbackList[i].exceptional){
          one  = L.marker([playbackList[i].pixelY, playbackList[i].pixelX], {icon: redIcon}).addTo(route);
          one.bindPopup(playbackList[i].timeInZone);
          } else{
          one = L.marker([playbackList[i].pixelY, playbackList[i].pixelX]).addTo(route);
          one.bindPopup(playbackList[i].timeInZone);
        }
        if (i > 0) {
        L.polyline([[playbackList[i].pixelY, playbackList[i].pixelX], [playbackList[i-1].pixelY, playbackList[i-1].pixelX]], {snakingSpeed: speed}).addTo(route);
        }
      }
      route.addTo(map).snakeIn();
    } else if ((playbackList.length % 2) == 0) {
      var one = undefined;
      var route = L.layerGroup();
      playBackLayer = route;
      for(var i=playbackList.length - 1; i >= 0 ; i--) {
        if (playbackList[i].exceptional){
          one  = L.marker([playbackList[i].pixelY, playbackList[i].pixelX], {icon: redIcon}).addTo(route);
          one.bindPopup(playbackList[i].timeInZone);
          } else{
          one = L.marker([playbackList[i].pixelY, playbackList[i].pixelX]).addTo(route);
          one.bindPopup(playbackList[i].timeInZone);
        }
        
        if (i > 0) {
        L.polyline([[playbackList[i].pixelY, playbackList[i].pixelX], [playbackList[i-1].pixelY, playbackList[i-1].pixelX]], {snakingSpeed: speed}).addTo(route);
        }
        
      }
      route.addTo(map).snakeIn();
    }
  }
  clearPlayBack = (evt) => {
    if(playBackRendered){
      if(playBackLayer != null){
        map.removeLayer(playBackLayer);
        playBackLayer = null;
      }
      playBackRendered = false;
      this.addShipmentEpcMarker(this.props.epcObj.epc);
    }
  }
  render() {
    return (
      <div>
        <div id="map"  style={{width:'100%'}}></div>
      </div>
    );
  }
}
const refreshLayers = (evt) => {
  alert();
  try{//reset heatmap based on zoom level
    if(evt.type === 'moveend' && heatMapRendered)thisObject.renderHeatMap();
  }catch(e){console.debug('Exception in refresh layers method : '+e.message)}
  try{//reset playback based on zoom level
    if(evt.type === 'moveend' && playBackRendered)thisObject.playBack();
  }catch(e){console.debug('Exception in refresh layers method : '+e.message)}
  if(evt.type === 'moveend' || evt.type === 'selectionChanged'){
    let currentZoomLevel = map.getZoom();
    gZoneLayers.forEach((layer, index) => {
      map.removeLayer(layer);
    })
    gZoneLayers = [];
    if(currentZoomLevel >= 0.5 && currentZoomLevel < 1){
      let zoneContainerNames = [];
      let noFilter = true;
      gZoneContainerNames.forEach((zoneContainerName)=>{
        try{
          if(document.getElementById('area_'+zoneContainerName) != null && document.getElementById('area_'+zoneContainerName) != undefined)noFilter=false;
          if(document.getElementById('area_'+zoneContainerName).checked){
            zoneContainerNames.push(zoneContainerName);
          }
        }catch(e){}
      })
      if(noFilter)
        addZonesToMap(gZoneContainers,gZoneContainerNames);
      else
        addZonesToMap(gZoneContainers,zoneContainerNames);
      let visibleAreas = []
      gZoneContainers.forEach((item, index) => {
        if(gZoneContainerNames.indexOf(item.location_name) != -1 && insideBoundary(item) === true){
          visibleAreas.push(item.location_name);
        }
      })
      thisObject.setState({
        showFilterByArea : true,
        showFilterBySubArea : false,
        visibleAreas:visibleAreas
      })
    } else if (currentZoomLevel >= 1){
      let subZones = [];
      gAllZones.forEach((item,index) => {
        if(gLogicalZoneNames.indexOf(item.location_name) == -1){
          subZones.push(item.location_name);
        }
      })
      addZonesToMap(gAllZones,subZones);
      thisObject.setState({
        showFilterByArea : true,
        showFilterBySubArea : true
      })
    } else if (currentZoomLevel < 0.5){
      let logicalZoneNames = [];
      let noFilter = true;
      gLogicalZoneNames.forEach((zoneName)=>{
        try{
          if(document.getElementById('location_'+zoneName)!=null && document.getElementById('location_'+zoneName)!= undefined)noFilter = false;
          if(document.getElementById('location_'+zoneName).checked){
            logicalZoneNames.push(zoneName);
          }
        }catch(e){}
      })
      if(noFilter){
        addZonesToMap(gAllZones,gLogicalZoneNames);
      }else {
        addZonesToMap(gAllZones,logicalZoneNames);
      }
      thisObject.setState({
        showFilterByArea : false,
        showFilterBySubArea : false
      })
    }
  }
}

const addZonesToMap = (zones, zoneNames) => {
  zones.forEach((item, index) => {
    if(zoneNames.indexOf(item.location_name) != -1 && insideBoundary(item) === true){
      var receiving = L.polygon(item.locationxy_coordinate.xy, {
        color: "red",
        weight: 1.2,
        fillColor: "white"
      });
      if (
        item.location_name.includes("Stage 05 South") ||
        item.location_name.includes("Stage 06 South") ||
        item.location_name.includes("Stage 07 South") ||
        item.location_name.includes("Stage 08 South") ||
        item.location_name.includes("North")
      ) {
        receiving
          .bindTooltip(item.location_name, {
            permanent: true,
            direction: "center",
            className: "my-labels-vertical"
          })
          .openTooltip();
      } else {
        receiving
          .bindTooltip(item.location_name, {
            permanent: true,
            direction: "center",
            className: "my-labels"
          })
          .openTooltip();
      }
  
      var zoneLayers = L.layerGroup([receiving]);
      zoneLayers.eachLayer(function(layer) {
        gZoneLayers.push(layer);
        layer.addTo(map);
      });
    }
  });
}
const insideBoundary = (item) => {
  let withInBoundary = true;
  item.locationxy_coordinate.xy.forEach((coordinate,index) => {
    if(!map.getBounds().contains(coordinate )){
      withInBoundary = false;
    }
  })
  return withInBoundary;
}

const mapStateToProps = state => {
  return {
    coordinateObj: state.warehouseLayout,
    trackingObj: state.tracking,
    epcObj: state.epsState
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onInitLocationLayoutCoordinate: () =>
      dispatch(actions.initLocationLayoutCoordinate()),
    onInitSiteCoordinate: () => dispatch(actions.initSiteLayoutCoordinate()),
    onInitAllEPC: () => dispatch(actions.initAllEPC()),
    onInitLocationMapSelected: flag =>
      dispatch({
        type: actionTypes.ADD_SELECTED_LOCATION_MAP,
        selectedlocationmap: flag
      }),
    onInitSelectedSite: site =>
      dispatch({ type: actionTypes.ADD_SELCTED_SITE, siteselected: site }),
    onZoomLevelChange: zoomLevel =>
      dispatch({ type: actionTypes.MAP_ZOOM_CHANGE, currentZoomLevel: zoomLevel }),
    setMapLayersRefreshCallback : callBack =>
      dispatch({ type: actionTypes.MAP_REFRESH_LAYERS, callBackFunction: callBack })
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(WarehouseLayout);
