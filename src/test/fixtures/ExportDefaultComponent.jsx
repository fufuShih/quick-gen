export default function ExportDefaultComponent({ title, children }) {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  );
} 