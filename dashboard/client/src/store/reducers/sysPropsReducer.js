import * as actionTypes from "../actions/actionTypes";

const initialState = {
  props: {}
};

const sysPropsReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.SYS_PROPS:
      return {
        ...state,
        props: action.props
      };
    default:
      return state;
  }
};

export default sysPropsReducer;