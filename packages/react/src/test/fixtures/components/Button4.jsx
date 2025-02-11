const Button4 = (props) => {
  const { onClick, children, disabled, ...rest } = props;

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button4;
