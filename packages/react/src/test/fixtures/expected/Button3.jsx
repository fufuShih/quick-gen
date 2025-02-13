/**
 * @generated 1700000000000
 * @component Button3
 *
 * @param {Object} props Component props
 * @param {*} props.onClick - [auto generate]
 * @param {*} props.children - [auto generate]
 * @param {*} props.disabled - [auto generate]
 * @param {Object} props.props - [auto generate]
 * @returns {JSX.Element} React component
 */
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
