/**
 * @component Button4
 * @description React component
 * @param {Object} props Component props
 * @param {*} props.onClick - onClick prop
 * @param {*} props.children - children prop
 * @param {*} props.disabled - disabled prop
 * @param {Object} props.rest - Additional props are spread
 * @returns {JSX.Element} React component
 */
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