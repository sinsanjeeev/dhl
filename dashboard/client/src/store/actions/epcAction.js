import * as actionTypes from "./actionTypes";
//import axios from 'axios'
import axios from "../../api";

export const setAllEpc = epcs => {
  return {
    type: actionTypes.ADD_EPC_ALL,
    epc: epcs
  };
};
export const initAllEPC = (siteid) => async dispatch => {
    try {
      //const response = await axios.get("/epc/all");
      const response = await axios.get("epc/current/state/siteid/"+siteid);
      dispatch(setAllEpc(response.data));
    } catch (error) {
      console.log(error);
    }
  };