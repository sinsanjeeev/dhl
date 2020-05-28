import * as actionTypes from "./actionTypes";
import axios from "../../api";

export const setAllAssets = assets => {
  return {
    type: actionTypes.ADD_ASSETS_ALL,
    assets: assets
  };
};

export const setDeviceStatus = status => {
  return {
    type: actionTypes.DEVICE_STATUS_ALL,
    status: status
  };
};

export const initAllAssets = (siteid) => async dispatch => {
    try {
      const response = await axios.get("forklift/current/state/siteid/"+siteid);
      dispatch(setAllAssets(response.data));
    } catch (error) {
      console.log(error);
    }
  };
export const fetchDeviceStatus = (siteid) => async dispatch => {
  try {
    const response = await axios.get("device/status/site/"+siteid);
    dispatch(setDeviceStatus(response.data));
  } catch (error) {
    console.log(error);
  }
};