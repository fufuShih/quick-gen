const Button3 = ({ onClick, children, disabled, ...props }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button3;