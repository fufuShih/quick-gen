/**
 * @component Button3
 * @description React component
 * @param {Object} props Component props
 * @param {*} props.onClick - onClick prop
 * @param {*} props.children - children prop
 * @param {*} props.disabled - disabled prop
 * @param {Object} props.props - Additional props are spread
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