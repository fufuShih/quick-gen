/**
 * @generated 1700000000000
 * @component Button
 *
 * @param {Object} props Component props
 * @param {*} props.onClick - [auto generate]
 * @param {*} props.children - [auto generate]
 * @param {*} props.disabled - [auto generate]
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
