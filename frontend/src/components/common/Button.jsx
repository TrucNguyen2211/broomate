import React from 'react';

function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false,
  type = 'button',
  className = '',
  ...props 
}) {
  const baseStyles = 'font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 focus:ring-teal-500 shadow-md hover:shadow-lg',
    secondary: 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 focus:ring-pink-500 shadow-md hover:shadow-lg',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    outline: 'border-2 border-teal-500 text-teal-600 hover:bg-teal-50 focus:ring-teal-500',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-400'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5',
    lg: 'px-8 py-3 text-lg'
  };
  
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;