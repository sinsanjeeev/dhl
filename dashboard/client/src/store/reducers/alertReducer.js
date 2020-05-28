import * as actionTypes from "../actions/actionTypes";

const initialState = {
  alert: null
};

const alertReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.ADD_ALERT:
      return {
        ...state,

        alert: action.alert
      };

    default:
      return state;
  }
};

export default alertReducer;
