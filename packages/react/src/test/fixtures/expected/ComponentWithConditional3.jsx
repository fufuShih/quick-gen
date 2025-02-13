/**
 * @generated 1700000000000
 * @component ComponentWithConditional3
 *
 * @param {Object} props Component props
 * @param {*} props.flag - [auto generate]
 * @param {*} props.name - [auto generate]
 * @param {*} props.useBlock - [auto generate]
 * @returns {JSX.Element} React component
 */
const ComponentWithConditional3 = ({ flag, name, useBlock }) => {
  if (useBlock) {
    if (flag) {
      return <div>{name}</div>;
    } else {
      return <span>{name}</span>;
    }
  }
  if (flag) return <div>{name}</div>;
  return <span>{name}</span>;
};
  
export default ComponentWithConditional3;
