/* global H */
import React, { useState, useEffect } from 'react';
// import HereMap from './components/HereMap'
import axios from 'axios';
import FoxyInput from './components/FoxyInput';

import { CircularProgress } from '@material-ui/core/'
import LoadingPanel from './components/LoadingPanel';

// HERE
const platform = new H.service.Platform({
  apikey: 'Au4jzgRCMbS1PQ-hp2phomBA8RBcpH-xq6pLQW0_jV4'
});

const App = () => {

  const [start, setStart] = useState('');
  const [destination, setDestination] = useState('');
  const [request, setRequest] = useState('');
  const [response, setResponse] = useState([]);
  const [loadingPath, setLoadingPath] = useState(false);

  const findBestPath = () => {
    setLoadingPath(old => !old);

    setResponse([])

    axios({
      method: 'post',
      url: process.env.REACT_APP_UWP_API_HOST,
      data: {
        locations: [ start, destination ],
      }
    })
    .then(res => {
      setResponse(res.data);
      console.log(res.data);
      
      setLoadingPath(false);
    })
    .catch(err => {
      setLoadingPath(false);
    })
  }

  const HereMap = () => {
    const mapRef = React.useRef(null);

    React.useLayoutEffect(() => {
      if (!mapRef.current) return;

      let zoom = (response.length > 0) ? {
        center: { ...response[0] || { lat: 0, lng: 0 }},
        zoom: 11
      } : {}
  
      const defaultLayers = platform.createDefaultLayers();
      const hMap = new H.Map(mapRef.current, defaultLayers.vector.normal.map, {
        ...zoom,
        pixelRatio: window.devicePixelRatio || 1
      });
  
      const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(hMap));
      // const ui = H.ui.UI.createDefault(hMap, defaultLayers);
      
      response.forEach(loc => {
        hMap.addObject(new H.map.Marker(loc))
      })
  
      // This will act as a cleanup to run once this hook runs again.
      // This includes when the component unmounds
      return () => {
        hMap.dispose();
      };
    }, [mapRef]);
  
    return <div className="map" ref={mapRef} style={{marginLeft: 400, height: '100vh'}}/>;
  }

  const RenderMap = React.useMemo(() =><HereMap platform={platform} points={response} />, [response])

  return (

    <>
      <div className="sidebar">
        <div style={{padding: 20}}>
          <p className="title noSelect">Weather App</p>

          <div style={{display: 'flex', flexDirection: 'column'}} >
            <FoxyInput value={start} label="Start" onChange={e => setStart(e.target.value)} aplaceholder="Start" />
            <FoxyInput value={destination} label="Destination" onChange={e => setDestination(e.target.value)} aplaceholder="Destination" />
          </div>

          <div>
            <button onClick={findBestPath} disabled={(start == '' || destination == '')} style={{marginTop: 20}}>{loadingPath ? <CircularProgress size="22px" /> : 'Find best path' }</button>
          </div>
          
          {/* { loadingPath && <LoadingPanel />} */}
        </div>
        

      </div>

      <div>

        {RenderMap}
      </div>

     
    </>
  )
}

export default App;