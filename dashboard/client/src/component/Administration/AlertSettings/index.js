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


class AlertSettings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            thresholds_LF_propertyName: 'epc_alert_thresholds_land_freight',
            thresholds_OF_propertyName: 'epc_alert_thresholds_ocean_freight',
            selectedSite: null,
            thresholds_default: {
                normal: { min: 0, max: 0 },
                medium: { min: 0, max: 0 },
                severe: { min: 0, max: 0 }
            },
            thresholds_LF: {
                normal: { min: 0, max: 0 },
                medium: { min: 0, max: 0 },
                severe: { min: 0, max: 0 }
            },
            thresholds_OF: {
                normal: { min: 0, max: 0 },
                medium: { min: 0, max: 0 },
                severe: { min: 0, max: 0 }
            },
            thresholds_LF_Current: '',
            thresholds_OF_Current: ''
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
        document.getElementById('lfValidationErrorMessage').style.display = 'none';
        document.getElementById('ofValidationErrorMessage').style.display = 'none';
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
                if (property.name === this.state.thresholds_LF_propertyName) {
                    this.setState({ thresholds_LF: property.properties, thresholds_LF_Current: JSON.stringify(property.properties) })
                }
                if (property.name === this.state.thresholds_OF_propertyName) {
                    this.setState({ thresholds_OF: property.properties, thresholds_OF_Current: JSON.stringify(property.properties) })
                }
            })
        }).catch((err) => {
            console.log(err.message);
        });
    }
    handleLFChange = (id) => {
        const value = document.getElementById(id).value;
        let lfPropertyNewState = { ...this.state.thresholds_LF }
        switch (id) {
            case 'lf.normal.min': lfPropertyNewState.normal.min = value; break;
            case 'lf.normal.max': lfPropertyNewState.normal.max = lfPropertyNewState.medium.min = value; break;
            case 'lf.medium.min': lfPropertyNewState.normal.max = lfPropertyNewState.medium.min = value; break;
            case 'lf.medium.max': lfPropertyNewState.medium.max = lfPropertyNewState.severe.min = value; break;
            case 'lf.severe.min': lfPropertyNewState.medium.max = lfPropertyNewState.severe.min = value; break;
            case 'lf.severe.max': lfPropertyNewState.severe.max = value; break;
            default: console.debug();
        }
        this.setState({ thresholds_LF: lfPropertyNewState })
        if (this.state.thresholds_LF_Current === JSON.stringify(this.state.thresholds_LF)) {
            document.getElementById('lf.update.button').style.display = 'none';
        } else {
            if (parseInt(lfPropertyNewState.normal.min) >= parseInt(lfPropertyNewState.normal.max) ||
                parseInt(lfPropertyNewState.medium.min) >= parseInt(lfPropertyNewState.medium.max) ||
                parseInt(lfPropertyNewState.severe.min) >= parseInt(lfPropertyNewState.severe.max)) {
                document.getElementById('lfValidationErrorMessage').style.display = 'block';
                document.getElementById('lf.update.button').style.display = 'none';
            } else {
                document.getElementById('lfValidationErrorMessage').style.display = 'none';
                document.getElementById('lf.update.button').style.display = 'block';
            }
        }
    }
    handleOFChange = (id) => {
        const value = document.getElementById(id).value;
        let ofPropertyNewState = { ...this.state.thresholds_OF }
        switch (id) {
            case 'of.normal.min': ofPropertyNewState.normal.min = value; break;
            case 'of.normal.max': ofPropertyNewState.normal.max = ofPropertyNewState.medium.min = value; break;
            case 'of.medium.min': ofPropertyNewState.normal.max = ofPropertyNewState.medium.min = value; break;
            case 'of.medium.max': ofPropertyNewState.medium.max = ofPropertyNewState.severe.min = value; break;
            case 'of.severe.min': ofPropertyNewState.medium.max = ofPropertyNewState.severe.min = value; break;
            case 'of.severe.max': ofPropertyNewState.severe.max = value; break;
            default: console.debug();
        }
        this.setState({ thresholds_OF: ofPropertyNewState })
        if (this.state.thresholds_OF_Current === JSON.stringify(this.state.thresholds_OF)) {
            document.getElementById('of.update.button').style.display = 'none';
        } else {
            if (parseInt(ofPropertyNewState.normal.min) >= parseInt(ofPropertyNewState.normal.max) ||
                parseInt(ofPropertyNewState.medium.min) >= parseInt(ofPropertyNewState.medium.max) ||
                parseInt(ofPropertyNewState.severe.min) >= parseInt(ofPropertyNewState.severe.max)) {
                document.getElementById('ofValidationErrorMessage').style.display = 'block';
                document.getElementById('of.update.button').style.display = 'none';
            } else {
                document.getElementById('ofValidationErrorMessage').style.display = 'none';
                document.getElementById('of.update.button').style.display = 'block';
            }
        }
    }
    updateThresholdForLFEPC = (evt) => {
        const modifiedData = {
            "name": this.state.thresholds_LF_propertyName,
            "properties": this.state.thresholds_LF,
            "action": "update",
            "site_id": selectedSite.site_id,
        }
        let url = '/sysprops/update';
        axios.post(url, modifiedData).then((res) => {
            this.setState({ thresholds_LF_Current: JSON.stringify(this.state.thresholds_LF) })
            document.getElementById('lf.update.button').style.display = 'none';
            this.props.fetchSysProps(1);
        }).catch((err) => {
            console.log(err.message);
        });
    };

    updateThresholdForOFEPC = (evt) => {
        const modifiedData = {
            "name": this.state.thresholds_OF_propertyName,
            "properties": this.state.thresholds_OF,
            "action": "update",
            "site_id": selectedSite.site_id,
        }
        let url = '/sysprops/update';
        axios.post(url, modifiedData).then((res) => {
            this.setState({ thresholds_OF_Current: JSON.stringify(this.state.thresholds_OF) })
            document.getElementById('of.update.button').style.display = 'none';
            this.props.fetchSysProps(1);
        }).catch((err) => {
            console.log(err.message);
        });
    };

    render() {
        let lfProperty = null;
        let ofProperty = null;
        if (selectedSite === null) {
            lfProperty = ofProperty = this.state.thresholds_default;
        } else {
            lfProperty = this.state.thresholds_LF;
            ofProperty = this.state.thresholds_OF;
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
                <div className='alertSettingsContainer'>
                    <div className='leftPane'>
                        <div className='SysProp'>
                            <p className='title'>Severity thresholds for house bill (in Days)</p>
                            <table><tbody>
                                <tr>
                                    <td className='label'>Normal range</td>
                                    <td className='input'><NumberInput id='lf.normal.min' min={0} max={30} invalidText='Out of range' onChange={(item) => { this.handleLFChange('lf.normal.min') }} value={lfProperty.normal.min} /></td>
                                    <td className='input'>To</td>
                                    <td className='input'><NumberInput id='lf.normal.max' min={0} max={30} invalidText='Out of range' onChange={(item) => { this.handleLFChange('lf.normal.max') }} value={lfProperty.normal.max} /></td>
                                </tr>
                                <tr>
                                    <td className='label'>Medium Severity</td>
                                    <td className='input'><NumberInput id='lf.medium.min' min={0} max={30} invalidText='Out of range' onChange={(item) => { this.handleLFChange('lf.medium.min') }} value={lfProperty.medium.min} /></td>
                                    <td className='input'>To</td>
                                    <td className='input'><NumberInput id='lf.medium.max' min={0} max={30} invalidText='Out of range' onChange={(item) => { this.handleLFChange('lf.medium.max') }} value={lfProperty.medium.max} /></td>
                                </tr>
                                <tr>
                                    <td className='label'>High Severity</td>
                                    <td className='input'><NumberInput id='lf.severe.min' min={0} max={30} invalidText='Out of range' onChange={(item) => { this.handleLFChange('lf.severe.min') }} value={lfProperty.severe.min} /></td>
                                    <td className='input'>To</td>
                                    <td className='input'><NumberInput id='lf.severe.max' min={0} max={30} invalidText='Out of range' onChange={(item) => { this.handleLFChange('lf.severe.max') }} value={lfProperty.severe.max} /></td>
                                </tr>
                                <tr>
                                    <td className='label'><p className='assetError' id='lfValidationErrorMessage'>*Validation failed. Verify the settings</p></td>
                                    <td className='input'></td>
                                    <td className='input'><input id='lf.update.button' className='button' style={{ display: 'none' }} onClick={this.updateThresholdForLFEPC} type="submit" value="Update Setting" /></td>
                                    <td className='input'></td>
                                </tr>
                            </tbody></table>
                        </div>
                        <div className='SysProp'>
                            <p className='title'>Severity thresholds for on-hand bills (in Days)</p>
                            <table><tbody>
                                <tr>
                                    <td className='label'>Normal range</td>
                                    <td className='input'><NumberInput id='of.normal.min' min={0} max={30} invalidText='Out of range' onChange={(item) => { this.handleOFChange('of.normal.min') }} value={ofProperty.normal.min} /></td>
                                    <td className='input'>To</td>
                                    <td className='input'><NumberInput id='of.normal.max' min={0} max={30} invalidText='Out of range' onChange={(item) => { this.handleOFChange('of.normal.max') }} value={ofProperty.normal.max} /></td>
                                </tr>
                                <tr>
                                    <td className='label'>Medium Severity</td>
                                    <td className='input'><NumberInput id='of.medium.min' min={0} max={30} invalidText='Out of range' onChange={(item) => { this.handleOFChange('of.medium.min') }} value={ofProperty.medium.min} /></td>
                                    <td className='input'>To</td>
                                    <td className='input'><NumberInput id='of.medium.max' min={0} max={30} invalidText='Out of range' onChange={(item) => { this.handleOFChange('of.medium.max') }} value={ofProperty.medium.max} /></td>
                                </tr>
                                <tr>
                                    <td className='label'>High Severity</td>
                                    <td className='input'><NumberInput id='of.severe.min' min={0} max={30} invalidText='Out of range' onChange={(item) => { this.handleOFChange('of.severe.min') }} value={ofProperty.severe.min} /></td>
                                    <td className='input'>To</td>
                                    <td className='input'><NumberInput id='of.severe.max' min={0} max={30} invalidText='Out of range' onChange={(item) => { this.handleOFChange('of.severe.max') }} value={ofProperty.severe.max} /></td>
                                </tr>
                                <tr>
                                    <td className='label'><p className='assetError' id='ofValidationErrorMessage'>*Validation failed. Verify the settings</p></td>
                                    <td className='input'></td>
                                    <td className='input'><input id='of.update.button' className='button' style={{ display: 'none' }} onClick={this.updateThresholdForOFEPC} type="submit" value="Update Setting" /></td>
                                    <td className='input'></td>
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
export default connect(mapStateToProps, mapDispatchToProps)(AlertSettings);
