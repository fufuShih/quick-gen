/**
 * @component FunctionButton
 * @description React component
 * @param {Object} props Component props
 * @param {*} props.type - type prop
 * @param {*} props.onClick - onClick prop
 * @param {*} props.children - children prop
 * @returns {JSX.Element} React component
 */
function FunctionButton({ type, onClick, children }) {
  return (
    <button type={type} onClick={onClick}>
      {children}
    </button>
  );
}

export default FunctionButton; 