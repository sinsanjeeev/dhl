import * as actionTypes from "../actions/actionTypes";

const initialState = {
  shipmentFilters: { locations: ['all'], areas: ['all'], subareas: ['all'] },
  assetFilters : {status:[]}
};

const filtersReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.SHIPMENT_FILTER_CHANGE:
      return {
        ...state,

        shipmentFilters: action.shipmentFilters
      };
    case actionTypes.ASSET_FILTER_CHANGE:
      return {
        ...state,

        assetFilters: action.assetFilters
      };
    default:
      return state;
  }
};

export default filtersReducer;
