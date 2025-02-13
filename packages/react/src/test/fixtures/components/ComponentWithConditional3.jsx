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
