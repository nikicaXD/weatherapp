/* global H */
import React from 'react'

export default function HereMap({points, platform}) {
    const mapRef = React.useRef(null);

    
    

    React.useLayoutEffect(() => {
      console.log('MAP ');
      if (!mapRef.current) return;
  
      const defaultLayers = platform.createDefaultLayers();
      const hMap = new H.Map(mapRef.current, defaultLayers.vector.normal.map, {
        // center: { lat: 0, lng: 0 },
        // zoom: 11,
        pixelRatio: window.devicePixelRatio || 1
      });
  
      const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(hMap));
      
      points.forEach(loc => {
        hMap.addObject(new H.map.Marker(loc))
      })

      return () => {
        hMap.dispose();
      };
    }, [mapRef]);
  
    return <div className="map" ref={mapRef} style={{marginLeft: 400, height: '100vh'}}/>;
}