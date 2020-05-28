import React from "react";
import * as actions from "../../store/actions/index";
import * as actionTypes from "../../store/actions/actionTypes";
import axios from "../../api";
import { connect } from "react-redux";
import arrow_move from "../../images/arrows_drag_vert.svg";
import close_but from "../../images/arrows_circle_remove.png";
import iconDownload from "@carbon/icons-react/lib/download/20";
import Draggable, { DraggableCore } from "react-draggable";
import {
    Button,
    MultiSelect,
    Tabs, Tab,
    DataTable,
    TableContainer,
    Table,
    TableHead, TableRow, TableHeader, TableBody, TableCell,
    TableToolbar, TableToolbarContent, TableToolbarSearch,
    TableToolbarMenu, TableToolbarAction
} from "carbon-components-react";

import _ from "lodash";
import { element } from "prop-types";


// We would have a headers array like the following
const epcTableHeaders = [
    {
        key: 'Reference',
        header: 'Reference #'
    },
    {
        key: 'Piece',
        header: 'Piece #'
    },
    {
        key: 'Aging',
        header: 'Age (Hrs)'
    },
    {
        key: 'Severity',
        header: 'Severity'
    },
    {
        key: 'Location',
        header: 'Location'
    },
    /*{
        key: 'Exception',
        header: 'Exception'
    },*/
    {
        key: 'time',
        header: 'Last Update Time'
    }
];
const deviceTableHeaders = [
    {
        key: 'device_id',
        header: 'Device ID'
    },
    /*{
        key: 'device_type',
        header: 'Type'
    },*/
    {
        key: 'mode',
        header: 'Mode'
    },
    {
        key: 'compute_model_status',
        header: 'Forklift Gateway Status'
    },
    {
        key: 'rfid_status',
        header: 'RFID Reader Status'
    },
    {
        key: 'uwb_status',
        header: 'UWB Receiver Status'
    },
    {
        key: 'device_timestamp',
        header: 'Last Update Time'
    }
];

