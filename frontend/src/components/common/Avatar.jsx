import React from 'react'

export default function Avatar({src, alt, size=50}){
    return(
        <img src= {src || '/default-avatar.png'} //uses default img if src is empty
        alt={alt || 'User Avatar'}
        width={50}
        height={50}
        style={{borderRadius: '50%'}} //round
        />
    );
}