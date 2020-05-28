import React from "react";
import * as actions from "../../store/actions/index";
import * as actionTypes from "../../store/actions/actionTypes";
import { connect } from "react-redux";
import arrow_move from "../../images/arrows_drag_vert.svg";
import close_but from "../../images/arrows_circle_remove.png";
import Draggable, { DraggableCore } from "react-draggable";
import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from 'react-accessible-accordion';
import 'react-accessible-accordion/dist/fancy-example.css';

import {
  Checkbox,
  TextInput,
  ComboBox
} from "carbon-components-react";

import _ from "lodash";
import { element } from "prop-types";

let thisObject = null;
let previousFilter = null;
class AssetTrackingFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      assetId: ''
    };
    thisObject = this;
    this.selectedItem = null;
  }
  componentDidMount() {

  }
  componentDidUpdate = prevProp => {
    this.refreshAssets();
  };

  randomNumber = (min, max) => {
    return Math.random() * (max - min) + min;
  };

  showSpecificAssetDetail = (evt) => {
    try {
      if (this.selectedItem != null) {
        this.props.callBack.renderSpecificAsset(this.selectedItem);
      } else {
        this.props.callBack.renderSpecificAsset({});
      }
    }
    catch (e) {
      console.log(e.message);
    }
  };

  onAssetIDChange = (evt) => {
    try {
      this.selectedItem = evt.selectedItem;
      if (this.selectedItem === null) this.refreshAssets();
    } catch (e) {
      console.debug(e.message)
    }
  };

  assetStatusFilterChanged = (evt) => {
    if (evt.target.id === 'status_All') {
      let event = evt.target.checked;
      let elements = document.getElementsByName('filtername_status');
      elements.forEach((element) => {
        element.checked = event;
      })
    }
    this.refreshAssets();
  };
  refreshAssets = () => {
    let filters = { status: [] }
    try {
      let elements = document.getElementsByName('filtername_status');
      elements.forEach((element) => {
        if (element.checked) {
          filters.status.push(element.id.substring(7).toUpperCase());
        }
      })
    } catch (e) { console.debug('Exception in asset tracking (refreshAssets) : ' + e.message) }
    if (this.props.assetsObj.assets !== null && this.props.assetsObj.assets !== undefined) {
      this.props.callBack.addAssetsToMap(this.props.assetsObj.assets, filters);
      if (previousFilter === null || (JSON.stringify(filters) !== JSON.stringify(previousFilter))) {
        previousFilter = filters;
        this.props.onAssetFilterChange(filters);
      }
    }
  };

  render() {
    return (
      <div className='assetTrackingContainerHook' style={{ display: (this.props.show ? 'block' : 'none') }}>
        <Draggable
          id="assetTrackingFilterID"
          handle=".handle"
          defaultPosition={{ x: 20, y: 40 }}
          position={null}
          onStart={this.handleStart}
          onDrag={this.handleDrag}
          onStop={this.handleStop}
        >
          <div className='assetTrackingContainer filterPane'>
            <div className='dragPaneCloseButton'>
              {" "}
              <img
                onClick={this.props.parentObj.showAssetTracking}
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
            <div id='assetTrackingFilter' className='assetTrackingFilter'>
              <h4>Asset Status Tracking</h4>
              <div className='assetContainer'>
                <div className='assetDiv'>
                  <div className='assetTextContainer' >{/*<TextInput
                    helperText=""
                    id="asset_is"
                    invalidText="Invalid error message."
                    placeholder="Asset ID"
                    className='assetText'
                    options={["apple", "apricot", "banana", "carrot"]}
                    autocomplete='yes'
                  />*/}
                    <ComboBox
                      ariaLabel="Choose an item"
                      disabled={false}
                      helperText=""
                      id="carbon-combobox-example"
                      invalidText=""
                      itemToElement={null}
                      className='assetText'
                      itemToString={function noRefCheck(item) { return item !== null ? item.device_id : ''; }}
                      items={this.props.assetsObj.assets}
                      light={false}
                      onChange={this.onAssetIDChange}
                      placeholder="Asset ID"
                      value={this.state.assetID}
                      size={undefined}
                      titleText=""
                      type="default"
                    />
                  </div>
                  <div className='assetButtonContainer'>
                    <input className='searchButton' onClick={this.showSpecificAssetDetail} type="submit" value="Search" />
                  </div>
                </div>
                <p className='assetError hideMe' id='assetErrorMessage'>* Asset details not found</p>
              </div>
              <div className='accordianContainer'>
                <Accordion preExpanded="status_accordian">
                  <AccordionItem uuid="status_accordian">
                    <AccordionItemHeading>
                      <AccordionItemButton>
                        <b>Filter By Status</b>
                      </AccordionItemButton>
                    </AccordionItemHeading>
                    <AccordionItemPanel>
                      <div className='accordianDiv'>
                        <Checkbox onClick={this.assetStatusFilterChanged} labelText="ALL" id="status_All" />
                        <Checkbox onClick={this.assetStatusFilterChanged} labelText="ACTIVE" id="status_active" name='filtername_status' defaultChecked />
                        <Checkbox onClick={this.assetStatusFilterChanged} labelText="FAULT" id="status_fault" name='filtername_status' />
                        <Checkbox onClick={this.assetStatusFilterChanged} labelText="IDLE" id="status_idle" name='filtername_status' />
                        <Checkbox onClick={this.assetStatusFilterChanged} labelText="OFFLINE" id="status_offline" name='filtername_status' />
                        <Checkbox onClick={this.assetStatusFilterChanged} labelText="SERVICE" id="status_service" name='filtername_status' />
                      </div>
                    </AccordionItemPanel>
                  </AccordionItem>
                  {/*<AccordionItem>
                    <AccordionItemHeading>
                      <AccordionItemButton>
                        <b>Filter By Asset ID</b>
                      </AccordionItemButton>
                    </AccordionItemHeading>
                    <AccordionItemPanel>
                      <div style={{ maxHeight: '10rem', overflow: 'auto' }}>
                        <Checkbox labelText="Fork Lift 1" id="ForkLift1" />
                        <Checkbox labelText="Fork Lift 2" id="ForkLift2" />
                        <Checkbox labelText="Fork Lift 3" id="ForkLift3" />
                        <Checkbox labelText="Fork Lift 4" id="ForkLift4" />
                        <Checkbox labelText="Fork Lift 5" id="ForkLift5" />
                        <Checkbox labelText="Fork Lift 6" id="ForkLift6" />
                        <Checkbox labelText="Fork Lift 7" id="ForkLift7" />
                        <Checkbox labelText="Fork Lift 8" id="ForkLift8" />
                        <Checkbox labelText="Fork Lift 9" id="ForkLift9" />
                      </div>
                    </AccordionItemPanel>
                  </AccordionItem>*/}
                </Accordion>
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
    assetsObj: state.assetState,
    callBack: state.callBackFunctions
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onAssetFilterChange: newFilters =>
      dispatch({ type: actionTypes.ASSET_FILTER_CHANGE, assetFilters: newFilters })
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(AssetTrackingFilter);
