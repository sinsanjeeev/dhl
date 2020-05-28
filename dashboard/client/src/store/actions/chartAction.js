import * as actionTypes from "./actionTypes";
//import axios from 'axios'
import axios from "../../api";

export const setKpi = kpi => {
  return {
    type: actionTypes.ADD_KPI,
    kpi: kpi
  };
};

export const initkpiAction = () => async dispatch => {
  try {
    const response = await axios.get("chart/kpi");
    dispatch(setKpi(response.data));
  } catch (error) {
    console.log(error);
  }
};
