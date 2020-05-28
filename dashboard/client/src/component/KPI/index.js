import React from "react";
import * as actions from "../../store/actions/index";
import * as actionTypes from "../../store/actions/actionTypes";
import { connect } from "react-redux";
import arrow_move from "../../images/arrows_drag_vert.svg";
import close_but from "../../images/arrows_circle_remove.png";
import Draggable, { DraggableCore } from "react-draggable";
import ReactSvgPieChart from "react-svg-piechart";
import Histogram from 'react-chart-histogram';

import {

} from "carbon-components-react";

import _ from "lodash";
import { element } from "prop-types";


const pieChartData = [
    { title: "Receiving", value: 4824, color: "green" },
    { title: "Put Away", value: 32009, color: "#ffcc00" },
    { title: "Screening", value: 3622, color: "blue" },
    { title: "Consolidation - Loading", value: 20716, color: "purple" }
]
const histogramLabels = ['Receiving', 'Put Away', 'Screening', 'Locading'];
const histogramData = [23, 164, 18, 118];
const histogramOptions = { fillColor: 'blue', strokeColor: '#0000FF' };
let thisObject = null;

class KPI extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showFilterBySubArea: false,
            visibleAreas: [],
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

    render() {
        return (
            <div style={{ position: "fixed", left: '20px', top: '40px', display: (this.props.show ? 'block' : 'none') }}>

                <Draggable
                    id="kpiPageID"
                    handle=".handle"
                    defaultPosition={{ x: 20, y: 40 }}
                    position={null}
                    onStart={this.handleStart}
                    onDrag={this.handleDrag}
                    onStop={this.handleStop}
                >
                    <div style={{ width: '45rem', height: '22 rem', marginTop: "1rem", border: 'solid', borderColor: 'lightgrey', backgroundColor: "white", borderRadius: '5px' }}>
                        <div style={{ position: "absolute", right: "0px" }}>
                            {" "}
                            <img
                                onClick={this.props.parentObj.showKPI}
                                style={{ width: "20px", height: "20px" }}
                                src={close_but}
                            />{" "}
                        </div>
                        <div style={{ position: "absolute", left: "23rem" }}>
                            {" "}
                            <img
                                style={{ width: "50px", height: "40px" }}
                                src={arrow_move}
                            />{" "}
                        </div>
                        <div
                            className="draggable handle"
                            style={{ position: "absolute", left: "23rem", top: "20px" }}
                        >
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{" "}
                        </div>
                        <div>
                            <h4>KPI</h4>
                            <div id='kpiDashboardDiv' style={{ width: '100%', marginTop: '1rem', paddingLeft: '10px', paddingRight: '10px', float: 'left' }}>
                                <div style={{ width: '15rem', textAlign: 'center' }}>
                                    <h5>AVERAGE AGE - DAYS</h5>
                                    <ReactSvgPieChart
                                        data={pieChartData}
                                        expandOnHover
                                        // If you need custom behavior when sector is hovered (or touched)
                                        onSectorHover={(d, i, e) => {
                                            if (d) {
                                                console.log("Mouse enter - Index:", i, "Data:", d, "Event:", e)
                                            } else {
                                                console.log("Mouse leave - Index:", i, "Event:", e)
                                            }
                                        }}
                                    />
                                </div>
                                <div style={{ marginTop: '-15rem', paddingLeft: '10px', paddingRight: '10px', textAlign: 'center', float: 'right' }}>
                                    <h5>TOTAL FRIEGHT PER AREA</h5>
                                    <Histogram
                                        xLabels={histogramLabels}
                                        yValues={histogramData}
                                        width='400'
                                        height='200'
                                        options={histogramOptions}
                                    />
                                </div>
                            </div>
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
            dispatch({ type: actionTypes.ADD_SELCTED_SITE, siteselected: site })
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(KPI);
