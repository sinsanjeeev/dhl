import React from "react";
import * as actions from "../../store/actions/index";
import * as actionTypes from "../../store/actions/actionTypes";
import axios from "../../api";
import { connect } from "react-redux";
import arrow_move from "../../images/arrows_drag_vert.svg";
import close_but from "../../images/arrows_circle_remove.png";
import Draggable, { DraggableCore } from "react-draggable";

import {
    TextInput
} from "carbon-components-react";

import _ from "lodash";
import { element } from "prop-types";

let gZoneLayers = [];
let gLogicalZoneNames = ['Receiving', 'Consolidation', 'Screening', 'Refrigeration Area', 'Putaway'];
let gZoneContainerNames = ['Eaton', 'Cat(1)', 'Cat(2)', 'OI', 'OE', 'Bulk F', 'Dell(2)', 'Dan Foss', 'Sandvik', 'Stage South', 'Ocean Log desk', 'Over sized', '3M',
    'Lane', 'Bulk E', 'Apple', 'Dell(1)', 'Moto', 'Siemens', 'Stage North', 'Stage A North'];

let gAllZones = [];

let thisObject = null;

class Playback extends React.Component {
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
    playBack = () => {
         //hide error message if it is already displayed
        document.getElementById('referenceErrorMessagePlayback').style.display = 'none';
        let refId = document.getElementById('epc_reference_playback').value;
        let url = '/epc/movement/epcid/' + refId;    
        axios.get(url).then((res) => {
        if(res.data.length !== 0){
            this.props.callBack.renderPlayBack(res.data);
        } else {
            document.getElementById('referenceErrorMessagePlayback').style.display = 'block';
            this.props.callBack.renderPlayBack(res.data);
        }
        }).catch((err) => {
            console.log(err.message);
        });
    }
    clearPlayBack = () => {
        this.props.callBack.renderPlayBack(0)
    }
    render() {
        return (
            <div className='playbackContainerHook' style={{ display: (this.props.show ? 'block' : 'none') }}>
                <Draggable
                    id="playbackFilterID"
                    handle=".handle"
                    defaultPosition={{ x: 20, y: 40 }}
                    position={null}
                    onStart={this.handleStart}
                    onDrag={this.handleDrag}
                    onStop={this.handleStop}
                >
                    <div className='playbackContainer filterPane'>
                        <div className='dragPaneCloseButton'>
                            {" "}
                            <img
                                onClick={this.props.parentObj.showPlayback}
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
                            className="draggable handle  dragAnchorPostion dragHandlePostion"
                        >
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{" "}
                        </div>
                        <div id='playbackFilterDiv' className='playbackFilter'>
                            <h4>Playback</h4>
                            <div className='referenceContainer'>
                                <div className='referenceTextContainer' ><TextInput
                                    helperText=""
                                    id="epc_reference_playback"
                                    invalidText="Invalid error message."
                                    placeholder="Reference Number"
                                    className='referenceText'
                                />
                                </div>
                                <p className='referenceError hideMe' id='referenceErrorMessagePlayback'>* Shipment details not found</p>
                            </div>
                            <input  className='button' onClick={this.playBack} type="submit" value="Play" />
                            <input  className='button' onClick={this.clearPlayBack} type="submit" value="Clear Playback" />
                        </div>
                    </div>
                </Draggable>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        callBack: state.callBackFunctions
    };
};

const mapDispatchToProps = dispatch => {
    return {
        /*onInitSelectedSite: site =>
            dispatch({ type: actionTypes.ADD_SELCTED_SITE, siteselected: site })*/
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(Playback);
