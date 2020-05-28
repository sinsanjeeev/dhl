import * as actionTypes from "../actions/actionTypes";

const initialState = {

};

const callBackReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.MAP_REFRESH_LAYERS:
      return {
        ...state,

        refreshMapLayers: action.callBackFunction
      };
    case actionTypes.MAP_RENDER_HEATMAP:
      return {
        ...state,

        renderHeatMap: action.callBackFunction
      };
    case actionTypes.MAP_PLAY_BACK:
      return {
        ...state,

        renderPlayBack: action.callBackFunction
      };
    case actionTypes.MAP_SHOW_SINGLE_EPC:
      return {
        ...state,

        renderSpecificEPC: action.callBackFunction
      };
    case actionTypes.MAP_SHOW_SINGLE_ASSET:
      return {
        ...state,

        renderSpecificAsset: action.callBackFunction
      };
    case actionTypes.MAP_SHOW_ASSETS:
      return {
        ...state,

        addAssetsToMap: action.callBackFunction
      };
    default:
      return state;
  }
};

export default callBackReducer;