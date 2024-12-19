/**
 * @component Button2
 * @description React component
 * @param {Object} props Component props
 * @param {*} props.onClick - onClick prop
 * @param {*} props.children - children prop
 * @param {*} props.disabled - disabled prop
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