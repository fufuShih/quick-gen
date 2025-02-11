/**
 * @generated 1700000000000
 * @component ButtonWithConstFunction
 *
 * @param {Object} props Component props
 * @param {*} props.onClick - onClick prop
 * @param {*} props.children - children prop
 * @param {*} props.disabled - disabled prop
 * @param {Object} props.rest - Additional props are spread
 * @returns {JSX.Element} React component
 */
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
