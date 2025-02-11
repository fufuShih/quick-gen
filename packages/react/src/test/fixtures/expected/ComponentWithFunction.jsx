/**
 * @component Button
 * @description React component
 * @param {Object} props Component props
 * @param {*} props.onClick - onClick prop
 * @param {*} props.children - children prop
 * @param {*} props.disabled - disabled prop
 * @returns {JSX.Element} React component
 */
export const Button = ({ onClick, children, disabled }) => {
    let result = 0;
    function add(a, b) {
        return a + b;
    }

    const handleClick = () => {
      onClick && onClick();
      result = add(1, 2);
    }

    return (
      <button 
        onClick={handleClick}
        disabled={disabled}
      >
        {children}
      </button>
    );
};

function add(a, b) {
    return a + b;
}
export default add;
