import React from "react";
import dhl_log from "../../images/dhl_logo.png";
import dhl_log2 from "../../images/BannerNew.png";
import chicago_logo from "../../images/warehouse.jpg";

import miami_logo from "../../images/miami.png";
import WarehouseLayout from "../warehouselayout";
import * as actionTypes from "../../store/actions/actionTypes";
import { connect } from "react-redux";
import _ from "lodash";

import UserSwitcher20 from "@carbon/icons-react/lib/user/20";
import AppSwitcher20 from "@carbon/icons-react/lib/app-switcher/20";
import HeaderContainer from "carbon-components-react/lib/components/UIShell/HeaderContainer";
import TabPanel from "./../TabPanel"
import ShipmentTracking from "./../ShipmentTracking";
import AssetTracking from "./../AssetTracking";
import HeatMap from "./../HeatMap";
import Playback from "./../Playback";
import Exceptions from "./../Exceptions";
import KPI from "./../KPI";
import Administration from "./../Administration";
import TroubleShooting from "./../TroubleShooting";
import './../TabPanel/_tabPanel.scss';
import * as icons from "./../../images/sideNavIcons";
import pushButtonRed from "./../../images/redButton.png";
import pushButtonGreen from "./../../images/greenButton.png";
import {
  Header,
  HeaderMenuButton,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
  SideNav,
  SideNavItems,
  SideNavLink,
  HeaderPanel,
  Switcher,
  SwitcherItem,
} from "carbon-components-react/lib/components/UIShell";
let siteModel = [];

class LandingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sitelst: { id: "All", text: "All" },
      siteselected: null,
      siteImage: "null",
      siteModel: [],
      showShipment: false,
      showAssetTracking: false,
      showHeatMap: false,
      showPlayback: false,
      showExceptions: false,
      showKPI: false,
      showSiteInfo: false,
      showAdmin: false,
      showLog: false,
      showRightPanel: false,
      showShipmentLayer: false,
      showAssetTrackingLayer: false
    };
  }

  componentDidMount() { }
  handleData = data => {
    console.log(data);
  };
  componentDidUpdate = prevProp => {
    if (
      !_.isNil(this.props.epcObj.epc) &&
      this.props.trackingObj.locationMapSelected === true
    ) {
      this.addEventListeners();
    }
  };

  addEventListeners = () => {
    if (this.shipmentListenerAdded === null || this.shipmentListenerAdded === undefined) {
      document.getElementById("shipmentLayerToggleButton").addEventListener("change", this.toggleShipments, false);
      this.shipmentListenerAdded = true;
      this.setState({showShipmentLayer:true})
    }
    if (this.assetListenerAdded === null || this.assetListenerAdded === undefined) {
      document.getElementById("assetLayerToggleButton").addEventListener("change", this.toggleAssetLayer, false);
      this.assetListenerAdded = true;
    }
    if (this.resetMapListenerAdded === null || this.resetMapListenerAdded === undefined) {
      document.getElementById("resetMapButtonId").addEventListener("click", this.resetMapListener, false);
      this.resetMapListenerAdded = true;
    }
  }
  resetMapListener = () => {
    this.shipmentListenerAdded = null;
    this.assetListenerAdded = null;
    this.resetMapListenerAdded = null;
    setTimeout(this.addEventListeners, 1000);
  }
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
  showRightPanel = evt => {
    let newValue = this.state.showRightPanel ? false : true;
    this.setState(
      {
        showRightPanel: newValue
      }
    )
  }
  resetMap = evt => {
    try{
      document.getElementById("resetMapButtonId").dispatchEvent(new Event('click'));
    } catch (e) { }
  }
  toggleShipments = evt => {
    this.setState({
      showShipmentLayer: document.getElementById("shipmentLayerToggleButton").checked
    })
  }
  toggleAssetLayer = evt => {
    this.setState({
      showAssetTrackingLayer: document.getElementById("assetLayerToggleButton").checked
    })
  }
  showShipmentLayer = evt => {
    let newValue = this.state.showShipmentLayer ? false : true;
    try {
      let shipmentLayerToggleButton = document.getElementById("shipmentLayerToggleButton");
      shipmentLayerToggleButton.checked = newValue;
      shipmentLayerToggleButton.dispatchEvent(new Event('click'));
      this.setState(
        {
          showShipmentLayer: newValue
        }
      )
      if (this.shipmentListenerAdded === null || this.shipmentListenerAdded === undefined) {
        document.getElementById("shipmentLayerToggleButton").addEventListener("change", this.toggleShipments, false);
        this.shipmentListenerAdded = true;
      }
    } catch (e) {}
  }
  showAssetTrackingLayer = evt => {
    let newValue = this.state.showAssetTrackingLayer ? false : true;
    try {
      let assetLayerToggleButton = document.getElementById("assetLayerToggleButton");
      assetLayerToggleButton.checked = newValue;
      assetLayerToggleButton.dispatchEvent(new Event('click'));
      this.setState(
        {
          showAssetTrackingLayer: newValue
        }
      )
      if (this.assetListenerAdded === null || this.assetListenerAdded === undefined) {
        document.getElementById("assetLayerToggleButton").addEventListener("change", this.toggleAssetLayer, false);
        this.assetListenerAdded = true;
      }
    } catch (e) {}
  }
  render() {
    return (
      <div>
        <div className="container">
          <HeaderContainer
            render={({ isSideNavExpanded, onClickSideNavExpand }) => (
              <>
                <Header aria-label="IBM Platform Name">
                  <SkipToContent />
                  <HeaderMenuButton
                    aria-label="Open menu"
                    onClick={onClickSideNavExpand}
                    isActive={isSideNavExpanded}
                  />
                  <div className="bx--row ">
                    <div className="bx--col-lg-16 landing-page__banner">
                      <div className="header">
                        <div className="header_left">
                          <img src={dhl_log} className="header_left_logo" />
                        </div>
                        <div className="header_middle">&nbsp;</div>

                      </div>
                    </div>
                  </div>
                  <HeaderGlobalBar>
                    <div className="header_right">
                      <a href="#">
                        <img src={dhl_log2} className="header_right_logo" />
                      </a>
                    </div>
                    <HeaderGlobalAction aria-label="User Profile" onClick={() => { }}>
                      <UserSwitcher20 />
                    </HeaderGlobalAction>
                    {/*
                    <HeaderGlobalAction aria-label="App Switcher" isActive onClick={() => { this.showRightPanel() }}>
                      <AppSwitcher20 />
                    </HeaderGlobalAction>*/}
                  </HeaderGlobalBar>
                  <SideNav aria-label="Side navigation" isFixedNav expanded={isSideNavExpanded}>
                    <SideNavItems>
                      <SideNavLink large renderIcon={icons.sn_shipment} href="#" onClick={this.showShipment}>Shipment Tracking</SideNavLink>
                      <SideNavLink large renderIcon={icons.sn_assettracking} href="#" onClick={this.showAssetTracking}>Asset Tracking</SideNavLink>
                      <SideNavLink large renderIcon={icons.sn_heatmap} href="#" onClick={this.showHeatMap}>Heat Map</SideNavLink>
                      <SideNavLink large renderIcon={icons.sn_playback} href="#" onClick={this.showPlayback}>PlayBack</SideNavLink>
                      <SideNavLink large renderIcon={icons.sn_kpi} href="#" onClick={this.showKPI}>KPI Report</SideNavLink>
                      <SideNavLink large renderIcon={icons.sn_exception} href="#" onClick={this.showExceptions}>Exception</SideNavLink>
                      <SideNavLink large renderIcon={icons.sn_admin} href="#" onClick={this.showAdmin}>Administration</SideNavLink>
                      <SideNavLink large renderIcon={icons.sn_troubleshoot} href="#" onClick={this.showLog}>Trouble Shooting</SideNavLink>
                      <SideNavLink large element='div' >
                        <div className='pushButton--container' style={{borderTop:'solid 1px grey'}}>
                          <img className='pushButton' onClick={()=>{this.showShipmentLayer() }} src={this.state.showShipmentLayer ? pushButtonGreen : pushButtonRed}></img>
                          <span className='bx--side-nav__link bx--side-nav__link-text'>{this.state.showShipmentLayer ? 'Hide Shipments' : 'Show Shipments'}</span>
                        </div>
                      </SideNavLink>
                      <SideNavLink large element='div' >
                        <div className='pushButton--container'>
                          <img className='pushButton' onClick={()=>{this.showAssetTrackingLayer() }} src={this.state.showAssetTrackingLayer ? pushButtonGreen : pushButtonRed}></img>
                          <span className='bx--side-nav__link bx--side-nav__link-text'>{this.state.showAssetTrackingLayer ? 'Hide Assets' : 'Show Assets'}</span>
                        </div>
                      </SideNavLink>
                    </SideNavItems>
                  </SideNav>
                  <HeaderPanel expanded={this.state.showRightPanel ? true : false}>
                    <Switcher>
                      <SwitcherItem onClick={() => { this.resetMap() }}>
                        Reset Map
                        </SwitcherItem>
                      <SwitcherItem onClick={() => { this.showShipmentLayer() }}>
                        {this.state.showShipmentLayer ? 'Hide Shipments' : 'Show Shipments'}
                      </SwitcherItem>
                      <SwitcherItem onClick={() => { this.showAssetTrackingLayer() }}>
                        {this.state.showAssetTrackingLayer ? 'Hide Assets' : 'Show Assets'}
                      </SwitcherItem>
                    </Switcher>
                  </HeaderPanel>
                </Header>
              </>
            )}
          />
          <div className="bx--grid bx--grid--full-width landing-page">

            <div id="dragParent" className="bx--row landing-page__r2">

              <div className="bx--col-md-4  bx--col-lg-16">
                <div>
                  <WarehouseLayout parentObj={this} />
                </div>
                <div className="navbardiv">
                  <ShipmentTracking show={this.state.showShipment} parentObj={this} />
                  <AssetTracking show={this.state.showAssetTracking} parentObj={this} />
                  <HeatMap show={this.state.showHeatMap} parentObj={this} />
                  <Playback show={this.state.showPlayback} parentObj={this} />
                  <Exceptions show={this.state.showExceptions} parentObj={this} />
                  <KPI show={this.state.showKPI} parentObj={this} />
                  {/*<SiteInfo show={this.state.showSiteInfo} parentObj={this}/>*/}
                  <Administration show={this.state.showAdmin} parentObj={this} />
                  <TroubleShooting show={this.state.showLog} parentObj={this} />
                </div>
                {/*<TabPanel/>*/}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}


const mapStateToProps = state => {
  return {
    epcObj: state.epsState,
    trackingObj: state.tracking
  };
};

const mapDispatchToProps = dispatch => {
  return {
    
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(LandingPage);
