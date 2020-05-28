import * as actionTypes from "../actions/actionTypes";

const initialState = {
  assets: null,
  status: []
};

const assetReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.ADD_ASSETS_ALL:
      return {
        ...state,
        assets: action.assets
      };
    case actionTypes.DEVICE_STATUS_ALL:
      return {
        ...state,
        status: action.status
      };

    default:
      return state;
  }
};

export default assetReducer;