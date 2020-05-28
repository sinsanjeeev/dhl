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


class PageSettings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            heatmapRange_propertyName: 'heatmap_time_range',
            playbackAnimationSpeed_propertyName: 'playback_animation_speed',
            selectedSite: null,
            heatmapRange: { value: 0 },
            playbackAnimationSpeed: { value: 0 },
            heatmapRange_Current: '',
            playbackAnimationSpeed_Current: ''
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
        document.getElementById('timeValidationErrorMessage').style.display = 'none';
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
                if (property.name === this.state.heatmapRange_propertyName) {
                    this.setState({ heatmapRange: property.properties, heatmapRange_Current: JSON.stringify(property.properties) })
                }
                if (property.name === this.state.playbackAnimationSpeed_propertyName) {
                    this.setState({ playbackAnimationSpeed: property.properties, playbackAnimationSpeed_Current: JSON.stringify(property.properties) })
                }
            })
        }).catch((err) => {
            console.log(err.message);
        });
    }
    handleHeatMapPropertyChange = (id) => {
        const value = document.getElementById(id).value;
        this.setState({ heatmapRange: { value: value } })
        if (this.state.heatmapRange_Current === JSON.stringify(this.state.heatmapRange)) {
            document.getElementById('hmRange.update.button').style.display = 'none';
        } else {
            document.getElementById('timeValidationErrorMessage').style.display = 'none';
            document.getElementById('hmRange.update.button').style.display = 'block';
        }
    }
    handleAnimationSpeedPropertyChange = (id) => {
        const value = document.getElementById(id).value;
        this.setState({ playbackAnimationSpeed: { value: value } })
        if (this.state.playbackAnimationSpeed_Current === JSON.stringify(this.state.playbackAnimationSpeed)) {
            document.getElementById('animSpeed.update.button').style.display = 'none';
        } else {
            document.getElementById('speedValidationErrorMessage').style.display = 'none';
            document.getElementById('animSpeed.update.button').style.display = 'block';
        }
    }
    updateHeatmapRange = (evt) => {
        const modifiedData = {
            "name": this.state.heatmapRange_propertyName,
            "properties": this.state.heatmapRange,
            "action": "update",
            "site_id": selectedSite.site_id,
        }
        let url = '/sysprops/update';
        axios.post(url, modifiedData).then((res) => {
            this.setState({ heatmapRange_Current: JSON.stringify(this.state.heatmapRange) })
            document.getElementById('hmRange.update.button').style.display = 'none';
            this.props.fetchSysProps(1);
        }).catch((err) => {
            console.log(err.message);
        });
    };

    updateAnimationSpeed = (evt) => {
        const modifiedData = {
            "name": this.state.playbackAnimationSpeed_propertyName,
            "properties": this.state.playbackAnimationSpeed,
            "action": "update",
            "site_id": selectedSite.site_id,
        }
        let url = '/sysprops/update';
        axios.post(url, modifiedData).then((res) => {
            this.setState({ playbackAnimationSpeed_Current: JSON.stringify(this.state.playbackAnimationSpeed) })
            document.getElementById('animSpeed.update.button').style.display = 'none';
            this.props.fetchSysProps(1);
        }).catch((err) => {
            console.log(err.message);
        });
    };

    render() {
        let heatmapRange = null;
        let animSpeed = null;
        if (selectedSite === null) {
            heatmapRange = animSpeed = 0;
        } else {
            heatmapRange = this.state.heatmapRange;
            animSpeed = this.state.playbackAnimationSpeed;
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
                <div className='pageSettingsContainer'>
                    <div className='leftPane'>
                        <div className='SysProp'>
                            <p className='title'>Heatmap timer range (in Hrs)</p>
                            <table><tbody>
                                <tr>
                                    <td className='label'>Maximum hours</td>
                                    <td className='input'><NumberInput id='id.heatmap.range' min={1} max={120} invalidText='Out of range' onChange={(item) => { this.handleHeatMapPropertyChange('id.heatmap.range') }} value={heatmapRange.value} /></td>
                                </tr>
                                <tr>
                                    <td className='label'><p className='assetError' id='timeValidationErrorMessage'>*Validation failed. Verify the settings</p></td>
                                    <td className='input'><input id='hmRange.update.button' className='button' style={{ display: 'none' }} onClick={this.updateHeatmapRange} type="submit" value="Update Setting" /></td>
                                </tr>
                            </tbody></table>
                        </div>
                        <div className='SysProp'>
                            <p className='title'>Playback animation speed</p>
                            <table><tbody>
                                <tr>
                                    <td className='label'>Animation speed</td>
                                    <td className='input'><NumberInput id='id.playback.anim.speed' min={50} max={500} step={50} invalidText='Out of range' onChange={(item) => { this.handleAnimationSpeedPropertyChange('id.playback.anim.speed') }} value={animSpeed.value} /></td>
                                </tr>

                                <tr>
                                    <td className='label'><p className='assetError' id='speedValidationErrorMessage'>*Validation failed. Verify the settings</p></td>
                                    <td className='input'><input id='animSpeed.update.button' className='button' style={{ display: 'none' }} onClick={this.updateAnimationSpeed} type="submit" value="Update Setting" /></td>
                                </tr>
                            </tbody></table>
                        </div>
                    </div>
                    <div className='rightPane'>

                    </div>
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
        coordinateObj: state.warehouseLayout
    };
};

const mapDispatchToProps = dispatch => {
    return {
        onInitLocationLayoutCoordinate: () =>
            dispatch(actions.initLocationLayoutCoordinate()),
        fetchSysProps: siteid => dispatch(actions.fetchSysProps(siteid))
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(PageSettings);
