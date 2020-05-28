import React from "react";
import { connect } from "react-redux";
import arrow_move from "../../images/arrows_drag_vert.svg";
import close_but from "../../images/arrows_circle_remove.png";
import Draggable, { DraggableCore } from "react-draggable";
import {
    Slider
} from "carbon-components-react";

import _ from "lodash";

class HeatMap extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showFilterBySubArea: false,
            visibleAreas: [],
        };
    }
    componentDidMount() {
    }
    componentDidUpdate = prevProp => {
    };
    renderHeatMap = () => {
        this.props.callBack.renderHeatMap(1);
    }
    clearHeatMap = () => {
        this.props.callBack.renderHeatMap(0);
    }
    render() {
        let timerange = 72;
        try{
            if(this.props.system.props.heatmap_time_range !== null){
                timerange = parseInt(this.props.system.props.heatmap_time_range.properties.value);
            }
        } catch(e){
            console.debug('Exception while fetching heatmap system property')
        }
        return (
            <div className='heatmapContainerHook' style={{ display: (this.props.show ? 'block' : 'none') }}>
                <Draggable
                    id="heatmapFilterID"
                    handle=".handle"
                    defaultPosition={{ x: 20, y: 40 }}
                    position={null}
                    onStart={this.handleStart}
                    onDrag={this.handleDrag}
                    onStop={this.handleStop}
                >
                    <div className='heatmapContainer filterPane'>
                        <div className='dragPaneCloseButton'>
                            {" "}
                            <img
                                onClick={this.props.parentObj.showHeatMap}
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
                        <div id='heatmapFilterDiv' className='heatmapFilter'>
                        <h4>Heatmap</h4>
                            <div className='sliderContainer'>
                                <Slider
                                    ariaLabelInput="Shipment Age"
                                    id="slider"
                                    labelText="Shipment Age (hrs)"
                                    max={timerange}
                                    min={0}
                                    step={2}
                                    stepMultiplier={4}
                                    onChange={this.renderHeatMap}
                                    value={0}
                                    className='slider'
                                />
                                <input className='button' onClick={this.renderHeatMap} type="submit" value="Show Heat Map" />
                                <input className='button' onClick={this.clearHeatMap} type="submit" value="Clear Map" />
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
        callBack: state.callBackFunctions,
        system: state.system
    };
};

const mapDispatchToProps = dispatch => {
    return {
        /*onInitSelectedSite: site =>
            dispatch({ type: actionTypes.ADD_SELCTED_SITE, siteselected: site })*/
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(HeatMap);
