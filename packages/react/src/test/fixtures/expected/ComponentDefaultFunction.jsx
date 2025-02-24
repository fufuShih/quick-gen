/**
 * @generated 1700000000000
 * @typedef {any} AutoGen
 *
 * @typedef {{
 *  textContent: AutoGen,
 * }} ComponentDefaultFunctionProps
 */

/** @type {(props: ComponentDefaultFunctionProps) => JSX.Element} */
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
