import React from "react";
import * as actionTypes from "../../store/actions/actionTypes";
import { connect } from "react-redux";
import _ from "lodash";
import Draggable, { DraggableCore } from "react-draggable";
import ShipmentTracking from "./../ShipmentTracking";
import AssetTracking from "./../AssetTracking";
import HeatMap from "./../HeatMap";
import Playback from "./../Playback";
import Exceptions from "./../Exceptions";
import KPI from "./../KPI";
import SiteInfo from "./../SiteInfo";
import Administration from "./../Administration";
import TroubleShooting from "./../TroubleShooting";
import './_tabPanel.scss';

class TabPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            navDisplay: false,
            showShipment: false,
            showAssetTracking: false,
            showHeatMap: false,
            showPlayback: false,
            showExceptions: false,
            showKPI: false,
            showSiteInfo : false,
            showAdmin : false,
            showLog : false,
        };
    }
    ToggleButton = () => {
        if (this.state.navDisplay) {
            document.getElementById("mySidenav").style.height = "0";
            document.getElementById("mySidenav").style.width = "0";
            this.setState({ navDisplay: false });
        } else {
            document.getElementById("mySidenav").style.width = "90%";
            document.getElementById("mySidenav").style.height = "100%";
            this.setState({ navDisplay: true });
        }
    };
    componentDidMount() { }

    componentDidUpdate = prevProp => {
        
    };

    showShipment = evt => {
        if (this.state.showShipment) {
            this.setState(
                {
                    showShipment: false
                }
            );
        } else {
            this.setState(
                {
                    showAssetTracking: false,
                    showHeatMap: false,
                    showPlayback: false,
                    showShipment: true,
                    showAdmin: false,
                    showLog: false,
                    showKPI: false,
                    showExceptions: false
                }
            );
        }
    };
    showAssetTracking = evt => {
        if (this.state.showAssetTracking) {
            this.setState(
                {
                    showAssetTracking: false
                }
            );
        } else {
            this.setState(
                {
                    showShipment: false,
                    showHeatMap: false,
                    showPlayback: false,
                    showAssetTracking: true,
                    showAdmin: false,
                    showLog: false,
                    showKPI: false,
                    showExceptions: false
                },
                () => {
                    console.log(this.state.showShipment);
                }
            );
        }
    };
    showHeatMap = evt => {
        if (this.state.showHeatMap) {
            this.setState(
                {
                    showHeatMap: false
                }
            );
        } else {
            this.setState(
                {
                    showShipment: false,
                    showAssetTracking: false,
                    showPlayback: false,
                    showHeatMap: true,
                    showAdmin: false,
                    showLog: false,
                    showKPI: false,
                    showExceptions: false
                }
            );
        }
    };
    showPlayback = evt => {
        if (this.state.showPlayback) {
            this.setState(
                {
                    showPlayback: false
                }
            );
        } else {
            this.setState(
                {
                    showShipment: false,
                    showAssetTracking: false,
                    showHeatMap: false,
                    showPlayback: true,
                    showAdmin: false,
                    showLog: false,
                    showKPI: false,
                    showExceptions: false
                }
            );
        }
    };
    showExceptions = evt => {
        if (this.state.showExceptions) {
            this.setState(
                {
                    showExceptions: false
                }
            );
        } else {
            this.setState(
                {
                    showExceptions: true,
                    showAdmin: false,
                    showLog: false
                }
            );
        }
    };
    showKPI = evt => {
        if (this.state.showKPI) {
            this.setState(
                {
                    showKPI: false
                }
            );
        } else {
            this.setState(
                {
                    showKPI: true,
                    showAdmin: false,
                    showLog: false
                }
            );
        }
    };
    showAdmin = evt => {
        if (this.state.showAdmin) {
            this.setState(
                {
                    showAdmin: false
                }
            );
        } else {
            this.setState(
                {
                    showAdmin: true,
                    showLog: false
                }
            );
        }
    };
    showLog = evt => {
        if (this.state.showLog) {
            this.setState(
                {
                    showLog: false
                }
            );
        } else {
            this.setState(
                {
                    showAdmin: false,
                    showLog: true
                }
            );
        }
    };
    render() {
        return (
            <div className="navbardiv">
                <div
                    id="but"
                    style={{
                        fontSize: "30px",
                        cursor: "pointer",
                        float: "left",
                        marginLeft: "12px"
                    }}
                    onClick={() => this.ToggleButton()}
                >
                    &#9776;
                </div>
                <div id="mySidenav" className="sidenav" style={{ float: "left", weight: 0, height: 0 }}>
                    <a href="#" onClick={this.showShipment}>Shipment Tracking</a>
                    <a href="#" onClick={this.showAssetTracking}>Asset Tracking</a>
                    <a href="#" onClick={this.showHeatMap}>Heat Map</a>
                    <a href="#" onClick={this.showPlayback}>PlayBack</a>
                    <a href="#" onClick={this.showKPI}>KPI Report</a>
                    <a href="#" onClick={this.showExceptions}>Exception</a>
                    <a href="#" onClick={this.showAdmin}>Administration</a>
                    <a href="#" onClick={this.showLog}>Trouble Shooting</a>
                </div>
                <ShipmentTracking show={this.state.showShipment} parentObj={this}/>
                <AssetTracking show={this.state.showAssetTracking} parentObj={this}/>
                <HeatMap show={this.state.showHeatMap} parentObj={this}/>
                <Playback show={this.state.showPlayback} parentObj={this}/>
                <Exceptions show={this.state.showExceptions} parentObj={this}/>
                <KPI show={this.state.showKPI} parentObj={this}/>
                {/*<SiteInfo show={this.state.showSiteInfo} parentObj={this}/>*/}
                <Administration show={this.state.showAdmin} parentObj={this}/>
                <TroubleShooting show={this.state.showLog} parentObj={this}/>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        
    };
};

const mapDispatchToProps = dispatch => {
    return {
        
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(TabPanel);
