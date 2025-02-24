/**
 * @generated 1700000000000
 * @typedef {any} AutoGen
 *
 * @typedef {{
 *  onClick: AutoGen,
 *  children: AutoGen,
 *  disabled: AutoGen,
 * }} ButtonProps
 */

/** @type {(props: ButtonProps) => JSX.Element} */
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
