/**
 * @generated 1700000000000
 * @component ComponentWithConditional2
 *
 * @param {Object} props Component props
 * @param {*} props.flag - [auto generate]
 * @param {*} props.name - [auto generate]
 * @returns {JSX.Element} React component
 */
const ComponentWithConditional2 = ({ flag, name }) => {
  if (flag) {
    return <div>{name}</div>;
  } else {
    return <span>{name}</span>;
  }
};
  
export default ComponentWithConditional2;
