export const TextColor = Object.freeze({
  GREEN: "text-green-600",
  RED: "text-red-600",
  YELLOW: "text-yellow-600",
});

export default function ColoredText({ children, color, className="" }) {
  return (
    <p className={color + " " + className}>
      {children}
    </p>
  );
}
