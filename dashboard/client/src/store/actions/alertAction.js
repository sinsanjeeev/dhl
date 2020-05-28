import * as actionTypes from "./actionTypes";
//import axios from 'axios'
import axios from "../../api";

export const setAlert = alert => {
  return {
    type: actionTypes.ADD_ALERT,
    alert: alert
  };
};

export const initAction = () => async dispatch => {
  try {
    const response = axios.get("alert");
    dispatch(setAlert(response.data));
  } catch (error) {
    console.log(error);
  }
};
