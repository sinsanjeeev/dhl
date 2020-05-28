import * as actionTypes from "../actions/actionTypes";

const initialState = {
  selectedtracking: "epc",
  locationMapSelected:false,
  zoomLevel:'location'
};

const mapTrackingReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.ADD_MAP_TRACKING:
      return {
        ...state,

        selectedtracking: action.selectedtracking
      };
      case actionTypes.ADD_SELECTED_LOCATION_MAP:
        return {
          ...state,
  
          locationMapSelected: action.selectedlocationmap
        };
      case actionTypes.MAP_ZOOM_CHANGE:
        return {
          ...state,
  
          zoomLevel: action.currentZoomLevel
        };
    default:
      return state;
  }
};

export default mapTrackingReducer;