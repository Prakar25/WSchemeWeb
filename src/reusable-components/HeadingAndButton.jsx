/* eslint-disable react/prop-types */

import { Link } from "react-router-dom";

const HeadingAndButton = ({
  title,
  buttonText,
  buttonIcon: ButtonIcon,
  onButtonClick,
}) => {
  return (
    <div className="flex justify-between items-center pb-4 mb-10 border-b border-blue-800">
      <div className="font-bold text-lg text-blue-800">{title}</div>
      <Link
        to="#"
        onClick={onButtonClick} // Do this in imported page: onButtonClick={() => { setCurrentPage(!currentPage) }}
        className="flex justify-center items-center p-2 border bg-blue-800 cursor-pointer text-white text-sm rounded px-3 py-2"
      >
        {ButtonIcon && (
          <ButtonIcon className="bg-white text-blue-800 rounded-full mr-2" />
        )}
        {buttonText}
      </Link>
    </div>
  );
};

export default HeadingAndButton;
