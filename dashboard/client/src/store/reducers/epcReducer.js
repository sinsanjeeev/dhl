import * as actionTypes from "../actions/actionTypes";

const initialState = {
  epc: null
};

const epcReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.ADD_EPC_ALL:
      return {
        ...state,
        epc: action.epc
      };

    default:
      return state;
  }
};

export default epcReducer;