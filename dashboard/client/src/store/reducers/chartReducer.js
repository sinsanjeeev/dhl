import * as actionTypes from "../actions/actionTypes";

const initialState = {
  kpi: null
};

const chartReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.ADD_KPI:
      return {
        ...state,
        kpi: action.kpi
      };

    default:
      return state;
  }
};

export default chartReducer;
