import * as actionTypes from "./actionTypes";
//import axios from 'axios'
import axios from "../../api";
import locationHierarchy_local from "../../data/hierarchy"

export const setLocationLayoutCoordinate = layoutcoordinate => {
  return {
    type: actionTypes.ADD_WAREHOUSE_COORDINATE,
    warehouseLayoutCoordinate: layoutcoordinate
  };
};
export const setSiteLayoutCoordinate = layoutcoordinate => {
  return {
    type: actionTypes.ADD_SITE_COORDINATE,
    siteLayoutCoordinate: layoutcoordinate
  };
};
export const initLocationLayoutCoordinate = (siteid) => async dispatch => {
  try {
    //const response = await axios.get("/layout/sitelocation");
    const response = await axios.get("/layout/hierarchy/siteid/"+siteid);
    dispatch(setLocationLayoutCoordinate(formatHierarchyData(response.data)));
  } catch (error) {
    console.log(error.message);
    dispatch(setLocationLayoutCoordinate(formatHierarchyData(locationHierarchy_local)));
  }
};
export const initSiteLayoutCoordinate = () => async dispatch => {
  try {
    const response = await axios.get("/layout/site");
    dispatch(setSiteLayoutCoordinate(response.data));
  } catch (error) {
    console.log(error.message);
  }
};
const formatHierarchyData = (receivedData) => {
  let formattedData = {}
  try{
    receivedData.forEach((location, i) => {
      let siteName = location['dhl_site.site_name'];
      if(formattedData[siteName] == null || formattedData[siteName] == undefined){
        formattedData[siteName] = {id:location.site_id, city: location['dhl_site.city'], locations : {}, hierarchy : {}}
      }
      let siteData = formattedData[siteName];
      siteData.locations[location.location_name] = {id:location.location_id, type:'location', latlon : [...location.locationxy_coordinate.xy], areas : {}}
      siteData.hierarchy[location.location_name]  = location.parent_location;
      if(location.children != null && location.children != undefined){
        let locationData = formattedData[siteName].locations[location.location_name];
        location.children.forEach((area,j) => {
          locationData.areas[area.location_name] = {id:area.location_id, type:'area', latlon : [...area.locationxy_coordinate.xy], sub_areas : {}}
          siteData.hierarchy[area.location_name]  = location.location_name;
          if(area.children != null && area.children != undefined){
            let areaData = formattedData[siteName].locations[location.location_name].areas[area.location_name]
            area.children.forEach((subarea,k) => {
              areaData.sub_areas[subarea.location_name] = {id:subarea.location_id, type:'subarea', latlon : [...subarea.locationxy_coordinate.xy]}
              siteData.hierarchy[subarea.location_name]  = area.location_name;
            })
          }
        })
      }
    });
  } catch(error){
    console.debug(error.message);
  }
  return formattedData;
}