const Button2 = (props) => {
  const { onClick, children, disabled } = props;

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button2;