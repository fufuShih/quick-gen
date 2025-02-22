export default function ComponentDefaultFunction(props) {
	return (
		<div>
			{props.textContent ? (
				<div className="text">
                    Text
				</div>
			) : (
				<div className="text2">
                    Text2
				</div>
			)}
		</div>
	);
}
