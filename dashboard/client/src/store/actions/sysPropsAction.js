import * as actionTypes from "./actionTypes";
import axios from "../../api";

export const setSysProps = props => {
  return {
    type: actionTypes.SYS_PROPS,
    props: props
  };
};

export const fetchSysProps = (siteid) => async dispatch => {
    try {
      const response = await axios.get("/sysprops/site/"+siteid);
      if(response.data !== null){
        let properties = {}
        response.data.forEach((property) => {
          properties[property.name] = property;
        })
        dispatch(setSysProps(properties));
      } else {
        dispatch(setSysProps(response.data));
      }
    } catch (error) {
      console.log(error);
    }
  };
