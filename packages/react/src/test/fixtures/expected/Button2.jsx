/**
 * @generated 1700000000000
 * @component Button2
 *
 * @param {Object} props Component props
 * @param {*} props.onClick - [auto generate]
 * @param {*} props.children - [auto generate]
 * @param {*} props.disabled - [auto generate]
 * @returns {JSX.Element} React component
 */
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
