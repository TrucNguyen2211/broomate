import React from 'react';

const Input = (props) => { 
  return (
    <input 
      type="text" 
      className="input" 
      {...props} 
      placeholder={props.placeholder || "enter text"}
    />
  );
};

export default Input;