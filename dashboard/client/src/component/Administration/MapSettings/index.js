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
    ComboBox, NumberInput
} from "carbon-components-react";

import _ from "lodash";
import { element } from "prop-types";

let thisObject = null;
let selectedSite = null;


class mapSettings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedSite: null,
            initialZoomLevel_propertyName: 'initial_zoom_level',
            clusterRadius_propertyName: 'cluster_radius',
            heatmapRadius_propertyName: 'heatmap_radius',
            zoomLevelToLayoutMapping_propertyName: 'zoom_level_to_layout_mapping',
            initialZoomLevel: { value: 0.4 },
            clusterRadius: { value: 0 },
            heatmapRadius: { value: 0 },
            zoomLevelToLayoutMapping: {
                location: { min: 0, max: 0 },
                area: { min: 0, max: 0 },
                subarea: { min: 0, max: 0 }
            },
            initialZoomLevel_Current: '',
            clusterRadius_Current: '',
            heatmapRadius_Current: '',
            zoomLevelToLayoutMapping_Current: ''
        };
        thisObject = this;
    }

    componentDidMount() {

    }
    componentDidUpdate = prevProp => {

    };

    randomNumber = (min, max) => {
        return Math.random() * (max - min) + min;
    };

    siteSelectionChanged = (evt) => {
        selectedSite = evt.selectedItem;
        document.getElementById('zoomLevelValidationErrorMessage').style.display = 'none';
        document.getElementById('speedValidationErrorMessage').style.display = 'none';
        if (selectedSite === null) {
            this.setState({ selectedSite: selectedSite });
        } else {
            this.fetchSysProps();
        }
    }
    fetchSysProps = (evt) => {
        const url = '/sysprops/site/' + selectedSite.site_id;
        axios.get(url).then((res) => {
            res.data.forEach((property) => {
                if (property.name === this.state.initialZoomLevel_propertyName) {
                    this.setState({ initialZoomLevel: property.properties, initialZoomLevel_Current: JSON.stringify(property.properties) })
                }
                if (property.name === this.state.clusterRadius_propertyName) {
                    this.setState({ clusterRadius: property.properties, clusterRadius_Current: JSON.stringify(property.properties) })
                }
                if (property.name === this.state.heatmapRadius_propertyName) {
                    this.setState({ heatmapRadius: property.properties, heatmapRadius_Current: JSON.stringify(property.properties) })
                }
                if (property.name === this.state.zoomLevelToLayoutMapping_propertyName) {
                    this.setState({ zoomLevelToLayoutMapping: property.properties, zoomLevelToLayoutMapping_Current: JSON.stringify(property.properties) })
                }
            })
        }).catch((err) => {
            console.log(err.message);
        });
    }
    handleInitialZoomLevelPropertyChange = (id) => {
        const value = document.getElementById(id).value;
        this.setState({ initialZoomLevel: { value: value } })
        if (this.state.initialZoomLevel_Current === JSON.stringify(this.state.initialZoomLevel)) {
            document.getElementById('zoomLevel.update.button').style.display = 'none';
        } else {
            document.getElementById('zoomLevelValidationErrorMessage').style.display = 'none';
            document.getElementById('zoomLevel.update.button').style.display = 'block';
        }
    }
    handleClusterRadiusPropertyChange = (id) => {
        const value = document.getElementById(id).value;
        this.setState({ clusterRadius: { value: value } })
        if (this.state.clusterRadius_Current === JSON.stringify(this.state.clusterRadius)) {
            document.getElementById('clusterRadius.update.button').style.display = 'none';
        } else {
            document.getElementById('clusterRadiusValidationErrorMessage').style.display = 'none';
            document.getElementById('clusterRadius.update.button').style.display = 'block';
        }
    }
    handleHeatmapRadiusPropertyChange = (id) => {
        const value = document.getElementById(id).value;
        this.setState({ heatmapRadius: { value: value } })
        if (this.state.heatmapRadius_Current === JSON.stringify(this.state.heatmapRadius)) {
            document.getElementById('heatmapRadius.update.button').style.display = 'none';
        } else {
            document.getElementById('heatmapRadiusValidationErrorMessage').style.display = 'none';
            document.getElementById('heatmapRadius.update.button').style.display = 'block';
        }
    }
    handleZoomLevelMappingChange = (id) => {
        const value = document.getElementById(id).value;
        let zoomLevelToLayoutMapping = { ...this.state.zoomLevelToLayoutMapping }
        switch (id) {
            case 'zlm.location.min': zoomLevelToLayoutMapping.location.min = value; break;
            case 'zlm.location.max': zoomLevelToLayoutMapping.location.max = zoomLevelToLayoutMapping.area.min = value; break;
            case 'zlm.area.min': zoomLevelToLayoutMapping.locationmax = zoomLevelToLayoutMapping.area.min = value; break;
            case 'zlm.area.max': zoomLevelToLayoutMapping.area.max = zoomLevelToLayoutMapping.subarea.min = value; break;
            case 'zlm.subarea.min': zoomLevelToLayoutMapping.area.max = zoomLevelToLayoutMapping.subarea.min = value; break;
            case 'zlm.subarea.max': zoomLevelToLayoutMapping.subarea.max = value; break;
            default: console.debug();
        }
        this.setState({ zoomLevelToLayoutMapping: zoomLevelToLayoutMapping })
        if (this.state.zoomLevelToLayoutMapping_Current === JSON.stringify(this.state.zoomLevelToLayoutMapping)) {
            document.getElementById('zlm.update.button').style.display = 'none';
        } else {
            if (parseFloat(zoomLevelToLayoutMapping.location.min) >= parseFloat(zoomLevelToLayoutMapping.location.max) ||
                parseFloat(zoomLevelToLayoutMapping.area.min) >= parseFloat(zoomLevelToLayoutMapping.area.max) ||
                parseFloat(zoomLevelToLayoutMapping.subarea.min) >= parseFloat(zoomLevelToLayoutMapping.subarea.max)) {
                document.getElementById('zlmValidationErrorMessage').style.display = 'block';
                document.getElementById('zlm.update.button').style.display = 'none';
            } else {
                document.getElementById('zlmValidationErrorMessage').style.display = 'none';
                document.getElementById('zlm.update.button').style.display = 'block';
            }
        }
    }
    updateInitialZoomLevel = (evt) => {
        const modifiedData = {
            "name": this.state.initialZoomLevel_propertyName,
            "properties": this.state.initialZoomLevel,
            "action": "update",
            "site_id": selectedSite.site_id,
        }
        let url = '/sysprops/update';
        axios.post(url, modifiedData).then((res) => {
            this.setState({ initialZoomLevel_Current: JSON.stringify(this.state.initialZoomLevel) })
            document.getElementById('zoomLevel.update.button').style.display = 'none';
            this.props.fetchSysProps(selectedSite.site_id);
        }).catch((err) => {
            console.log(err.message);
        });
    };

    updateClusterRadius = (evt) => {
        const modifiedData = {
            "name": this.state.clusterRadius_propertyName,
            "properties": this.state.clusterRadius,
            "action": "update",
            "site_id": selectedSite.site_id,
        }
        let url = '/sysprops/update';
        axios.post(url, modifiedData).then((res) => {
            this.setState({ clusterRadius_Current: JSON.stringify(this.state.clusterRadius) })
            document.getElementById('clusterRadius.update.button').style.display = 'none';
            this.props.fetchSysProps(selectedSite.site_id);
        }).catch((err) => {
            console.log(err.message);
        });
    };

    updateHeatmapRadius = (evt) => {
        const modifiedData = {
            "name": this.state.heatmapRadius_propertyName,
            "properties": this.state.heatmapRadius,
            "action": "update",
            "site_id": selectedSite.site_id,
        }
        let url = '/sysprops/update';
        axios.post(url, modifiedData).then((res) => {
            this.setState({ heatmapRadius_Current: JSON.stringify(this.state.heatmapRadius) })
            document.getElementById('heatmapRadius.update.button').style.display = 'none';
            this.props.fetchSysProps(selectedSite.site_id);
        }).catch((err) => {
            console.log(err.message);
        });
    };
    updateZoomLevelToLayoutMapping = (evt) => {
        const modifiedData = {
            "name": this.state.zoomLevelToLayoutMapping_propertyName,
            "properties": this.state.zoomLevelToLayoutMapping,
            "action": "update",
            "site_id": selectedSite.site_id,
        }
        let url = '/sysprops/update';
        axios.post(url, modifiedData).then((res) => {
            this.setState({ zoomLevelToLayoutMapping_Current: JSON.stringify(this.state.zoomLevelToLayoutMapping) })
            document.getElementById('zlm.update.button').style.display = 'none';
            this.props.fetchSysProps(selectedSite.site_id);
        }).catch((err) => {
            console.log(err.message);
        });
    };

    render() {
        let initialZoomLevel = null;
        let clusterRadius = null;
        let heatmapRadius = null;
        let zlmProperty = null;
        if (selectedSite === null) {
            initialZoomLevel = { value: 0.4 };
            clusterRadius = { value: 5 };
            heatmapRadius = { value: 5 };
            zlmProperty = {
                location: { min: 0, max: 0 },
                area: { min: 0, max: 0 },
                subarea: { min: 0, max: 0 }
            }
        } else {
            initialZoomLevel = this.state.initialZoomLevel;
            clusterRadius = this.state.clusterRadius;
            heatmapRadius = this.state.heatmapRadius;
            zlmProperty = this.state.zoomLevelToLayoutMapping;
        }
        return (
            <div>
                <div className='siteSelectionContainer'>
                    <ComboBox
                        ariaLabel="Choose an item"
                        className='siteSelectionCombo'
                        itemToString={function noRefCheck(item) { return item !== null ? item.city : ''; }}
                        items={this.props.coordinateObj.site}
                        onChange={this.siteSelectionChanged}
                        placeholder="Select Site"
                        value={selectedSite}
                        type="default"
                    />
                </div>
                <div className='mapSettingsContainer'>
                    <div className='leftPane'>
                        <div className='SysProp'>
                            <p className='title'>Initial zoom level</p>
                            <table><tbody>
                                <tr>
                                    <td className='label'>Zoom level</td>
                                    <td className='input'><NumberInput id='id.initial.zoom.level' min={0} max={10} step={0.1} invalidText='Out of range' onChange={(item) => { this.handleInitialZoomLevelPropertyChange('id.initial.zoom.level') }} value={initialZoomLevel.value} /></td>
                                </tr>
                                <tr>
                                    <td className='label'><p className='assetError' id='zoomLevelValidationErrorMessage'>*Validation failed. Verify the settings</p></td>
                                    <td className='input'><input id='zoomLevel.update.button' className='button' style={{ display: 'none' }} onClick={this.updateInitialZoomLevel} type="submit" value="Update Setting" /></td>
                                </tr>
                            </tbody></table>
                        </div>
                        <div className='SysProp'>
                            <p className='title'>Cluster Radius</p>
                            <table><tbody>
                                <tr>
                                    <td className='label'>Radius</td>
                                    <td className='input'><NumberInput id='id.cluster.radius' min={5} max={50} step={5} invalidText='Out of range' onChange={(item) => { this.handleClusterRadiusPropertyChange('id.cluster.radius') }} value={clusterRadius.value} /></td>
                                </tr>

                                <tr>
                                    <td className='label'><p className='assetError' id='clusterRadiusValidationErrorMessage'>*Validation failed. Verify the settings</p></td>
                                    <td className='input'><input id='clusterRadius.update.button' className='button' style={{ display: 'none' }} onClick={this.updateClusterRadius} type="submit" value="Update Setting" /></td>
                                </tr>
                            </tbody></table>
                        </div>
                        <div className='SysProp'>
                            <p className='title'>Heatmap Radius</p>
                            <table><tbody>
                                <tr>
                                    <td className='label'>Radius</td>
                                    <td className='input'><NumberInput id='id.heatmap.radius' min={5} max={50} step={5} invalidText='Out of range' onChange={(item) => { this.handleHeatmapRadiusPropertyChange('id.heatmap.radius') }} value={heatmapRadius.value} /></td>
                                </tr>

                                <tr>
                                    <td className='label'><p className='assetError' id='heatmapRadiusValidationErrorMessage'>*Validation failed. Verify the settings</p></td>
                                    <td className='input'><input id='heatmapRadius.update.button' className='button' style={{ display: 'none' }} onClick={this.updateHeatmapRadius} type="submit" value="Update Setting" /></td>
                                </tr>
                            </tbody></table>
                        </div>
                    </div>
                    <div className='rightPane'>
                        <div className='SysProp'>
                            <p className='title'>Zoom ranges to show site layout with different level of details</p>
                            <table><tbody>
                                <tr>
                                    <td className='label'>Zoom range for location display</td>
                                    <td className='input'><NumberInput id='zlm.location.min' min={0} max={10} step={0.1} invalidText='Out of range' onChange={(item) => { this.handleZoomLevelMappingChange('zlm.location.min') }} value={zlmProperty.location.min} /></td>
                                    <td className='input'>To</td>
                                    <td className='input'><NumberInput id='zlm.location.max' min={0} max={10} step={0.1} invalidText='Out of range' onChange={(item) => { this.handleZoomLevelMappingChange('zlm.location.max') }} value={zlmProperty.location.max} /></td>
                                </tr>
                                <tr>
                                    <td className='label'>Zoom range for area display</td>
                                    <td className='input'><NumberInput id='zlm.area.min' min={0} max={10} step={0.1} invalidText='Out of range' onChange={(item) => { this.handleZoomLevelMappingChange('zlm.area.min') }} value={zlmProperty.area.min} /></td>
                                    <td className='input'>To</td>
                                    <td className='input'><NumberInput id='zlm.area.max' min={0} max={10} step={0.1} invalidText='Out of range' onChange={(item) => { this.handleZoomLevelMappingChange('zlm.area.max') }} value={zlmProperty.area.max} /></td>
                                </tr>
                                <tr>
                                    <td className='label'>Zoom range for subarea display</td>
                                    <td className='input'><NumberInput id='zlm.subarea.min' min={0} max={10} step={0.1} invalidText='Out of range' onChange={(item) => { this.handleZoomLevelMappingChange('zlm.subarea.min') }} value={zlmProperty.subarea.min} /></td>
                                    <td className='input'>To</td>
                                    <td className='input'><NumberInput id='zlm.subarea.max' min={0} max={10} step={0.1} invalidText='Out of range' onChange={(item) => { this.handleZoomLevelMappingChange('zlm.subarea.max') }} value={zlmProperty.subarea.max} /></td>
                                </tr>
                                <tr>
                                    <td className='label'><p className='assetError' id='zlmValidationErrorMessage'>*Validation failed. Verify the settings</p></td>
                                    <td className='input'></td>
                                    <td className='input'><input id='zlm.update.button' className='button' style={{ display: 'none' }} onClick={this.updateZoomLevelToLayoutMapping} type="submit" value="Update Setting" /></td>
                                    <td className='input'></td>
                                </tr>
                            </tbody></table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        coordinateObj: state.warehouseLayout
    };
};

const mapDispatchToProps = dispatch => {
    return {
        fetchSysProps: siteid => dispatch(actions.fetchSysProps(siteid))
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(mapSettings);
