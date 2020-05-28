import { combineReducers } from "redux";

import warehouseLayoutReducer from "./warehouseLayoutReducer";
import layoutZonesReducer from "./layoutZonesReducer";
import callBackReducer from "./callBackReducer";
import filtersReducer from "./filtersReducer";
import alertReducer from "./alertReducer";
import chartReducer from "./chartReducer";
import mapTrackingReducer from "./mapTrackingReducer"
import epcReducer from './epcReducer';
import assetReducer from './assetReducer';
import sysPropsReducer from './sysPropsReducer';
export default combineReducers({
  warehouseLayout: warehouseLayoutReducer,
  alertArr: alertReducer,
  chartData: chartReducer,
  tracking:mapTrackingReducer,
  epsState:epcReducer,
  assetState:assetReducer,
  layoutZones:layoutZonesReducer,
  callBackFunctions:callBackReducer,
  filters : filtersReducer,
  system : sysPropsReducer
});
