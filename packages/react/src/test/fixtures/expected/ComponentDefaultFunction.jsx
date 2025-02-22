/**
 * @generated 1700000000000
 * @component ComponentDefaultFunction
 *
 * @param {Object} props Component props
 * @param {*} props.textContent - [auto generate]
 * @returns {JSX.Element} React component
 */
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
