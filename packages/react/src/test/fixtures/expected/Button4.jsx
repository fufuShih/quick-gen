/**
 * @generated 1700000000000
 * @component Button4
 *
 * @param {Object} props Component props
 * @param {*} props.onClick - [auto generate]
 * @param {*} props.children - [auto generate]
 * @param {*} props.disabled - [auto generate]
 * @param {Object} props.rest - [auto generate]
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
