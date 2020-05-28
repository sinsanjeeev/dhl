import React from "react";
import * as actionTypes from "../../store/actions/actionTypes";
import axios from "../../api";
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
  TextInput
} from "carbon-components-react";

import _ from "lodash";
import { element } from "prop-types";

let thisObject = null;
let previousFilter = null;

class ShipmentTracking extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
    thisObject = this;
    let layoutHierarchy = {};
    let filters = {}
  }

  componentDidMount() {
    this.props.onShipmentFilterChange(this.filters);
  }
  componentDidUpdate = prevProp => {
    this.refreshShipments();
  };

  showSpecificShipmentDetail = (evt) => {
    //hide error message if it is already displayed
    document.getElementById('referenceErrorMessage').style.display = 'none';
    let refId = document.getElementById('epc_reference').value;
    let url = '/epc/epcid/' + refId;
    axios.get(url).then((res) => {
      if (res.data.length !== 0) {
        this.props.callBack.renderSpecificEPC(res.data);
      } else {
        document.getElementById('referenceErrorMessage').style.display = 'block';
        this.props.callBack.renderSpecificEPC(res.data);
      }
    }).catch((err) => {
      console.log(err.message);
    });
  }
  locationSelectionChanged = (evt) => {
    try {
      let event = evt.target.checked;
      if (evt.target.id === 'location_All') {
        let locations = document.getElementsByName('filtername_location');
        locations.forEach((location) => {
          location.checked = event;
        })
        document.getElementById('area_All').checked = event;
        this.areaSelectionChanged({ target: { id: 'area_All', checked: event, source: 'parent' } })
      } else {
        var locationName = evt.target.id.substring(9);
        for (var zone in this.layoutHierarchy) {
          if (this.layoutHierarchy[zone] === locationName) {
            if (document.getElementById('area_' + zone) !== null && document.getElementById('area_' + zone) !== undefined) {
              document.getElementById('area_' + zone).checked = event;
              this.areaSelectionChanged({ target: { id: 'area_' + zone, checked: event, source: 'parent' } })
            }
          }
        }
      }
      this.refreshShipments();
    } catch (e) {
      console.debug('Exception in shipment tracking (locationSelectionChanged) : ' + e.message)
    }
  };
  areaSelectionChanged = (evt) => {
    try {
      let event = evt.target.checked;
      if (evt.target.id === 'area_All') {
        let elements = document.getElementsByName('filtername_area');
        elements.forEach((element) => {
          element.checked = event;
        })
        document.getElementById('subarea_All').checked = event;
        this.subAreaSelectionChanged({ target: { id: 'subarea_All', checked: event, source: 'parent' } })
      } else {
        var areaName = evt.target.id.substring(5);
        for (var zone in this.layoutHierarchy) {
          if (this.layoutHierarchy[zone] === areaName) {
            if (document.getElementById('subarea_' + zone) !== null && document.getElementById('subarea_' + zone) !== undefined) {
              document.getElementById('subarea_' + zone).checked = event;
              this.subAreaSelectionChanged({ target: { id: 'subarea_' + zone, checked: event, source: 'parent' } })
            }
          }
        }
      }
      if (evt.target.source === null || evt.target.source === undefined) this.refreshShipments();
    } catch (e) {
      console.debug('Exception in shipment tracking (areaSelectionChanged) : ' + e.message)
    }
  };
  subAreaSelectionChanged = (evt) => {
    let event = evt.target.checked;
    if (evt.target.id === 'subarea_All') {
      let elements = document.getElementsByName('filtername_subarea');
      elements.forEach((element) => {
        element.checked = event;
      })
    } else {
    }
    if (evt.target.source === null || evt.target.source === undefined) this.refreshShipments();
  };
  refreshShipments = () => {
    this.filters = [];
    const zoomLevel = this.props.trackingObj.zoomLevel;
    const layout = this.layout;
    try {
      for (var locationName in layout.locations) {
        let locationSelected = false;
        if (document.getElementById('location_' + locationName) !== null && document.getElementById('location_' + locationName) !== undefined) {
          if (document.getElementById('location_' + locationName).checked === true) locationSelected = true;
        }
        if (Object.keys(layout.locations[locationName].areas).length !== 0) {
          for (var areaName in layout.locations[locationName].areas) {
            let areaSelected = false;
            if (document.getElementById('area_' + areaName) !== null && document.getElementById('area_' + areaName) !== undefined) {
              if (document.getElementById('area_' + areaName).checked === true) areaSelected = true;
            }
            if (Object.keys(layout.locations[locationName].areas[areaName].sub_areas).length !== 0) {
              for (var subareaName in layout.locations[locationName].areas[areaName].sub_areas) {
                let subAreaSelected = false;
                if (document.getElementById('subarea_' + subareaName) !== null && document.getElementById('subarea_' + subareaName) !== undefined) {
                  if (document.getElementById('subarea_' + subareaName).checked === true) subAreaSelected = true;
                }
                if ((zoomLevel === 'subarea' && subAreaSelected) || (zoomLevel === 'area' && areaSelected) || (zoomLevel === 'location' && locationSelected)) this.filters.push(subareaName);
              }
            } else {
              if (((zoomLevel === 'area' || zoomLevel === 'subarea') && areaSelected) || (zoomLevel === 'location' && locationSelected)) this.filters.push(areaName);
            }
          }
        } else {
          if (locationSelected) this.filters.push(locationName);
        }
      }
      if (previousFilter === null || JSON.stringify(this.filters) !== JSON.stringify(previousFilter)) {
        previousFilter = [...this.filters];
        this.props.onShipmentFilterChange(this.filters);
        this.props.callBack.refreshMapLayers({ type: 'selectionChanged' });
      }
    } catch (e) {
      console.debug('Exception in shipment tracking (refreshShipments) : ' + e.message)
    }
  }
  render() {
    let layout = null;
    let visibleZones = this.props.layoutZones.visibleZones;
    let locEntities = [];
    let areaEntities = [];
    let subAreaEntities = [];
    try {
      for (var key in this.props.coordinateObj.locationcoordinate) {
        if (this.props.coordinateObj.locationcoordinate[key].city === this.props.coordinateObj.siteselected) {
          layout = thisObject.props.coordinateObj.locationcoordinate[key];
        }
      }
    } catch (e) { console.debug('Exception in shipment tracking (render) : ' + e.message) }
    if (layout !== null && layout !== undefined) {
      this.layout = layout;
      this.layoutHierarchy = { ...layout.hierarchy };
      for (var locationName in layout.locations) {
        locEntities.push(locationName);
        if (Object.keys(layout.locations[locationName].areas).length !== 0) {
          for (var areaName in layout.locations[locationName].areas) {
            areaEntities.push(areaName);
            if (Object.keys(layout.locations[locationName].areas[areaName].sub_areas).length !== 0) {
              for (var subareaName in layout.locations[locationName].areas[areaName].sub_areas) {
                subAreaEntities.push(subareaName);
              }
            }
          }
        }
      }
    }

    return (
      <div className='shipmentFilterContainerHook' style={{ display: (this.props.show ? 'block' : 'none') }}>
        <Draggable
          id="dragerrr"
          handle=".handle"
          defaultPosition={{ x: 20, y: 40 }}
          position={null}
          onStart={this.handleStart}
          onDrag={this.handleDrag}
          onStop={this.handleStop}
        >
          <div className='shipmentFilterContainer filterPane'>
            <div className='dragPaneCloseButton'>
              {" "}
              <img
                onClick={this.props.parentObj.showShipment}
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
            <div id='shipmentFilter' className='shipmentFilter'>
              <h4>Shipment tracking</h4>
              <div className='referenceContainer'>
                <div className='referenceDiv'>
                  <div className='referenceTextContainer' ><TextInput
                    helperText=""
                    id="epc_reference"
                    invalidText="Invalid error message."
                    //abelText="Reference Number"
                    placeholder="Reference Number"
                    className='referenceText'
                  />
                  </div>
                  <div className='referenceButtonContainer'>
                    <input className='searchButton' onClick={this.showSpecificShipmentDetail} type="submit" value="Search" />
                  </div>
                </div>
                <p className='referenceError hideMe' id='referenceErrorMessage'>* Shipment details not found</p>
              </div>
              <div className='accordianContainer'>
                <Accordion preExpanded="location_accordian">
                  <AccordionItem uuid="location_accordian">
                    <AccordionItemHeading>
                      <AccordionItemButton>
                        <b>Filter By Location</b>
                      </AccordionItemButton>
                    </AccordionItemHeading>
                    <AccordionItemPanel>
                      <div id="filterByLocationDivContainer" className='accordianDiv'>
                        <Checkbox defaultChecked labelText="All" id="location_All" onClick={this.locationSelectionChanged} />
                        {
                          locEntities.map((locationName) => {
                            let identity = "location_" + locationName;
                            return (<div style={{ display: visibleZones.locations.indexOf(locationName) !== -1 ? 'block' : 'none' }} >
                              <Checkbox defaultChecked labelText={locationName} id={identity} onClick={this.locationSelectionChanged} name='filtername_location' /></div>)
                          })
                        }
                      </div>
                    </AccordionItemPanel>
                  </AccordionItem>
                  <AccordionItem style={{ display: (this.props.trackingObj.zoomLevel === 'area' || this.props.trackingObj.zoomLevel === 'subarea' ? 'block' : 'none') }}>
                    <AccordionItemHeading>
                      <AccordionItemButton>
                        <b>Filter By Area</b>
                      </AccordionItemButton>
                    </AccordionItemHeading>
                    <AccordionItemPanel>
                      <div id="filterByAreaDivContainer" className='accordianDiv'>
                        <Checkbox defaultChecked labelText="All" id="area_All" onClick={this.areaSelectionChanged} />
                        {
                          areaEntities.map((areaName) => {
                            let identity = "area_" + areaName;
                            return (<div style={{ display: visibleZones.areas.indexOf(areaName) !== -1 ? 'block' : 'none' }} >
                              <Checkbox defaultChecked labelText={areaName} id={identity} onClick={this.areaSelectionChanged} name='filtername_area' /></div>)
                          })
                        }
                      </div>
                    </AccordionItemPanel>
                  </AccordionItem>
                  <AccordionItem style={{ display: (this.props.trackingObj.zoomLevel === 'subarea' ? 'block' : 'none') }}>
                    <AccordionItemHeading>
                      <AccordionItemButton>
                        <b>Filter By Sub Area</b>
                      </AccordionItemButton>
                    </AccordionItemHeading>
                    <AccordionItemPanel>
                      <div id="filterBySubAreaDivContainer" className='accordianDiv'>
                        <Checkbox defaultChecked labelText="All" id="subarea_All" onClick={this.subAreaSelectionChanged} />
                        {
                          subAreaEntities.map((subAreaName) => {
                            let identity = "subarea_" + subAreaName;
                            return (<div style={{ display: visibleZones.subareas.indexOf(subAreaName) !== -1 ? 'block' : 'none' }} >
                              <Checkbox defaultChecked labelText={subAreaName} id={identity} onClick={this.subAreaSelectionChanged} name='filtername_subarea' /></div>)
                          })
                        }
                      </div>
                    </AccordionItemPanel>
                  </AccordionItem>
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
    coordinateObj: state.warehouseLayout,
    trackingObj: state.tracking,
    epcObj: state.epsState,
    layoutZones: state.layoutZones,
    callBack: state.callBackFunctions
  };
};

const mapDispatchToProps = dispatch => {
  return {

    onShipmentFilterChange: newFilters =>
      dispatch({ type: actionTypes.SHIPMENT_FILTER_CHANGE, shipmentFilters: newFilters })
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(ShipmentTracking);
