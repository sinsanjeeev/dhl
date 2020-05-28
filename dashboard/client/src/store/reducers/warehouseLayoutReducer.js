import * as actionTypes from "../actions/actionTypes";

const initialState = {
  locationcoordinate: null,
  siteselected: null,
  site: null
};

const warehouseLayoutReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.ADD_WAREHOUSE_COORDINATE:
      return {
        ...state,

        locationcoordinate: action.warehouseLayoutCoordinate
      };
    case actionTypes.ADD_SITE_COORDINATE:
      return {
        ...state,

        site: action.siteLayoutCoordinate
      };
    case actionTypes.ADD_SELCTED_SITE:
      return {
        ...state,
        siteselected: action.siteselected
      };
    default:
      return state;
  }
};

export default warehouseLayoutReducer;
