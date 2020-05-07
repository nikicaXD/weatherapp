import React, { useState } from 'react';

export default function FoxyInput({label, value, ...rest}) {
    
    return (<>
        <div className={`foxy-input ${value == '' ? '__empty' : '__filled' }`}  >
            <input {...rest} />
            <label  >{label}</label>
            
            
        </div>
        
    </>)
}
