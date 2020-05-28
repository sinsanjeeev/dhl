import React from 'react';
import _ from 'lodash'
//import "./App.css";
import './app.scss';
//import 'bootstrap/dist/css/bootstrap.min.css';
import LandingPage from './component/landingpage';
function App() {
  console.log(_.VERSION)
  return (
    <div> 
     
        <LandingPage/>
     </div>
  );
}

export default App;
