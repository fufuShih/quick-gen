/**
 * @component ButtonWithJSDoc
 * @description React component
 * @param {Object} props Component props
 * @param {*} props.onClick - onClick prop
 * @param {*} props.children - children prop
 * @param {*} props.disabled - disabled prop
 * @returns {JSX.Element} React component
 */
const ButtonWithJSDoc = ({ onClick, children, disabled }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default ButtonWithJSDoc; 