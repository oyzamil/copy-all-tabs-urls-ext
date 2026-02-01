export default ({ className, stroke = '2' }: IconType) => {
  return (
    <svg
      className={cn('size-4', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 4l-8 4l8 4l8 -4l-8 -4" fill="currentColor" />
      <path d="M8 14l-4 2l8 4l8 -4l-4 -2" />
      <path d="M8 10l-4 2l8 4l8 -4l-4 -2" />
    </svg>
  );
};
