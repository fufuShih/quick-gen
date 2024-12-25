const ButtonWithConstFunction = (props) => {
  const { onClick, children, disabled, ...rest } = props;

  const handleClick = () => {
    console.log('Button clicked');
    onClick && onClick();
  };

  const getButtonClass = () => {
    return disabled ? 'button-disabled' : 'button-active';
  };

  return (
    <button 
      onClick={handleClick}
      disabled={disabled}
      className={getButtonClass()}
      {...rest}
    >
      {children}
    </button>
  );
};

export default ButtonWithConstFunction; 