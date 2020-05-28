import L from "leaflet";
import markerIcon_medium from "../../../images/marker-icon-2x-orange.png";
import markerIcon_severe from "../../../images/marker-icon-2x-red.png";
import shadow from "../../../images/marker-shadow.png";


const iconMapping = {
    'MEDIUM': markerIcon_medium,
    'SEVERE': markerIcon_severe
}

export const fetchShipmentIcon = (status) => {
    try {
        return L.icon({
            iconUrl: iconMapping[status],
            shadowUrl: shadow,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
    } catch (error) {
        console.log(error);
    }
};