import axios from 'axios';
let production = true; 

let url = 'http://localhost:6003/'
if (production === true) {
  url = '/'; 
}else {
  url = 'http://localhost:6003/'
}
export default axios.create({
  baseURL: url
});