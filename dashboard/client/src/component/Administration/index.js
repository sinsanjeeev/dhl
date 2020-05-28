import React from "react";
import { connect } from "react-redux";
import arrow_move from "../../images/arrows_drag_vert.svg";
import close_but from "../../images/arrows_circle_remove.png";
import Draggable, { DraggableCore } from "react-draggable";
import LayoutAdmin from "./LayoutAdmin";
import AlertSettings from "./AlertSettings";
import PageSettings from "./PageSettings";
import MapSettings from "./MapSettings";

import {
    Tabs, Tab
} from "carbon-components-react";

import _ from "lodash";
import { element } from "prop-types";
import UserAdmin from "./UserAdmin";

class Administration extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    componentDidMount() {

    }
    componentDidUpdate = prevProp => {

    };

    render() {
        return (
            <div className='adminContainerHook' style={{ display: (this.props.show ? 'block' : 'none') }}>

                <Draggable
                    id="exceptionsPageID"
                    handle=".handle"
                    defaultPosition={{ x: 20, y: 20 }}
                    position={null}
                    onStart={this.handleStart}
                    onDrag={this.handleDrag}
                    onStop={this.handleStop}
                >
                    <div className='adminContainer'>
                        <div  className='dragPaneCloseButton'>
                            {" "}
                            <img
                                onClick={this.props.parentObj.showAdmin}
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
                        <div id='adminPageDiv' className='adminPage'>
                            <h5>System Administration & Configuration</h5>
                            <Tabs className='adminPage--tabs'>
                                <Tab
                                    href="#"
                                    id="tab-1"
                                    label="User Management"
                                >
                                    <UserAdmin />
                                </Tab>
                                <Tab
                                    href="#"
                                    id="tab-2"
                                    label="Layout settings"
                                >
                                    <LayoutAdmin />
                                </Tab>
                                <Tab
                                    href="#"
                                    id="tab-3"
                                    label='Map Settings'
                                >
                                    <MapSettings />
                                </Tab>
                                <Tab
                                    href="#"
                                    id="tab-3"
                                    label='Page Settings'
                                >
                                    <PageSettings />
                                </Tab>
                                <Tab
                                    href="#"
                                    id="tab-3"
                                    label='Alert Settings'
                                >
                                    <AlertSettings />
                                </Tab>
                                <Tab
                                    href="#"
                                    id="tab-3"
                                    label='Style Settings'
                                >
                                    <div className="some-content">
                                        <h5>Back ground colors of locations</h5><br></br>
                                        <h5>Back ground color for tab panel</h5><br></br>
                                        <h5>Back ground color for floating panels</h5><br></br>
                                        <h5>Any font changes</h5><br></br>
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
        
    };
};
const getSelectionProps = (ev) => {

}
const mapDispatchToProps = dispatch => {
    return {
        
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(Administration);
