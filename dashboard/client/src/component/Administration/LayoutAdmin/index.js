import React from "react";
import * as actions from "../../../store/actions/index";
import * as actionTypes from "../../../store/actions/actionTypes";
import { connect } from "react-redux";
import Tree from 'react-animated-tree';
import L from "leaflet";
import w1 from "../../../images/ORDnew.PNG";
import axios from "../../../api";

import 'react-accessible-accordion/dist/fancy-example.css';
import {
    TextInput, TextArea, FormGroup
} from "carbon-components-react";

import _ from "lodash";
import { element } from "prop-types";

let thisObject = null;
let previewMap = null;
let hierarchyMap = {};
let addedZones = [];;
let currentlySelectedZone = null;

class LayoutAdmin extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

        };
        thisObject = this;
        this.onSelectionChange = this.onSelectionChange.bind(this);
    }

    componentDidMount() {

    }
    componentDidUpdate = prevProp => {

    };

    randomNumber = (min, max) => {
        return Math.random() * (max - min) + min;
    };

    createZone = (evt) => {
        document.getElementById('saveZoneButton').disabled = false;
        document.getElementById('modifyZoneButton').disabled = true;
        document.getElementById('deleteZoneButton').disabled = true;
    };

    saveZone = (evt) => {
        console.debug('save zone', evt);
    };

    modifyZone = (evt) => {
        const modifiedData = {
            "location_id":currentlySelectedZone.id,
            "locationxy_coordinate":{"xy": JSON.parse(document.getElementById('zoneCoordinates').value)},
            "site_id":currentlySelectedZone.siteId,
            "location_name":document.getElementById('zoneName').value,
            "action":"update",
           "is_logical":"F",
           "is_multipolygon":"F"
        }
        let url = '/layout/sitelocation/update';    
        axios.post(url,modifiedData).then((res) => {
            thisObject.props.onInitLocationLayoutCoordinate();
        }).catch((err) => {
            console.log(err.message);
        });
    };

    deleteZone = (evt) => {
        console.debug('delete zone', evt);
    };

    onCoordinateChange = (evt) => {
        try {
            addedZones.forEach((layer, index) => {
                previewMap.removeLayer(layer);
            });
            let newCoords = JSON.parse(evt.currentTarget.value);
            let validCoordinates = true;
            if (Array.isArray(newCoords)) {
                newCoords.forEach((latlon, i) => {
                    if (Array.isArray(latlon)) {
                        if (latlon.length > 0 && Array.isArray(latlon[0])) {
                            latlon.forEach((xy, i) => {
                                if (Array.isArray(xy) || xy.length !== 2 || typeof xy[0] !== 'number' || typeof xy[1] !== 'number') {
                                    validCoordinates = false;
                                }
                            })
                        } else if (latlon.length !== 2 || typeof latlon[0] !== 'number' || typeof latlon[1] !== 'number') {
                            validCoordinates = false;
                        }
                    } else validCoordinates = false;
                })
            } else {
                validCoordinates = false;
            }
            if (validCoordinates) {
                let zoneLayer = L.polygon(newCoords, {
                    color: "blue",
                    weight: 0.6,
                    'z-index': 2
                });
                zoneLayer.bindTooltip(currentlySelectedZone.name, {
                    permanent: true,
                    direction: "center",
                    className: "my-labels"
                }).openTooltip();
                if (zoneLayer != null) {
                    var zoneLayers = L.layerGroup([zoneLayer]);
                    zoneLayers.eachLayer(function (layer) {
                        layer.addTo(previewMap);
                        addedZones.push(layer);
                    });
                }
            }
        } catch (e) {
            console.debug('Exception in onCoordinateChange => ' + e.message);
        }

    };

    onSelectionChange = (evt) => {
        try {
            const selectedName = evt.currentTarget.text;
            var bounds = [
                [0, 0],
                [500, 700]
            ];
            if (previewMap != null) {
                previewMap.remove();
            }
            previewMap = L.map("previewMap", {
                crs: L.CRS.Simple,
                zoomControl: true,
                minZoom: 0,
                maxZoom: 0,
                zoomSnap: 0,
                zoomDelta: 0.2
            });
            previewMap.setZoom(0.0);
            previewMap.createPane('imagePane');
            previewMap.getPane('imagePane').style.zIndex = 1;
            const image = new L.ImageOverlay(w1, bounds, { pane: 'imagePane' }).addTo(previewMap);
            previewMap.fitBounds([
                [0, 0],
                [500, 700]
            ]);
            //previewMap.setZoom(0.0);
            const selectedZone = hierarchyMap[selectedName];
            currentlySelectedZone = selectedZone;
            if (selectedZone.type !== null) {
                document.getElementById('zoneName').value = selectedZone.name;
                document.getElementById('fg_zoneName').style.display = 'block'
                document.getElementById('zoneType').value = selectedZone.type;
                document.getElementById('fg_zoneType').style.display = 'block';
                if (selectedZone.type === 'site') {
                    document.getElementById('zoneParentSite').value = '';
                    document.getElementById('fg_zoneParentSite').style.display = 'none';
                    document.getElementById('zoneCoordinates').value = '';
                    document.getElementById('fg_zoneCoordinates').style.display = 'none'
                }
                if (selectedZone.type === 'site' || selectedZone.type === 'location') {
                    document.getElementById('zoneParentArea').value = '';
                    document.getElementById('fg_zoneParentArea').style.display = 'none';
                    document.getElementById('zoneParentLocation').value = '';
                    document.getElementById('fg_zoneParentLocation').style.display = 'none';
                }
                if (selectedZone.type === 'subarea') {
                    document.getElementById('zoneParentArea').value = selectedZone.parentName;
                    document.getElementById('fg_zoneParentArea').style.display = 'block';
                    document.getElementById('zoneParentLocation').value = selectedZone.locationName;
                    document.getElementById('fg_zoneParentLocation').style.display = 'block'
                }
                if (selectedZone.type === 'area') {
                    document.getElementById('zoneParentLocation').value = selectedZone.parentName;
                    document.getElementById('fg_zoneParentLocation').style.display = 'block';
                    document.getElementById('zoneParentArea').value = '';
                    document.getElementById('fg_zoneParentArea').style.display = 'none';
                }
                if (selectedZone.type === 'location' || selectedZone.type === 'subarea' || selectedZone.type === 'area') {
                    document.getElementById('zoneParentSite').value = selectedZone.siteName;
                    document.getElementById('fg_zoneParentSite').style.display = 'block';
                    document.getElementById('zoneCoordinates').value = JSON.stringify(selectedZone.latlon);
                    document.getElementById('fg_zoneCoordinates').style.display = 'block'
                }
            }
            if (selectedZone.type !== 'site') {
                let zoneLayer = L.polygon(selectedZone.latlon, {
                    color: "blue",
                    weight: 0.6,
                    'z-index': 2
                });
                zoneLayer.bindTooltip(selectedZone.name, {
                    permanent: true,
                    direction: "center",
                    className: "my-labels"
                }).openTooltip();
                if (zoneLayer != null) {
                    var zoneLayers = L.layerGroup([zoneLayer]);
                    zoneLayers.eachLayer(function (layer) {
                        layer.addTo(previewMap);
                        addedZones.push(layer);
                    });
                }
            }
            document.getElementById('saveZoneButton').disabled = true;
            document.getElementById('modifyZoneButton').disabled = false;
            document.getElementById('deleteZoneButton').disabled = false;
        } catch (e) {
            console.debug('Exception => (onSelectionChange) => ' + e.message);
        }
    }
    render() {
        let origHierarchy = { ...thisObject.props.coordinateObj.locationcoordinate };
        let hierarchy = [];
        try {
            for (var siteName in origHierarchy) {
                var layout = origHierarchy[siteName];
                var newSite = {
                    name: layout.city,
                    type: 'site',
                    id: layout.id,
                    children: []
                }
                hierarchy.push(newSite);
                hierarchyMap[newSite.name] = newSite;
                for (var locationName in layout.locations) {
                    var location = layout.locations[locationName];
                    var newLoc = {
                        name: locationName,
                        type: 'location',
                        id: location.id,
                        latlon: [...location.latlon],
                        parentId: layout.id,
                        parentName: layout.city,
                        siteId: layout.id,
                        siteName: layout.city,
                        children: []
                    }
                    newSite.children.push(newLoc);
                    hierarchyMap[locationName] = newLoc;
                    for (var areaName in location.areas) {
                        var area = location.areas[areaName];
                        var newArea = {
                            name: areaName,
                            type: 'area',
                            id: area.id,
                            latlon: [...area.latlon],
                            parentId: location.id,
                            parentName: locationName,
                            siteId: layout.id,
                            siteName: layout.city,
                            children: []
                        }
                        newLoc.children.push(newArea);
                        hierarchyMap[areaName] = newArea;
                        for (var subareaName in area.sub_areas) {
                            var subArea = area.sub_areas[subareaName];
                            var newSubArea = {
                                name: subareaName,
                                type: 'subarea',
                                id: subArea.id,
                                latlon: [...subArea.latlon],
                                parentId: area.id,
                                parentName: areaName,
                                locationId: location.id,
                                locationName: locationName,
                                siteId: layout.id,
                                siteName: layout.city
                            }
                            newArea.children.push(newSubArea);
                            hierarchyMap[subareaName] = newSubArea;
                        }
                    }
                }
            }
        } catch (e) {
            console.log('Exception while adding layout to mpa. ' + e.message);
        }
        return (
            <div className='layoutAdminContainer'>
                <div className='SiteTree divStyle'>
                    <p className='title'>Layout Hierarchy</p>
                    <div className='treeContainer'>
                        <Tree content="Sites" open>
                            {
                                hierarchy.map((site, i) => {
                                    return (
                                        <Tree content={<a href="#" onClick={this.onSelectionChange}>{site.name}</a>}>{
                                            site.children.map((location) => {
                                                return (
                                                    <Tree content={<a href="#" onClick={this.onSelectionChange}>{location.name}</a>}>
                                                        {
                                                            location.children.map((area) => {
                                                                return (
                                                                    <Tree content={<a href="#" onClick={this.onSelectionChange}>{area.name}</a>}>
                                                                        {
                                                                            area.children.map((subarea) => {
                                                                                return (
                                                                                    <Tree content={<a href="#" onClick={this.onSelectionChange}>{subarea.name}</a>}></Tree>
                                                                                )
                                                                            })
                                                                        }
                                                                    </Tree>
                                                                )
                                                            })
                                                        }
                                                    </Tree>
                                                )
                                            })
                                        }
                                        </Tree>
                                    )
                                })
                            }
                        </Tree>
                    </div>
                </div>
                <div className='EditArea divStyle'>
                    <p className='title'>Details</p>
                    <div className='editableContent'>
                        <FormGroup id='fg_zoneName' className="textFields">
                            <TextInput
                                id='zoneName'
                                labelText="Name"
                                type="text"
                            />
                        </FormGroup>
                        <FormGroup id='fg_zoneType' className="textFields">
                            <TextInput
                                id='zoneType'
                                labelText="Zone Type"
                                type="text"
                            />
                        </FormGroup>
                        <FormGroup id='fg_zoneParentArea' className="textFields">
                            <TextInput
                                id='zoneParentArea'
                                labelText="Area"
                                type="text"
                            />
                        </FormGroup>
                        <FormGroup id='fg_zoneParentLocation' className="textFields">
                            <TextInput
                                id='zoneParentLocation'
                                labelText="Location"
                                type="text"
                            />
                        </FormGroup>
                        <FormGroup id='fg_zoneParentSite' className="textFields">
                            <TextInput
                                id='zoneParentSite'
                                labelText="Site"
                                type="text"
                            />
                        </FormGroup>
                        <FormGroup id='fg_zoneCoordinates' className="textFields">
                            <TextArea
                                id="zoneCoordinates"
                                labelText="Coordinates"
                                rows={6}
                                onChange={this.onCoordinateChange}
                            />
                        </FormGroup>
                    </div>
                    <div>
                        <input className='button' onClick={this.createZone} type="submit" id='createZoneButton' value="Create" />
                        <input className='button' onClick={this.saveZone} type="submit" id='saveZoneButton' value="Save" disabled />
                        <input className='button' onClick={this.modifyZone} type="submit" id='modifyZoneButton' value="Modify" />
                        <input className='button' onClick={this.deleteZone} type="submit" id='deleteZoneButton' value="Delete" />
                    </div>
                </div>
                <div className='PreviewPane divStyle'>
                    <p className='title'>Preview</p>
                    <div id="previewMap" className='previewContainer'></div>
                </div>
            </div>
        );
    }
}


const typeStyles = {
    fontSize: '2em',
    verticalAlign: 'middle'
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
            dispatch(actions.initLocationLayoutCoordinate())
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(LayoutAdmin);
