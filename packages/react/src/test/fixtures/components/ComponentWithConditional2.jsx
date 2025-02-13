const ComponentWithConditional2 = ({ flag, name }) => {
  if (flag) {
    return <div>{name}</div>;
  } else {
    return <span>{name}</span>;
  }
};
  
export default ComponentWithConditional2;