let thisObject = null;
let sysProps = {};
const filterByAgeItems = [{ text: 'MEDIUM' }, { text: 'SEVERE' }]//[{ text: '48 HRS - 72 HRS' }, { text: '> 72 HRS' }]
const filterByShipmentType = [{ text: 'House Bill' }, { text: 'Onhand Bill' }]
const filterByMode = [{ text: 'IDLE' }, { text: 'SERVICE' }, { text: 'OFFLINE' }, { text: 'FAULT' }]
const filterByGatewayStatus = [{ text: 'OK' }, { text: 'Fault' }]
const filterByRFIDStatus = [{ text: 'OFF' }, { text: 'IDLE' }, { text: 'ON' }]
const filterByUWBReceiverStatus = [{ text: 'OFF' }, { text: 'IDLE' }, { text: 'ON' }]
let locationFilters = [];
class Exceptions extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            filterByAge: [],
            filterByLocation: [],
            filterByShipment: [],
            filterByMode: [],
            sysPropsLoaded: false
        };
        thisObject = this;
    }

    componentDidMount() {
        try {
            this.loadSysProps();
            if (this.props.coordinateObj.siteselected !== '') {
                this.props.fetchDeviceStatus(1);
            }
        } catch (e) {

        }
    }
    componentDidUpdate = prevProp => {

    };

    randomNumber = (min, max) => {
        return Math.random() * (max - min) + min;
    };
    loadSysProps = e => {
        if (Object.keys(this.props.system.props).length !== 0) {
            sysProps = this.props.system.props;
        } else {
            const url = '/sysprops/site/1';
            axios.get(url).then((res) => {
                let properties = {}
                res.data.forEach((property) => {
                    properties[property.name] = property;
                })
                sysProps = properties;
                this.setState({ sysPropsLoaded: true });
            }).catch((err) => {
            });
        }
    }
    onAgeFilterChange = (evt) => {
        try {
            (evt.selectedItems.length === 0 || evt.selectedItems.length === 2) ? this.setState({ filterByAge: [] }) :
                (evt.selectedItems[0].text === 'SEVERE' ? this.setState({ filterByAge: ['SEVERE'] }) : this.setState({ filterByAge: ['MEDIUM'] }))
            //(evt.selectedItems[0].text === '> 72 HRS' ? this.setState({ filterByAge: ['severe'] }) : this.setState({ filterByAge: ['medium'] }))
        } catch (e) {
            console.debug(e.message)
        }
    };
    onLocationFilterChange = (evt) => {
        try {
            let selectedLocations = [];
            evt.selectedItems.forEach((location) => {
                selectedLocations.push(location.text);
            })
            this.setState({ filterByLocation: selectedLocations })
        } catch (e) {
            console.debug(e.message)
        }
    };
    onShipmentTypeFilterChange = (evt) => {
        try {
            let selectedShipmentTypes = [];
            evt.selectedItems.forEach((shipmentType) => {
                selectedShipmentTypes.push(shipmentType.text);
            })
            this.setState({ filterByShipment: selectedShipmentTypes })
        } catch (e) {
            console.debug(e.message)
        }
    };
    onModeFilterChange = (evt) => {
        try {
            let selectedMode = [];
            evt.selectedItems.forEach((deviceMode) => {
                selectedMode.push(deviceMode.text);
            })
            this.setState({ filterByMode: selectedMode })
        } catch (e) {
            console.debug(e.message)
        }
    };
    onGatewayStatusFilterChange = (evt) => {
        try {
            this.selectedItem = evt.selectedItem;
        } catch (e) {
            console.debug(e.message)
        }
    };
    onRFIDStatusFilterChange = (evt) => {
        try {
            this.selectedItem = evt.selectedItem;
        } catch (e) {
            console.debug(e.message)
        }
    };
    onUWBReceiverStatusFilterChange = (evt) => {
        try {
            this.selectedItem = evt.selectedItem;
        } catch (e) {
            console.debug(e.message)
        }
    };
    getShipmentData = (epcArrOrig, hierarchy) => {
        let epcArr = [];
        try {
            if (epcArrOrig !== null) {
                epcArrOrig.forEach((item, index) => {
                    let rfid = item.epc;
                    let refNo = item.reference_number.indexOf('_') !== -1 ? item.reference_number.substring(1, item.reference_number.indexOf('_')) : item.reference_number.substring(1);
                    let qty = item.reference_number.indexOf('_') !== -1 ? item.reference_number.substring(item.reference_number.indexOf('_') + 1) : 0;
                    let locName = item.dhl_site_location.location_name;
                    let assetId = item.device_id;
                    let timeStamp = (item.warehouse_in_time !== null) ? item.warehouse_in_time : item.rfid_timestamp;
                    let age = Math.round(((new Date().getTime()) - (new Date(timeStamp).getTime())) / (60 * 60 * 1000), 2);
                    let considerData = false;
                    const severity = this.getSeverity(refNo, age);//(age > 72) ? 'severe' : 'medium';
                    if (severity === 'MEDIUM' || severity === 'SEVERE') {//} if (age >= 48) {
                        //apply age filter

                        if (this.state.filterByAge.length === 0 || this.state.filterByAge.indexOf(severity) !== -1) {
                            //apply location filter
                            let parentLocation = (hierarchy[locName] !== null ? hierarchy[locName] : locName);
                            if (hierarchy[parentLocation] !== null) parentLocation = hierarchy[parentLocation];
                            if (this.state.filterByLocation.length === 0 || this.state.filterByLocation.indexOf(parentLocation) !== -1) {
                                //apply shipment type filter
                                const shipmentType = refNo.startsWith('O') ? 'Onhand Bill' : 'House Bill';
                                if (this.state.filterByShipment.length === 0 || this.state.filterByShipment.indexOf(shipmentType) !== -1) {
                                    considerData = true;
                                }
                            }
                        }
                    }
                    if (considerData) {
                        epcArr.push({ id: rfid, Reference: refNo, Piece: qty, Location: locName, time: timeStamp.substring(0, timeStamp.length - 5), Aging: age, Severity: severity })
                    }
                });
            }
        } catch (e) {
        }
        return epcArr;
    }
    getDeviceStatus = () => {
        let deviceStatus = [];
        try {
            if (this.props.assets.status !== null) {
                for (var deviceid in this.props.assets.status) {
                    let status = { ...this.props.assets.status[deviceid] }
                    status['id'] = deviceid;
                    status['device_timestamp'] = status['device_timestamp'].substring(0, status['device_timestamp'].length - 5);
                    if (status.mode !== 'ACTIVE' && (this.state.filterByMode.length === 0 || this.state.filterByMode.indexOf(status.mode) !== -1)) {
                        deviceStatus.push(status);
                    }
                }
            }
        } catch (e) {

        }
        return deviceStatus;
    }
    getSeverity = (refNo, age) => {
        let severity = 'MEDIUM';
        try {
            if (this.props.system.props.length === 0 || this.props.system.props.epc_alert_thresholds_onHand === null ||
                this.props.system.props.epc_alert_thresholds_onHand === undefined || this.props.system.props.epc_alert_thresholds_longDuration === null ||
                this.props.system.props.epc_alert_thresholds_longDuration === undefined) {
                if (!this.state.sysPropsLoaded) {
                    return severity;
                }
            }
            /****sys props */
            let lfProp = {}
            let ofProp = {}
            if (this.props.system.props.epc_alert_thresholds_land_freight !== null && this.props.system.props.epc_alert_thresholds_land_freight !== undefined)
                lfProp = this.props.system.props.epc_alert_thresholds_land_freight.properties;
            else
                lfProp = sysProps.props.epc_alert_thresholds_land_freight.properties;
            if (this.props.system.props.epc_alert_thresholds_ocean_freight !== null && this.props.system.props.epc_alert_thresholds_ocean_freight !== undefined)
                ofProp = this.props.system.props.epc_alert_thresholds_ocean_freight.properties;
            else
                ofProp = sysProps.epc_alert_thresholds_ocean_freight.properties;
            const landFreightMedium = lfProp.medium.min !== null ? (lfProp.medium.min * 24) : 48;
            const landFreightSevere = lfProp.severe.min !== null ? (lfProp.severe.min * 24) : 72;
            const oceanFreightMedium = ofProp.medium.min !== null ? (ofProp.medium.min * 24) : 120;
            const oceanFreightSevere = ofProp.severe.min !== null ? (ofProp.severe.min * 24) : 168;
            /*** sys props */
            if (refNo.startsWith('H')) {
                severity = (age >= landFreightSevere) ? 'SEVERE' : (age >= landFreightMedium ? 'MEDIUM' : 'NORMAL')
            } else if (refNo.startsWith('O')) {
                severity = (age >= oceanFreightSevere) ? 'SEVERE' : (age >= oceanFreightMedium ? 'MEDIUM' : 'NORMAL')
            }
        } catch (e) {
            //console.debug('Exception in getSeverity => ' + e.message);
        }
        return severity;
    }

    getShipmentStatusColor = (row, cell) => {
        const colorMapping = { NORMAL: 'blue', MEDIUM: 'orange', SEVERE: 'red' }
        if (cell.id.indexOf(':Reference') != -1) {
            return colorMapping[row.cells[3].value];
        }
    }
    getDeviceStatusColor = (row, cell) => {
        const colorMapping = { ACTIVE: 'green', FAULT: 'red', OFFLINE: 'grey', SERVICE: 'orange', IDLE: 'blue' }
        if (cell.id.indexOf(':device_id') != -1) {
            return colorMapping[row.cells[1].value];
        }
    }

    render() {
        let layout = {};
        locationFilters.length = 0;
        let epcData = null;
        let deviceStatus = null;
        try {
            for (var key in this.props.coordinateObj.locationcoordinate) {
                if (this.props.coordinateObj.locationcoordinate[key].city === this.props.coordinateObj.siteselected) {
                    layout = thisObject.props.coordinateObj.locationcoordinate[key];
                }
            }
        } catch (e) { console.debug('Exception in shipment tracking (render) : ' + e.message) }
        for (var key in layout.locations) {
            locationFilters.push({ text: key })
        }
        deviceStatus = this.getDeviceStatus();
        epcData = this.getShipmentData(this.props.epcObj.epc, layout.hierarchy);
        return (
            <div className='exceptionsContainerHook' style={{ display: (this.props.show ? 'block' : 'none') }}>
                <Draggable
                    id="exceptionsPageID"
                    handle=".handle"
                    defaultPosition={{ x: 20, y: 20 }}
                    position={null}
                    onStart={this.handleStart}
                    onDrag={this.handleDrag}
                    onStop={this.handleStop}
                >
                    <div className='exceptionContainer'>
                        <div className='dragPaneCloseButton'>
                            {" "}
                            <img
                                onClick={this.props.parentObj.showExceptions}
                                alt='Close Button'
                                src={close_but}
                            />{" "}
                        </div>
                        <div className='dragAnchorPostion'>
                            {" "}
                            <img
                                className='dragPaneAnchor'
                                alt='Handle to drag'
                                src={arrow_move}
                            />{" "}
                        </div>
                        <div
                            className="draggable handle dragAnchorPostion dragHandlePostion"
                        >
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{" "}
                        </div>
                        <div id='exceptionPageDiv' className='adminPage'>
                            <h5>Shipment & Device Status</h5>
                            <Tabs className='adminPage--tabs'>
                                <Tab
                                    href="#"
                                    id="tab-1"
                                    label="Shipment status"
                                >
                                    <div className='epcExceptionContainer'>
                                        <div className='exceptionFilterPane'>
                                            <div className='filterDiv'>
                                                <table><tbody><tr>
                                                    <td>
                                                        <MultiSelect
                                                            initialSelectedItems={[]}
                                                            itemToString={function noRefCheck(item) { return item !== null ? item.text : ''; }}
                                                            items={filterByAgeItems}
                                                            label="Filter By Severity"
                                                            onChange={this.onAgeFilterChange}
                                                            type="default"
                                                        />
                                                    </td>
                                                    <td style={{ paddingLeft: '0.5rem' }}>
                                                        <MultiSelect
                                                            initialSelectedItems={[]}
                                                            itemToString={function noRefCheck(item) { return item !== null ? item.text : ''; }}
                                                            items={locationFilters}
                                                            label="Filter By Location"
                                                            onChange={this.onLocationFilterChange}
                                                            type="default"
                                                        />
                                                    </td>
                                                    <td style={{ paddingLeft: '0.5rem' }}>
                                                        <MultiSelect
                                                            initialSelectedItems={[]}
                                                            itemToString={function noRefCheck(item) { return item !== null ? item.text : ''; }}
                                                            items={filterByShipmentType}
                                                            label="Filter By Shipment"
                                                            onChange={this.onShipmentTypeFilterChange}
                                                            type="default"
                                                        />
                                                    </td>
                                                </tr></tbody></table>
                                            </div>
                                        </div>
                                        <div className='epcDataTableDiv'>
                                            <DataTable
                                                rows={epcData}
                                                headers={epcTableHeaders}
                                                isSortable
                                                render={({ rows, headers, getHeaderProps, onInputChange }) => (
                                                    <TableContainer title="">
                                                        <TableToolbar>
                                                            <TableToolbarContent>
                                                                <TableToolbarSearch onChange={onInputChange} />
                                                            </TableToolbarContent>
                                                        </TableToolbar>
                                                        <Table useZebraStyles size='compact'>
                                                            <TableHead>
                                                                <TableRow>
                                                                    {headers.map(header => (
                                                                        <TableHeader {...getHeaderProps({ header })}>
                                                                            {header.header}
                                                                        </TableHeader>
                                                                    ))}
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {rows.map(row => (
                                                                    <TableRow key={row.id}>
                                                                        {row.cells.map(cell => (
                                                                            <TableCell style={{ backgroundColor: this.getShipmentStatusColor(row, cell) }} key={cell.id}>{cell.value}</TableCell>
                                                                        ))}
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </TableContainer>)}
                                            />
                                        </div>
                                    </div>
                                </Tab>
                                <Tab
                                    href="#"
                                    id="tab-2"
                                    label="Device status"
                                >
                                    <div className='assetExceptionContainer'>
                                        <div className='exceptionFilterPane'>
                                            <div className='filterDiv'>
                                                <table><tbody><tr>
                                                    <td style={{ width: '12rem' }}>
                                                        <MultiSelect
                                                            initialSelectedItems={[]}
                                                            itemToString={function noRefCheck(item) { return item !== null ? item.text : ''; }}
                                                            items={filterByMode}
                                                            label="Device Mode"
                                                            onChange={this.onModeFilterChange}
                                                            type="default"
                                                        />
                                                    </td>
                                                    <td style={{ paddingLeft: '0.5rem' }}>
                                                        {/*<MultiSelect
                                                initialSelectedItems={[]}
                                                itemToString={function noRefCheck(item) { return item !== null ? item.text : ''; }}
                                                items={filterByGatewayStatus}
                                                label="Gateway Status"
                                                onChange={this.onGatewayStatusFilterChange}
                                                type="default"
                                            />*/}
                                                    </td>
                                                    <td style={{ paddingLeft: '0.5rem' }}>
                                                        {/*<MultiSelect
                                                initialSelectedItems={[]}
                                                itemToString={function noRefCheck(item) { return item !== null ? item.text : ''; }}
                                                items={filterByRFIDStatus}
                                                label="RFID Reader"
                                                onChange={this.onRFIDStatusFilterChange}
                                                type="default"
                                            />*/}
                                                    </td>
                                                    <td style={{ paddingLeft: '0.5rem' }}>
                                                        {/*<MultiSelect
                                                initialSelectedItems={[]}
                                                itemToString={function noRefCheck(item) { return item !== null ? item.text : ''; }}
                                                items={filterByUWBReceiverStatus}
                                                label="UWB Receiver"
                                                onChange={this.onUWBReceiverStatusFilterChange}
                                                type="default"
                                            />*/}
                                                    </td>
                                                </tr></tbody></table>
                                            </div>
                                        </div>
                                        <div className='epcDataTableDiv'>
                                            <DataTable
                                                rows={deviceStatus}
                                                isSortable
                                                headers={deviceTableHeaders}
                                                render={({ rows, headers, getHeaderProps, onInputChange }) => (
                                                    <TableContainer title="">
                                                        <TableToolbar>
                                                            <TableToolbarContent>
                                                                <TableToolbarSearch onChange={onInputChange} />
                                                            </TableToolbarContent>
                                                        </TableToolbar>
                                                        <Table useZebraStyles size='compact'>
                                                            <TableHead>
                                                                <TableRow>
                                                                    {headers.map(header => (
                                                                        <TableHeader {...getHeaderProps({ header })}>
                                                                            {header.header}
                                                                        </TableHeader>
                                                                    ))}
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {rows.map(row => (
                                                                    <TableRow key={row.id}>
                                                                        {row.cells.map(cell => (
                                                                            <TableCell style={{ backgroundColor: this.getDeviceStatusColor(row, cell) }} key={cell.id}>{cell.value}</TableCell>
                                                                        ))}
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </TableContainer>)}
                                            />
                                        </div>
                                    </div>
                                </Tab>
                            </Tabs>
                        </div>
                    </div>
                </Draggable>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        coordinateObj: state.warehouseLayout,
        epcObj: state.epsState,
        assets: state.assetState,
        system: state.system
    };
};

const mapDispatchToProps = dispatch => {
    return {
        fetchDeviceStatus: (siteid) => dispatch(actions.fetchDeviceStatus(siteid))
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(Exceptions);
