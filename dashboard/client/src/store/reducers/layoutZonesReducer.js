import * as actionTypes from "../actions/actionTypes";

const initialState = {
  visibleZones : {locations:[],areas:[],subareas:[]}
};

const layoutZonesReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.MAP_VISIBLE_ZONE_CHANGE:
        return {
          ...state,
  
          visibleZones: action.visibleZones
        };
    default:
      return state;
  }
};

export default layoutZonesReducer;
