import React from "react";
import * as actions from "../../store/actions/index";
import * as actionTypes from "../../store/actions/actionTypes";
import axios from "../../api";
import { connect } from "react-redux";
import arrow_move from "../../images/arrows_drag_vert.svg";
import close_but from "../../images/arrows_circle_remove.png";
import Draggable, { DraggableCore } from "react-draggable";

import 'react-accessible-accordion/dist/fancy-example.css';
import {
    ComboBox,
    TextArea
} from "carbon-components-react";

import _ from "lodash";
import { element } from "prop-types";

let thisObject = null;
let hostname = '';
//hostname = 'https://global-dhl-423761-0a85938276edbbcfb58a5c4bf680f8e3-0000.us-south.containers.appdomain.cloud'

let logDetails = [{
    name: 'ORDF99',
    logURL: '/prod/dhl/log',
    downloadURL: '/prod/dhl/download'
}]
class TroubleShooting extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            logName: ''
        };
        thisObject = this;
        this.selectedItem = null;
    }

    componentDidMount() {

    }
    componentDidUpdate = prevProp => {

    };

    randomNumber = (min, max) => {
        return Math.random() * (max - min) + min;
    };
    onLogSelectionChange = (evt) => {
        try {
            this.selectedItem = evt.selectedItem;
            this.showLog();
        } catch (e) {
            console.debug(e.message)
        }
    };
    showLog = () => {
        try {
            if (this.selectedItem !== null) {
                document.getElementById('downloadButtonContainer').style.display = 'block';
                axios.get(hostname + this.selectedItem.logURL).then((res) => {
                    let logArea = document.getElementById('logText');
                    if (logArea !== null && logArea !== undefined) {
                        if (res.data.length !== 0) {
                            var str = '';
                            for (var k in res.data) {
                                str = str + (res.data[k])
                            }
                            logArea.value = str;
                        }
                        setTimeout(this.showLog, 2500);
                    }
                }).catch((err) => {
                    console.log(err.message);
                });
            } else {
                document.getElementById('logText').value = 'Select log file from the list';
                document.getElementById('downloadButtonContainer').style.display = 'none';
            }
        } catch (e) {
        }
    }
    downloadLogFile = () => {
        try {
            setTimeout(() => {
                const response = {
                  file: hostname + this.selectedItem.downloadURL,
                };
                window.open(response.file);
              }, 100);
        } catch (e) {
        }
    }
    render() {
        return (
            <div className='troubleshootingContainerHook' style={{ display: (this.props.show ? 'block' : 'none') }}>
                <Draggable
                    id="troubleshootingFilterID"
                    handle=".handle"
                    defaultPosition={{ x: 20, y: 40 }}
                    position={null}
                    onStart={this.handleStart}
                    onDrag={this.handleDrag}
                    onStop={this.handleStop}
                >
                    <div className='troubleshootingContainer'>
                        <div className='dragPaneCloseButton'>
                            {" "}
                            <img
                                onClick={this.props.parentObj.showLog}
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
                        <div id='troubleshootingFilter' className='troubleshootingFilter'>
                            <h4>Trouble shooting</h4>
                            <div className='logContainer'>
                                <div className='logDiv'>
                                    <div className='logTextContainer' >
                                        <ComboBox
                                            ariaLabel="Choose an item"
                                            disabled={false}
                                            helperText=""
                                            id="carbon-combobox-example"
                                            invalidText=""
                                            itemToElement={null}
                                            className='logText'
                                            itemToString={function noRefCheck(item) { return item !== null ? item.name : ''; }}
                                            items={logDetails}
                                            light={false}
                                            onChange={this.onLogSelectionChange}
                                            placeholder="Select Log"
                                            value={this.state.logName}
                                            size={undefined}
                                            titleText=""
                                            type="default"
                                        />
                                    </div>
                                    <div id='downloadButtonContainer' className='downloadButtonContainer'>
                                        <input className='downloadButton' onClick={this.downloadLogFile} type="submit" value="Download Log File" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <TextArea
                                    id="logText"
                                    labelText=""
                                    rows={25}
                                    value='Select log file from the list'
                                />
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

    };
};
const getSelectionProps = (ev) => {

}
const mapDispatchToProps = dispatch => {
    return {

    };
};
export default connect(mapStateToProps, mapDispatchToProps)(TroubleShooting);
