import L from "leaflet";
import forkliftIcon_active from "../../../images/forkliftIcon_active.png";
import forkLiftIcon_fault from "../../../images/forkliftIcon_fault.png";
import forkLiftIcon_offline from "../../../images/forkliftIcon_offline.png";
import forkLiftIcon_service from "../../../images/forkliftIcon_service.png";
import forkLiftIcon_idle from "../../../images/forkliftIcon_idle.png";


const iconMapping = {
    'ACTIVE': forkliftIcon_active,
    'FAULT': forkLiftIcon_fault,
    'OFFLINE': forkLiftIcon_offline,
    'SERVICE': forkLiftIcon_service,
    'IDLE': forkLiftIcon_idle
}

export const fetchForkliftIcon = (status) => {
    try {
        return L.icon({
            iconUrl: iconMapping[status],
            iconSize: [45.2, 30],
            iconAnchor: [15, 10]
        });
    } catch (error) {
        console.log(error);
    }
};